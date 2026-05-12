import { VALID_COLLECTIONS } from "./_defaults.js";
import { getKVBinding, kvGet, kvPut } from "./kv_store.js";
import { getPrincipal, hashClientSecret } from "./auth_clients.js";
import { canReadCollection, canWriteCollection, sanitizeForPrincipal } from "./permissions.js";
import { appendOutboxEvent, listOutboxEvents } from "./event_outbox.js";
import { enqueueWebhookDeliveries, processWebhookQueue } from "./webhook_dispatcher.js";

const SINGLE_VALUE_COLLECTIONS = new Set(["routine", "settings", "subjects"]);
const WRITE_ACTIONS = new Set(["add", "update", "delete", "set", "add_admin", "remove_admin", "change_password", "create_api_client", "upsert_webhook"]);

function requestId() {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
      ...extraHeaders,
    },
  });
}

function envelope(data, meta = {}) {
  return {
    data,
    cursor: meta.cursor ?? null,
    hasMore: Boolean(meta.hasMore),
    requestId: meta.requestId || requestId(),
  };
}

function err(code, message, status = 400, reqId = null) {
  return json({ error: message, code, requestId: reqId || requestId() }, status);
}

async function writeAudit(env, record) {
  const rows = await kvGet(env, "audit_log");
  const next = Array.isArray(rows) ? rows : [];
  next.push({
    id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    ...record,
  });
  const maxRows = 3000;
  await kvPut(env, "audit_log", next.length > maxRows ? next.slice(next.length - maxRows) : next);
}

async function enforceRateLimit(env, principal) {
  if (principal.type !== "client") return { ok: true };

  const now = Date.now();
  const minuteBucket = Math.floor(now / 60000);
  const store = await kvGet(env, "rate_limits");
  const key = `${principal.id}:${minuteBucket}`;
  const current = Number(store[key] || 0) + 1;
  const maxPerMinute = 240;
  const next = { ...store, [key]: current };

  const pruneBefore = minuteBucket - 3;
  for (const existing of Object.keys(next)) {
    const parts = existing.split(":");
    const bucket = Number(parts[parts.length - 1]);
    if (bucket < pruneBefore) delete next[existing];
  }
  await kvPut(env, "rate_limits", next);
  if (current > maxPerMinute) return { ok: false, retryAfter: 60 };
  return { ok: true };
}

async function checkIdempotency(env, request, body) {
  const key = request.headers.get("Idempotency-Key");
  if (!key || !body || !WRITE_ACTIONS.has(body.action)) return null;

  const entries = await kvGet(env, "idempotency_keys");
  const existing = entries.find((item) => item.key === key);
  if (existing) return existing.response;
  return { key };
}

async function saveIdempotency(env, idemKey, responsePayload) {
  if (!idemKey || !idemKey.key) return;
  const entries = await kvGet(env, "idempotency_keys");
  const next = Array.isArray(entries) ? entries : [];
  next.push({
    key: idemKey.key,
    at: new Date().toISOString(),
    response: responsePayload,
  });
  const maxItems = 1000;
  await kvPut(env, "idempotency_keys", next.length > maxItems ? next.slice(next.length - maxItems) : next);
}

async function maybeEmitEvent(env, principal, collection, operation, entityId, payload) {
  if (!["add", "update", "delete", "set"].includes(operation)) return null;
  if (["events_outbox", "audit_log", "idempotency_keys", "rate_limits"].includes(collection)) return null;
  const event = await appendOutboxEvent(env, {
    collection,
    operation,
    entityId,
    payload,
    changedBy: principal.id,
    changedByType: principal.type,
  });
  await enqueueWebhookDeliveries(env, event);
  const outbox = await kvGet(env, "events_outbox");
  const index = new Map((outbox.items || []).map((item) => [item.eventId, item]));
  await processWebhookQueue(env, index, 5);
  return event;
}

function mapCollectionFromPath(url) {
  const match = url.pathname.match(/\/api\/data\/events$/);
  if (match) return "events_outbox";
  return null;
}

function hideAdminPasswords(admins) {
  return (admins || []).map(({ password, ...rest }) => rest);
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const reqId = requestId();
  const url = new URL(request.url);

  if (!getKVBinding(env)) return err("kv_missing", "No KV Binding found. Configure KV binding in Cloudflare.", 500, reqId);

  const principal = await getPrincipal(env, request);
  const rl = await enforceRateLimit(env, principal);
  if (!rl.ok) {
    await writeAudit(env, { actor: principal.id, actorType: principal.type, action: "rate_limited", requestId: reqId });
    return err("rate_limited", "Too many requests for this client.", 429, reqId);
  }

  const routeCollection = mapCollectionFromPath(url);
  if (routeCollection === "events_outbox") {
    if (principal.type === "public") return err("unauthorized", "Client credentials are required for outbox polling.", 401, reqId);
    if (!canReadCollection(principal, "events_outbox")) return err("scope_denied", "This client cannot read events outbox.", 403, reqId);

    const since = url.searchParams.get("since") || "0";
    const limit = url.searchParams.get("limit") || "100";
    const page = await listOutboxEvents(env, since, limit);

    await writeAudit(env, { actor: principal.id, actorType: principal.type, action: "poll_events", requestId: reqId, since });
    return json(envelope(page.data, { cursor: page.cursor, hasMore: page.hasMore, requestId: reqId }));
  }

  const collection = url.searchParams.get("collection");
  if (!collection || !VALID_COLLECTIONS.includes(collection)) {
    return err("invalid_collection", "Invalid or missing collection. Valid: " + VALID_COLLECTIONS.join(", "), 400, reqId);
  }
  if (!canReadCollection(principal, collection)) {
    await writeAudit(env, { actor: principal.id, actorType: principal.type, action: "read_denied", collection, requestId: reqId });
    return err("scope_denied", `Read access denied for collection "${collection}".`, 403, reqId);
  }

  const data = await kvGet(env, collection);
  const safeData = collection === "admins" ? hideAdminPasswords(data) : sanitizeForPrincipal(principal, collection, data);

  await writeAudit(env, { actor: principal.id, actorType: principal.type, action: "read", collection, requestId: reqId });

  if (principal.type === "client") {
    return json(envelope(safeData, { requestId: reqId }));
  }
  return json(safeData);
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const reqId = requestId();

  if (!getKVBinding(env)) return err("kv_missing", "No KV Binding found. Configure KV binding in Cloudflare.", 500, reqId);

  let body;
  try {
    body = await request.json();
  } catch {
    return err("invalid_json", "Invalid JSON body.", 400, reqId);
  }

  const { action, collection } = body;
  if (!collection || !VALID_COLLECTIONS.includes(collection)) {
    return err("invalid_collection", "Invalid or missing collection.", 400, reqId);
  }

  // Bootstrap stays open only for first super admin creation.
  if (action === "bootstrap_admin" && collection === "admins") {
    const admins = await kvGet(env, "admins");
    if (admins.length > 0) return err("bootstrap_completed", "Bootstrap already completed.", 409, reqId);
    if (!body.admin?.email || !body.admin?.password) return err("missing_bootstrap_admin", "Missing bootstrap admin credentials.", 400, reqId);
    const firstAdmin = {
      email: body.admin.email,
      password: body.admin.password,
      role: "super_admin",
      addedAt: new Date().toISOString(),
    };
    await kvPut(env, "admins", [firstAdmin]);
    await writeAudit(env, { actor: body.admin.email, actorType: "admin", action: "bootstrap_admin", collection, requestId: reqId });
    return json({ ok: true });
  }

  const principal = await getPrincipal(env, request);
  if (principal.type === "public") {
    await writeAudit(env, { actor: "public", actorType: "public", action: "write_denied", collection, requestId: reqId });
    return err("unauthorized", "Provide valid admin token or client credentials.", 401, reqId);
  }

  const rl = await enforceRateLimit(env, principal);
  if (!rl.ok) {
    await writeAudit(env, { actor: principal.id, actorType: principal.type, action: "rate_limited", requestId: reqId });
    return err("rate_limited", "Too many requests for this client.", 429, reqId);
  }

  if (action === "verify") {
    await writeAudit(env, { actor: principal.id, actorType: principal.type, action: "verify", requestId: reqId });
    if (principal.type === "client") return json(envelope({ ok: true }, { requestId: reqId }));
    return json({ ok: true });
  }

  if (!canWriteCollection(principal, collection, action)) {
    await writeAudit(env, { actor: principal.id, actorType: principal.type, action: "write_denied", collection, requestId: reqId, details: action });
    return err("scope_denied", `Write access denied for ${collection}:${action}`, 403, reqId);
  }

  const idempotent = await checkIdempotency(env, request, body);
  if (idempotent && !idempotent.key) {
    await writeAudit(env, { actor: principal.id, actorType: principal.type, action: "idempotency_hit", collection, requestId: reqId });
    return json(idempotent, 200);
  }

  let payload = null;
  let operation = action;

  if (SINGLE_VALUE_COLLECTIONS.has(collection)) {
    if (action !== "set") return err("invalid_action", `For ${collection}, use action "set" with a "data" field.`, 400, reqId);
    await kvPut(env, collection, body.data);
    payload = { ok: true };
    await maybeEmitEvent(env, principal, collection, "set", null, body.data);
  } else {
    const items = await kvGet(env, collection);

    switch (action) {
      case "add": {
        const newItem = { ...body.item, id: Date.now() };
        items.push(newItem);
        await kvPut(env, collection, items);
        payload = newItem;
        await maybeEmitEvent(env, principal, collection, "add", newItem.id, newItem);
        break;
      }
      case "update": {
        const idx = items.findIndex((i) => String(i.id) === String(body.id));
        if (idx === -1) return err("not_found", "Item not found.", 404, reqId);
        items[idx] = { ...items[idx], ...body.updates };
        await kvPut(env, collection, items);
        payload = items[idx];
        await maybeEmitEvent(env, principal, collection, "update", items[idx].id, items[idx]);
        break;
      }
      case "delete": {
        const target = items.find((i) => String(i.id) === String(body.id)) || null;
        const filtered = items.filter((i) => String(i.id) !== String(body.id));
        await kvPut(env, collection, filtered);
        payload = { ok: true };
        await maybeEmitEvent(env, principal, collection, "delete", body.id, target || { id: body.id });
        break;
      }
      case "set": {
        await kvPut(env, collection, body.data);
        payload = { ok: true };
        await maybeEmitEvent(env, principal, collection, "set", null, body.data);
        break;
      }
      case "add_admin": {
        if (collection !== "admins") return err("invalid_action_collection", "Invalid collection for this action.", 400, reqId);
        const admins = await kvGet(env, "admins");
        if (admins.some((a) => a.email === body.admin.email)) return err("admin_exists", "Admin already exists.", 400, reqId);
        admins.push(body.admin);
        await kvPut(env, "admins", admins);
        payload = { ok: true };
        operation = "add";
        await maybeEmitEvent(env, principal, "admins", "add", body.admin.email, { email: body.admin.email, role: body.admin.role || "admin" });
        break;
      }
      case "remove_admin": {
        if (collection !== "admins") return err("invalid_action_collection", "Invalid collection for this action.", 400, reqId);
        const admins = await kvGet(env, "admins");
        const filtered = admins.filter((a) => a.email !== body.email);
        await kvPut(env, "admins", filtered);
        payload = { ok: true };
        operation = "delete";
        await maybeEmitEvent(env, principal, "admins", "delete", body.email, { email: body.email });
        break;
      }
      case "change_password": {
        if (collection !== "admins") return err("invalid_action_collection", "Invalid collection for this action.", 400, reqId);
        const admins = await kvGet(env, "admins");
        const idx = admins.findIndex((a) => a.email === body.email);
        if (idx === -1) return err("admin_not_found", "Admin not found.", 404, reqId);
        if (admins[idx].password !== body.oldPassword) return err("invalid_password", "Current password incorrect.", 401, reqId);
        admins[idx].password = body.newPassword;
        await kvPut(env, "admins", admins);
        payload = { ok: true };
        operation = "update";
        await maybeEmitEvent(env, principal, "admins", "update", body.email, { email: body.email });
        break;
      }
      case "create_api_client": {
        if (collection !== "api_clients") return err("invalid_action_collection", "Invalid collection for this action.", 400, reqId);
        const clients = await kvGet(env, "api_clients");
        const plainSecret = body.secret || crypto.randomUUID().replace(/-/g, "").slice(0, 32);
        const clientId = body.clientId || `client_${Date.now()}`;
        if (clients.some((c) => c.clientId === clientId)) return err("client_exists", "Client already exists.", 409, reqId);
        const client = {
          clientId,
          name: body.name || clientId,
          hashedSecret: await hashClientSecret(plainSecret),
          status: body.status || "active",
          scopes: Array.isArray(body.scopes) ? body.scopes : [],
          allowedCollections: Array.isArray(body.allowedCollections) ? body.allowedCollections : [],
          allowedActions: Array.isArray(body.allowedActions) ? body.allowedActions : [],
          attachmentAccess: body.attachmentAccess || "metadata_only",
          ipAllowlist: Array.isArray(body.ipAllowlist) ? body.ipAllowlist : [],
          createdAt: new Date().toISOString(),
          rotatedAt: null,
        };
        clients.push(client);
        await kvPut(env, "api_clients", clients);
        payload = { ok: true, clientId, secret: plainSecret };
        break;
      }
      case "upsert_webhook": {
        if (collection !== "webhook_subscriptions") return err("invalid_action_collection", "Invalid collection for this action.", 400, reqId);
        const hooks = await kvGet(env, "webhook_subscriptions");
        const id = body.id || `wh_${Date.now()}`;
        const idx = hooks.findIndex((h) => h.id === id);
        const record = {
          id,
          endpoint: body.endpoint,
          secret: body.secret || "",
          events: Array.isArray(body.events) ? body.events : ["*"],
          status: body.status || "active",
          maxAttempts: Number(body.maxAttempts || 6),
          queue: idx >= 0 ? hooks[idx].queue || [] : [],
          deadLetter: idx >= 0 ? hooks[idx].deadLetter || [] : [],
          updatedAt: new Date().toISOString(),
          createdAt: idx >= 0 ? hooks[idx].createdAt : new Date().toISOString(),
        };
        if (!record.endpoint) return err("missing_endpoint", "Webhook endpoint is required.", 400, reqId);
        if (idx >= 0) hooks[idx] = record;
        else hooks.push(record);
        await kvPut(env, "webhook_subscriptions", hooks);
        payload = { ok: true, id };
        break;
      }
      default:
        return err("invalid_action", "Invalid action. Use: add, update, delete, set, verify.", 400, reqId);
    }
  }

  await writeAudit(env, {
    actor: principal.id,
    actorType: principal.type,
    action: operation,
    collection,
    requestId: reqId,
  });

  const responsePayload = principal.type === "client" ? envelope(payload, { requestId: reqId }) : payload;
  if (idempotent && idempotent.key) await saveIdempotency(env, idempotent, responsePayload);
  return json(responsePayload);
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}

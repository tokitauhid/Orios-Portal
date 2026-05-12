import { kvGet, kvPut } from "./kv_store.js";

function checksumText(input) {
  const data = new TextEncoder().encode(input);
  return crypto.subtle.digest("SHA-256", data).then((buf) =>
    Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join(""),
  );
}

function buildAttachmentMeta(entity) {
  if (!entity || typeof entity !== "object" || !entity.fileData) return null;
  return {
    name: entity.name || entity.title || null,
    format: entity.format || null,
    size: entity.size || null,
    type: entity.type || null,
    hasInlineContent: Boolean(entity.fileData),
  };
}

export async function appendOutboxEvent(env, input) {
  const store = await kvGet(env, "events_outbox");
  const cursor = Number(store.cursor || 0) + 1;
  const occurredAt = new Date().toISOString();

  const payload = input.payload ?? null;
  const payloadDigest = await checksumText(JSON.stringify(payload ?? {}));
  const event = {
    cursor,
    eventId: `evt_${cursor}_${Date.now()}`,
    eventVersion: 1,
    entityType: input.collection,
    entityId: input.entityId ?? null,
    operation: input.operation,
    changedBy: input.changedBy || "system",
    changedByType: input.changedByType || "system",
    timestamp: occurredAt,
    payloadDigest,
    attachment: buildAttachmentMeta(payload),
    payload,
  };

  const maxItems = 2000;
  const items = Array.isArray(store.items) ? [...store.items, event] : [event];
  const trimmed = items.length > maxItems ? items.slice(items.length - maxItems) : items;
  await kvPut(env, "events_outbox", { cursor, items: trimmed });
  return event;
}

export async function listOutboxEvents(env, sinceCursor = 0, limit = 100) {
  const store = await kvGet(env, "events_outbox");
  const items = Array.isArray(store.items) ? store.items : [];
  const normalizedLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
  const normalizedCursor = Math.max(Number(sinceCursor) || 0, 0);
  const filtered = items.filter((event) => Number(event.cursor) > normalizedCursor);
  const page = filtered.slice(0, normalizedLimit);
  const nextCursor = page.length > 0 ? page[page.length - 1].cursor : normalizedCursor;

  return {
    cursor: nextCursor,
    hasMore: filtered.length > page.length,
    data: page,
  };
}

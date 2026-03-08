/**
 * /api/data — Centralized CRUD for all Orios Class collections.
 *
 * Cloudflare KV binding: env.ORIOS_DATA
 * Environment variable: env.ADMIN_SECRET (shared secret for write auth)
 *
 * GET  /api/data?collection=notices          → read collection
 * POST /api/data { action, collection, ... } → write (requires Authorization header)
 */

import { DEFAULTS, VALID_COLLECTIONS } from './_defaults.js';

// ── Helpers ──

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function err(message, status = 400) {
  return json({ error: message }, status);
}

/** Dynamically find the KV namespace. */
function getKVBinding(env) {
  // Try the default explicit name first
  if (env.ORIOS_DATA) return env.ORIOS_DATA;
  
  // Otherwise, return the first valid KVNamespace bound to the env object
  for (const key of Object.keys(env)) {
    if (env[key] && typeof env[key].get === 'function' && typeof env[key].put === 'function') {
      return env[key];
    }
  }
  return null;
}

/** Read a collection from KV, seeding with defaults if it doesn't exist yet. */
async function kvGet(env, collection) {
  const kv = getKVBinding(env);
  if (!kv) return null;

  const raw = await kv.get(collection);
  if (raw !== null) return JSON.parse(raw);
  // Seed defaults
  const defaults = DEFAULTS[collection];
  if (defaults !== undefined) {
    await kv.put(collection, JSON.stringify(defaults));
    return JSON.parse(JSON.stringify(defaults)); // deep clone
  }
  return null;
}

/** Write a collection to KV. */
async function kvPut(env, collection, data) {
  const kv = getKVBinding(env);
  if (kv) await kv.put(collection, JSON.stringify(data));
}

/** Verify admin auth. Token = base64(email:password) checked against stored admins. */
async function isAuthorized(env, request) {
  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return false;

  const token = authHeader.slice(7);
  try {
    const decoded = atob(token);
    const [email, password] = decoded.split(':');
    const admins = await kvGet(env, 'admins');
    return admins.some(a => a.email === email && a.password === password);
  } catch {
    return false;
  }
}

// ── Handlers ──

export async function onRequestGet(context) {
  const { env } = context;
  if (!getKVBinding(env)) return err('No KV Binding found in Cloudflare.', 500);

  const url = new URL(context.request.url);
  const collection = url.searchParams.get('collection');

  if (!collection || !VALID_COLLECTIONS.includes(collection)) {
    return err('Invalid or missing collection. Valid: ' + VALID_COLLECTIONS.join(', '));
  }

  // Admins: strip passwords for public reads
  if (collection === 'admins') {
    const admins = await kvGet(env, 'admins');
    return json(admins.map(({ password, ...rest }) => rest));
  }

  const data = await kvGet(env, collection);
  return json(data);
}

export async function onRequestPost(context) {
  const { env, request } = context;
  if (!getKVBinding(env)) return err('No KV Binding found in Cloudflare.', 500);

  // Auth check for all writes
  if (!(await isAuthorized(env, request))) {
    return err('Unauthorized. Provide a valid admin token.', 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return err('Invalid JSON body.');
  }

  const { action, collection } = body;

  if (!collection || !VALID_COLLECTIONS.includes(collection)) {
    return err('Invalid or missing collection.');
  }

  // ── Singular value stores (routine, settings, subjects) ──
  if (['routine', 'settings', 'subjects'].includes(collection)) {
    if (action === 'set') {
      await kvPut(env, collection, body.data);
      return json({ ok: true });
    }
    if (action === 'verify') {
      return json({ ok: true });
    }
    return err('For ' + collection + ', use action "set" with a "data" field.');
  }

  // ── List collections (notices, events, etc.) ──
  const items = await kvGet(env, collection);

  switch (action) {
    case 'add': {
      const newItem = { ...body.item, id: Date.now() };
      items.push(newItem);
      await kvPut(env, collection, items);
      return json(newItem);
    }

    case 'update': {
      const idx = items.findIndex(i => String(i.id) === String(body.id));
      if (idx === -1) return err('Item not found.', 404);
      items[idx] = { ...items[idx], ...body.updates };
      await kvPut(env, collection, items);
      return json(items[idx]);
    }

    case 'delete': {
      const filtered = items.filter(i => String(i.id) !== String(body.id));
      await kvPut(env, collection, filtered);
      return json({ ok: true });
    }

    case 'set': {
      // Wholesale replace (used by clearDemoData, bulk operations)
      await kvPut(env, collection, body.data);
      return json({ ok: true });
    }

    case 'verify': {
      // Just for auth verification
      return json({ ok: true });
    }

    // ── Admin specific actions ──
    case 'add_admin': {
      if (collection !== 'admins') return err('Invalid collection for this action.');
      const admins = await kvGet(env, 'admins');
      if (admins.some(a => a.email === body.admin.email)) return err('Admin already exists.');
      admins.push(body.admin);
      await kvPut(env, 'admins', admins);
      return json({ ok: true });
    }

    case 'remove_admin': {
      if (collection !== 'admins') return err('Invalid collection for this action.');
      const admins = await kvGet(env, 'admins');
      const filtered = admins.filter(a => a.email !== body.email);
      await kvPut(env, 'admins', filtered);
      return json({ ok: true });
    }

    case 'change_password': {
      if (collection !== 'admins') return err('Invalid collection for this action.');
      const admins = await kvGet(env, 'admins');
      const idx = admins.findIndex(a => a.email === body.email);
      if (idx === -1) return err('Admin not found.');
      if (admins[idx].password !== body.oldPassword) return err('Current password incorrect.', 401);
      admins[idx].password = body.newPassword;
      await kvPut(env, 'admins', admins);
      return json({ ok: true });
    }


    default:
      return err('Invalid action. Use: add, update, delete, set.');
  }
}

// Handle OPTIONS for CORS preflight
export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}

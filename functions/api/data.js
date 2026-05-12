/**
 * Single API endpoint for reading and writing portal data.
 *
 * Uses the KV binding configured in kv_config.js.
 * Reads are collection-based, writes are action-based.
 */

import { DEFAULTS, VALID_COLLECTIONS } from './_defaults.js';
import { KV_BINDING_NAME } from '../../kv_config.js';

// Small response helpers.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}

function err(message, status = 400) {
  return json({ error: message }, status);
}

/** Resolve whichever KV namespace is available in this environment. */
function getKVBinding(env) {
  if (env[KV_BINDING_NAME]) return env[KV_BINDING_NAME];
  if (env.ORIOS_DATA) return env.ORIOS_DATA;
  
  for (const key of Object.keys(env)) {
    if (env[key] && typeof env[key].get === 'function' && typeof env[key].put === 'function') {
      return env[key];
    }
  }
  return null;
}

/** Read a collection and initialize it with defaults on first access. */
async function kvGet(env, collection) {
  const kv = getKVBinding(env);
  if (!kv) return null;

  const raw = await kv.get(collection);
  if (raw !== null) return JSON.parse(raw);
  // If the key is missing, create it from defaults so later reads are stable.
  const defaults = DEFAULTS[collection];
  if (defaults !== undefined) {
    await kv.put(collection, JSON.stringify(defaults));
    return JSON.parse(JSON.stringify(defaults)); // Return a clone, not the shared defaults object.
  }
  return null;
}

/** Persist a collection payload to KV. */
async function kvPut(env, collection, data) {
  const kv = getKVBinding(env);
  if (kv) await kv.put(collection, JSON.stringify(data));
}

/** Validate Bearer token by matching decoded email/password against admins. */
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

// Request handlers.

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  if (!getKVBinding(env)) return err(`No KV Binding found. Configure env.${KV_BINDING_NAME} in Cloudflare.`, 500);

  const collection = url.searchParams.get('collection');

  if (!collection || !VALID_COLLECTIONS.includes(collection)) {
    return err('Invalid or missing collection. Valid: ' + VALID_COLLECTIONS.join(', '));
  }

  // Never expose password fields on public admin reads.
  if (collection === 'admins') {
    const admins = await kvGet(env, 'admins');
    return json(admins.map(({ password, ...rest }) => rest));
  }

  const data = await kvGet(env, collection);
  return json(data);
}

export async function onRequestPost(context) {
  const { env, request } = context;

  const binding = getKVBinding(env);
  if (!binding) return err(`No KV Binding found. Configure env.${KV_BINDING_NAME} in Cloudflare.`, 500);

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

  // Allow first-admin bootstrap only when the admin list is empty.
  if (action === 'bootstrap_admin' && collection === 'admins') {
    const admins = await kvGet(env, 'admins');
    if (admins.length > 0) return err('Bootstrap already completed.', 409);
    if (!body.admin?.email || !body.admin?.password) return err('Missing bootstrap admin credentials.');

    const firstAdmin = {
      email: body.admin.email,
      password: body.admin.password,
      role: 'super_admin',
      addedAt: new Date().toISOString(),
    };

    await kvPut(env, 'admins', [firstAdmin]);
    return json({ ok: true });
  }

  // All non-bootstrap writes require a valid admin token.
  if (!(await isAuthorized(env, request))) {
    return err('Unauthorized. Provide a valid admin token.', 401);
  }

  // Collections stored as a single object/array value.
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

  // Collections stored as item lists.
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
      await kvPut(env, collection, body.data);
      return json({ ok: true });
    }

    case 'verify': {
      // Explicit auth probe used by the frontend during login/session checks.
      return json({ ok: true });
    }

    // Admin account management actions.
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

// Return quickly for CORS preflight requests.
export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}

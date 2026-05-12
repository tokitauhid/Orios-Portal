import { DEFAULTS } from "./_defaults.js";
import { KV_BINDING_NAME } from "../../kv_config.js";

export function getKVBinding(env) {
  if (env[KV_BINDING_NAME]) return env[KV_BINDING_NAME];
  if (env.ORIOS_DATA) return env.ORIOS_DATA;

  for (const key of Object.keys(env)) {
    if (env[key] && typeof env[key].get === "function" && typeof env[key].put === "function") {
      return env[key];
    }
  }
  return null;
}

export async function kvGet(env, collection) {
  const kv = getKVBinding(env);
  if (!kv) return null;

  const raw = await kv.get(collection);
  if (raw !== null) return JSON.parse(raw);

  const defaults = DEFAULTS[collection];
  if (defaults !== undefined) {
    await kv.put(collection, JSON.stringify(defaults));
    return JSON.parse(JSON.stringify(defaults));
  }
  return null;
}

export async function kvPut(env, collection, data) {
  const kv = getKVBinding(env);
  if (kv) await kv.put(collection, JSON.stringify(data));
}

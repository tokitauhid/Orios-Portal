import { kvGet } from "./kv_store.js";

function digestHex(input) {
  const data = new TextEncoder().encode(input);
  return crypto.subtle.digest("SHA-256", data).then((buf) =>
    Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join(""),
  );
}

function getClientHeaders(request) {
  const clientId = request.headers.get("X-Client-Id") || "";
  const clientSecret = request.headers.get("X-Client-Secret") || "";
  return { clientId: clientId.trim(), clientSecret };
}

export async function getAdminPrincipal(env, request) {
  const authHeader = request.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  try {
    const decoded = atob(token);
    const [email, password] = decoded.split(":");
    if (!email || !password) return null;
    const admins = await kvGet(env, "admins");
    const matched = admins.find((a) => a.email === email && a.password === password);
    if (!matched) return null;
    return {
      type: "admin",
      id: matched.email,
      role: matched.role || "admin",
      scopes: ["*"],
    };
  } catch {
    return null;
  }
}

export async function getClientPrincipal(env, request) {
  const { clientId, clientSecret } = getClientHeaders(request);
  if (!clientId || !clientSecret) return null;

  const clients = await kvGet(env, "api_clients");
  const client = clients.find((c) => c.clientId === clientId && c.status !== "disabled");
  if (!client) return null;

  const providedHash = await digestHex(clientSecret);
  if (!client.hashedSecret || providedHash !== client.hashedSecret) return null;

  return {
    type: "client",
    id: client.clientId,
    name: client.name || client.clientId,
    scopes: Array.isArray(client.scopes) ? client.scopes : [],
    allowedCollections: Array.isArray(client.allowedCollections) ? client.allowedCollections : [],
    allowedActions: Array.isArray(client.allowedActions) ? client.allowedActions : [],
    attachmentAccess: client.attachmentAccess || "metadata_only",
    ipAllowlist: Array.isArray(client.ipAllowlist) ? client.ipAllowlist : [],
  };
}

export async function getPrincipal(env, request) {
  const admin = await getAdminPrincipal(env, request);
  if (admin) return admin;
  const client = await getClientPrincipal(env, request);
  if (client) return client;
  return { type: "public", id: "public", scopes: [] };
}

export async function hashClientSecret(secret) {
  return digestHex(secret);
}

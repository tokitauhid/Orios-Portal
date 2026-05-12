/**
 * Unified API & Auth Layer — Cloudflare KV backend via /api/data.
 * Falls back to localStorage for local dev without KV.
 */

const AUTH_KEY = "orios_auth";
const TOKEN_KEY = "orios_admin_token";
const ADMINS_KEY = "orios_admins";
const ADMINS_VERSION_KEY = "orios_admins_v";
const CURRENT_VERSION = "6";

const DEFAULT_ADMINS = [];
const API_BASE = "/api/data";

// Build auth headers from the locally stored admin token.
function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

function authHeaders() {
  const token = getAuthToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

// Check once whether the deployed API endpoint is reachable.
function getAPIUrl(basePath) {
  return basePath;
}

let _apiAvailable = null;

async function isApiAvailable() {
  if (_apiAvailable !== null) return _apiAvailable;
  try {
    const res = await fetch(getAPIUrl(`${API_BASE}?collection=settings`), {
      method: "GET",
      cache: "no-store",
    });
    _apiAvailable = res.status !== 404;
    return _apiAvailable;
  } catch {
    _apiAvailable = false;
    return false;
  }
}

// localStorage fallback for local/dev usage.
function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    return fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Admin store and authentication.
async function getAdminStore() {
  try {
    const ver = localStorage.getItem(ADMINS_VERSION_KEY);
    if (ver !== CURRENT_VERSION) {
      localStorage.setItem(ADMINS_KEY, JSON.stringify(DEFAULT_ADMINS));
      localStorage.setItem(ADMINS_VERSION_KEY, CURRENT_VERSION);
      return [];
    }
    const data = localStorage.getItem(ADMINS_KEY);
    if (data) return JSON.parse(data);
    localStorage.setItem(ADMINS_KEY, JSON.stringify(DEFAULT_ADMINS));
    return [];
  } catch {
    return [];
  }
}

async function saveAdminStore(admins) {
  localStorage.setItem(ADMINS_KEY, JSON.stringify(admins));
  if (await isApiAvailable()) {
    try {
      await fetch(getAPIUrl(API_BASE), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ action: "set", collection: "admins", data: admins }),
      });
    } catch { /* Best-effort remote sync only. */ }
  }
}

export async function signIn(email, password) {
  const token = btoa(`${email}:${password}`);
  let user = null;

  if (await isApiAvailable()) {
    let res = await fetch(getAPIUrl(API_BASE), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "verify", collection: "admins" }),
    });

    if (res.status === 401) {
      const bootstrapRes = await fetch(getAPIUrl(API_BASE), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bootstrap_admin", collection: "admins",
          admin: { email, password, role: "super_admin", addedAt: new Date().toISOString() },
        }),
      });
      if (bootstrapRes.ok) {
        res = await fetch(getAPIUrl(API_BASE), {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: "verify", collection: "admins" }),
        });
      }
    }

    if (!res.ok) {
      if (res.status === 401) throw new Error("Incorrect email or password.");
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Login failed.");
    }

    const adminsRes = await fetch(getAPIUrl(`${API_BASE}?collection=admins`), { cache: "no-store" });
    const admins = await adminsRes.json();
    const admin = admins.find((a) => a.email === email);
    if (!admin) throw new Error("Admin not found in directory.");

    user = { email: admin.email, displayName: admin.email.split("@")[0], role: admin.role };
  } else {
    let admins = await getAdminStore();
    if (admins.length === 0) {
      admins = [{ email, password, role: "super_admin", addedAt: new Date().toISOString() }];
      await saveAdminStore(admins);
    }
    const admin = admins.find((a) => a.email === email);
    if (!admin) throw new Error("Account not found. Contact your super admin for access.");
    if (admin.password !== password) throw new Error("Incorrect password. Please try again.");
    user = { email: admin.email, displayName: admin.email.split("@")[0], role: admin.role };
  }

  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  localStorage.setItem("orios_admin_verified", "true");
  localStorage.setItem(TOKEN_KEY, token);
  return user;
}

export function signOut() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem("orios_admin_verified");
  localStorage.removeItem(TOKEN_KEY);
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY));
  } catch {
    return null;
  }
}

export async function isAdmin(email) {
  if (!email) return false;
  const admins = await getAdmins();
  return admins.some((a) => a.email === email);
}

export async function isSuperAdmin(email) {
  if (!email) return false;
  const admins = await getAdmins();
  return admins.some((a) => a.email === email && a.role === "super_admin");
}

export async function getAdmins() {
  if (await isApiAvailable()) {
    try {
      const res = await fetch(getAPIUrl(`${API_BASE}?collection=admins`), { cache: "no-store" });
      if (res.ok) return await res.json();
    } catch { /* Fall back to local data if remote fetch fails. */ }
  }
  const admins = await getAdminStore();
  return admins.map(({ password, ...rest }) => rest);
}

export async function addAdmin(email, password, role = "admin") {
  if (await isApiAvailable()) {
    const res = await fetch(getAPIUrl(API_BASE), {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ action: "add_admin", collection: "admins", admin: { email, password, role, addedAt: new Date().toISOString() } }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to add admin.");
    }
  } else {
    const admins = await getAdminStore();
    if (admins.some((a) => a.email === email)) throw new Error("This email is already an admin.");
    admins.push({ email, password, role, addedAt: new Date().toISOString() });
    await saveAdminStore(admins);
  }
}

export async function removeAdmin(email) {
  if (await isApiAvailable()) {
    const res = await fetch(getAPIUrl(API_BASE), {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ action: "remove_admin", collection: "admins", email }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to remove admin.");
    }
  } else {
    const admins = (await getAdminStore()).filter((a) => a.email !== email);
    await saveAdminStore(admins);
  }
}

export async function changePassword(email, oldPassword, newPassword) {
  if (await isApiAvailable()) {
    const res = await fetch(getAPIUrl(API_BASE), {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ action: "change_password", collection: "admins", email, oldPassword, newPassword }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to change password.");
    }
  } else {
    const admins = await getAdminStore();
    const admin = admins.find((a) => a.email === email);
    if (!admin) throw new Error("Admin not found.");
    if (admin.password !== oldPassword) throw new Error("Current password is incorrect.");
    admin.password = newPassword;
    await saveAdminStore(admins);
  }
}

// CRUD helpers for list-style collections.
export async function getAll(collectionName) {
  if (await isApiAvailable()) {
    try {
      const res = await fetch(getAPIUrl(`${API_BASE}?collection=${collectionName}`), { cache: "no-store" });
      if (res.ok) return await res.json();
    } catch { /* Fall through to local fallback/default. */ }
  }
  return [];
}

export async function getOne(collectionName, id) {
  const data = await getAll(collectionName);
  return data.find((item) => String(item.id) === String(id)) || null;
}

export async function addItem(collectionName, item) {
  if (await isApiAvailable()) {
    const res = await fetch(getAPIUrl(API_BASE), {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ action: "add", collection: collectionName, item }),
    });
    if (res.ok) return await res.json();
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to add item");
  }
  throw new Error("Database API is unavailable. Cannot add item.");
}

export async function updateItem(collectionName, id, updates) {
  if (await isApiAvailable()) {
    const res = await fetch(getAPIUrl(API_BASE), {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ action: "update", collection: collectionName, id, updates }),
    });
    if (res.ok) return await res.json();
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to update");
  }
  throw new Error("Database API is unavailable. Cannot update item.");
}

export async function deleteItem(collectionName, id) {
  if (await isApiAvailable()) {
    const res = await fetch(getAPIUrl(API_BASE), {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ action: "delete", collection: collectionName, id }),
    });
    if (res.ok) return true;
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to delete");
  }
  throw new Error("Database API is unavailable. Cannot delete item.");
}

// Routine/settings helpers.
export async function getRoutine() {
  if (await isApiAvailable()) {
    try {
      const res = await fetch(getAPIUrl(`${API_BASE}?collection=routine`), { cache: "no-store" });
      if (res.ok) return await res.json();
    } catch { /* Fall through to local fallback/default. */ }
  }
  return lsGet("orios_routine", { timeSlots: [], days: [], schedule: {} });
}

export async function saveRoutine(data) {
  if (await isApiAvailable()) {
    try {
      const res = await fetch(getAPIUrl(API_BASE), {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ action: "set", collection: "routine", data }),
      });
      if (res.ok) return;
    } catch { /* Fall through to local fallback/default. */ }
  }
  lsSet("orios_routine", data);
}

export async function getSettings() {
  const defaults = { welcomeText: "", countryCode: "BD" };
  if (await isApiAvailable()) {
    try {
      const res = await fetch(getAPIUrl(`${API_BASE}?collection=settings`), { cache: "no-store" });
      if (res.ok) {
        const remoteSettings = await res.json();
        return { ...defaults, ...remoteSettings };
      }
    } catch { /* Fall through to local fallback/default. */ }
  }
  return { ...defaults, ...lsGet("orios_settings", {}) };
}

export async function saveSettings(data) {
  if (await isApiAvailable()) {
    try {
      const res = await fetch(getAPIUrl(API_BASE), {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ action: "set", collection: "settings", data }),
      });
      if (res.ok) return;
    } catch { /* Fall through to local fallback/default. */ }
  }
  lsSet("orios_settings", data);
}

export async function getSubjects() {
  if (await isApiAvailable()) {
    try {
      const res = await fetch(getAPIUrl(`${API_BASE}?collection=subjects`));
      if (res.ok) return await res.json();
    } catch { /* Fall through to local fallback/default. */ }
  }
  return lsGet("orios_subjects", []);
}

export async function saveSubjects(subjects) {
  if (await isApiAvailable()) {
    try {
      const res = await fetch(getAPIUrl(API_BASE), {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ action: "set", collection: "subjects", data: subjects }),
      });
      if (res.ok) return;
    } catch { /* Fall through to local fallback/default. */ }
  }
  lsSet("orios_subjects", subjects);
}

export async function autoUpdateStatuses() {
  const now = new Date();
  for (const col of ["assignments", "labReports"]) {
    const items = await getAll(col);
    let changed = false;
    items.forEach((item) => {
      if (item.status === "pending" && item.dueDate) {
        if (new Date(item.dueDate) < now) {
          item.status = "overdue";
          changed = true;
        }
      }
    });
    if (changed) {
      if (await isApiAvailable()) {
        await fetch(getAPIUrl(API_BASE), {
          method: "POST", headers: authHeaders(),
          body: JSON.stringify({ action: "set", collection: col, data: items }),
        });
      }
    }
  }
}

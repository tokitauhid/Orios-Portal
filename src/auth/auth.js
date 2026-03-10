/**
 * Simple Auth — Email & Password authentication.
 * On sign-in, generates a base64 token stored in sessionStorage
 * that db.js sends as Authorization header for KV writes.
 *
 * Admin list is also synced to KV when the API is available.
 */

const AUTH_KEY = 'orios_auth';
const TOKEN_KEY = 'orios_admin_token';
const ADMINS_KEY = 'orios_admins';
const ADMINS_VERSION_KEY = 'orios_admins_v';
const CURRENT_VERSION = '5'; // bump — KV migration

// Default admin credentials — centralised; only super-admins can add more from /admin/admins
const DEFAULT_ADMINS = [
  { email: 'admin', password: 'admin123', role: 'super_admin', addedAt: '2026-01-01T00:00:00.000Z' },
];

const API_BASE = '/api/data';

// ── API availability (cached) ──
let _apiAvailable = null;

function getAPIUrl(basePath) {
  return basePath;
}

async function isApiAvailable() {
  if (_apiAvailable !== null) return _apiAvailable;
  try {
    const res = await fetch(getAPIUrl(`${API_BASE}?collection=settings`), { method: 'GET', cache: 'no-store' });
    _apiAvailable = res.ok || res.status === 400;
    return _apiAvailable;
  } catch {
    _apiAvailable = false;
    return false;
  }
}

function authHeaders() {
  const token = sessionStorage.getItem(TOKEN_KEY) || '';
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// ----- ADMIN STORE (dual: KV + localStorage fallback) -----

async function getAdminStore() {
  // Try KV first
  if (await isApiAvailable()) {
    try {
      // We need the full admin list WITH passwords for auth checks.
      // The public GET strips passwords, so we read from localStorage as the
      // source of truth for login validation. KV is the source of truth for
      // the server-side auth (token-based).
    } catch { /* ignore */ }
  }
  // localStorage is always the local copy
  try {
    const ver = localStorage.getItem(ADMINS_VERSION_KEY);
    if (ver !== CURRENT_VERSION) {
      localStorage.setItem(ADMINS_KEY, JSON.stringify(DEFAULT_ADMINS));
      localStorage.setItem(ADMINS_VERSION_KEY, CURRENT_VERSION);
      return [...DEFAULT_ADMINS];
    }
    const data = localStorage.getItem(ADMINS_KEY);
    if (data) return JSON.parse(data);
    localStorage.setItem(ADMINS_KEY, JSON.stringify(DEFAULT_ADMINS));
    return [...DEFAULT_ADMINS];
  } catch { return [...DEFAULT_ADMINS]; }
}

async function saveAdminStore(admins) {
  localStorage.setItem(ADMINS_KEY, JSON.stringify(admins));
  // Also sync to KV
  if (await isApiAvailable()) {
    try {
      await fetch(getAPIUrl(API_BASE), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ action: 'set', collection: 'admins', data: admins }),
      });
    } catch { /* ignore — local copy is still saved */ }
  }
}

// ----- AUTH FUNCTIONS -----

/**
 * Sign in with email and password
 */
export async function signIn(email, password) {
  // Generate auth token for KV
  const token = btoa(`${email}:${password}`);
  let user = null;

  if (await isApiAvailable()) {
    // Authenticate against KV
    const res = await fetch(getAPIUrl(API_BASE), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action: 'verify', collection: 'admins' }), // collection is just to pass validation
    });

    if (!res.ok) {
      if (res.status === 401) throw new Error('Incorrect email or password.');
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Login failed.');
    }
    
    // Auth succeeded! Fetch admin details (without password obviously)
    const adminsRes = await fetch(getAPIUrl(`${API_BASE}?collection=admins`), { cache: 'no-store' });
    const admins = await adminsRes.json();
    const admin = admins.find(a => a.email === email);
    if (!admin) throw new Error('Admin not found in directory.');
    
    user = {
      email: admin.email,
      displayName: admin.email.split('@')[0],
      role: admin.role,
    };
  } else {
    // Authenticate against localStorage (local dev)
    const admins = await getAdminStore();
    const admin = admins.find(a => a.email === email);

    if (!admin) {
      throw new Error('Account not found. Contact your super admin for access.');
    }
    if (admin.password !== password) {
      throw new Error('Incorrect password. Please try again.');
    }

    user = {
      email: admin.email,
      displayName: admin.email.split('@')[0],
      role: admin.role,
    };
  }

  // Store user info
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  localStorage.setItem('orios_admin_verified', 'true');
  localStorage.setItem(TOKEN_KEY, token);

  return user;
}

/**
 * Sign out
 */
export function signOut() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem('orios_admin_verified');
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Get current user
 */
export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY));
  } catch { return null; }
}

/**
 * Check if a user is an admin
 */
export async function isAdmin(email) {
  if (!email) return false;
  const admins = await getAdmins();
  return admins.some(a => a.email === email);
}

/**
 * Check if a user is a super admin
 */
export async function isSuperAdmin(email) {
  if (!email) return false;
  const admins = await getAdmins();
  return admins.some(a => a.email === email && a.role === 'super_admin');
}

/**
 * Get all admins (passwords stripped)
 */
export async function getAdmins() {
  if (await isApiAvailable()) {
    try {
      const res = await fetch(getAPIUrl(`${API_BASE}?collection=admins`), { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch { /* fall back */ }
  }
  const admins = await getAdminStore();
  return admins.map(({ password, ...rest }) => rest);
}

/**
 * Add a new admin
 */
export async function addAdmin(email, password, role = 'admin') {
  if (await isApiAvailable()) {
    const res = await fetch(getAPIUrl(API_BASE), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ action: 'add_admin', collection: 'admins', admin: { email, password, role, addedAt: new Date().toISOString() } }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to add admin.');
    }
  } else {
    const admins = await getAdminStore();
    if (admins.some(a => a.email === email)) throw new Error('This email is already an admin.');
    admins.push({ email, password, role, addedAt: new Date().toISOString() });
    await saveAdminStore(admins);
  }
}

/**
 * Remove an admin
 */
export async function removeAdmin(email) {
  if (await isApiAvailable()) {
    const res = await fetch(getAPIUrl(API_BASE), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ action: 'remove_admin', collection: 'admins', email }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to remove admin.');
    }
  } else {
    const admins = (await getAdminStore()).filter(a => a.email !== email);
    await saveAdminStore(admins);
  }
}

/**
 * Change password
 */
export async function changePassword(email, oldPassword, newPassword) {
  if (await isApiAvailable()) {
    const res = await fetch(getAPIUrl(API_BASE), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ action: 'change_password', collection: 'admins', email, oldPassword, newPassword }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to change password.');
    }
  } else {
    const admins = await getAdminStore();
    const admin = admins.find(a => a.email === email);
    if (!admin) throw new Error('Admin not found.');
    if (admin.password !== oldPassword) throw new Error('Current password is incorrect.');
    admin.password = newPassword;
    await saveAdminStore(admins);
  }
}

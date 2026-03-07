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

async function isApiAvailable() {
  if (_apiAvailable !== null) return _apiAvailable;
  try {
    const res = await fetch(`${API_BASE}?collection=settings`, { method: 'GET' });
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
      await fetch(API_BASE, {
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
  const admins = await getAdminStore();
  const admin = admins.find(a => a.email === email);

  if (!admin) {
    throw new Error('Account not found. Contact your super admin for access.');
  }
  if (admin.password !== password) {
    throw new Error('Incorrect password. Please try again.');
  }

  const user = {
    email: admin.email,
    displayName: admin.email.split('@')[0],
    role: admin.role,
  };

  // Store user info
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  sessionStorage.setItem('orios_admin_verified', 'true');

  // Generate auth token for KV writes: base64(email:password)
  const token = btoa(`${email}:${password}`);
  sessionStorage.setItem(TOKEN_KEY, token);

  return user;
}

/**
 * Sign out
 */
export function signOut() {
  localStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem('orios_admin_verified');
  sessionStorage.removeItem(TOKEN_KEY);
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
  const admins = await getAdminStore();
  return admins.some(a => a.email === email);
}

/**
 * Check if a user is a super admin
 */
export async function isSuperAdmin(email) {
  if (!email) return false;
  const admins = await getAdminStore();
  return admins.some(a => a.email === email && a.role === 'super_admin');
}

/**
 * Get all admins (passwords stripped)
 */
export async function getAdmins() {
  const admins = await getAdminStore();
  return admins.map(({ password, ...rest }) => rest);
}

/**
 * Add a new admin
 */
export async function addAdmin(email, password, role = 'admin') {
  const admins = await getAdminStore();
  if (admins.some(a => a.email === email)) {
    throw new Error('This email is already an admin.');
  }
  admins.push({ email, password, role, addedAt: new Date().toISOString() });
  await saveAdminStore(admins);
}

/**
 * Remove an admin
 */
export async function removeAdmin(email) {
  const admins = (await getAdminStore()).filter(a => a.email !== email);
  await saveAdminStore(admins);
}

/**
 * Change password
 */
export async function changePassword(email, oldPassword, newPassword) {
  const admins = await getAdminStore();
  const admin = admins.find(a => a.email === email);
  if (!admin) throw new Error('Admin not found.');
  if (admin.password !== oldPassword) throw new Error('Current password is incorrect.');
  admin.password = newPassword;
  await saveAdminStore(admins);
}

/**
 * Simple Auth — Email & Password authentication using localStorage.
 * No external dependencies required.
 */

const AUTH_KEY = 'orios_auth';
const ADMINS_KEY = 'orios_admins';
const ADMINS_VERSION_KEY = 'orios_admins_v';
const CURRENT_VERSION = '3'; // bump this to reset stored admins

// Default admin credentials (empty so the owner must create one)
const DEFAULT_ADMINS = [];

// ----- ADMIN STORE -----

function getAdminStore() {
  try {
    const ver = localStorage.getItem(ADMINS_VERSION_KEY);
    if (ver !== CURRENT_VERSION) {
      // Reset to new defaults when version changes
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

function saveAdminStore(admins) {
  localStorage.setItem(ADMINS_KEY, JSON.stringify(admins));
}

// ----- AUTH FUNCTIONS -----

/**
 * Sign in with email and password
 */
export function signIn(email, password) {
  const admins = getAdminStore();
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

  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  sessionStorage.setItem('orios_admin_verified', 'true');
  return user;
}

/**
 * Sign out
 */
export function signOut() {
  localStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem('orios_admin_verified');
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
export function isAdmin(email) {
  if (!email) return false;
  const admins = getAdminStore();
  return admins.some(a => a.email === email);
}

/**
 * Check if a user is a super admin
 */
export function isSuperAdmin(email) {
  if (!email) return false;
  const admins = getAdminStore();
  return admins.some(a => a.email === email && a.role === 'super_admin');
}

/**
 * Get all admins
 */
export function getAdmins() {
  return getAdminStore().map(({ password, ...rest }) => rest); // strip passwords
}

/**
 * Add a new admin
 */
export function addAdmin(email, password, role = 'admin') {
  const admins = getAdminStore();
  if (admins.some(a => a.email === email)) {
    throw new Error('This email is already an admin.');
  }
  admins.push({ email, password, role, addedAt: new Date().toISOString() });
  saveAdminStore(admins);
}

/**
 * Remove an admin
 */
export function removeAdmin(email) {
  const admins = getAdminStore().filter(a => a.email !== email);
  saveAdminStore(admins);
}

/**
 * Change password
 */
export function changePassword(email, oldPassword, newPassword) {
  const admins = getAdminStore();
  const admin = admins.find(a => a.email === email);
  if (!admin) throw new Error('Admin not found.');
  if (admin.password !== oldPassword) throw new Error('Current password is incorrect.');
  admin.password = newPassword;
  saveAdminStore(admins);
}

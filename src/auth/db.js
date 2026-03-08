/**
 * Database Layer — Cloudflare KV backend via /api/data.
 * Falls back to localStorage for local dev without KV.
 *
 * All public reads go through GET /api/data?collection=X
 * All admin writes go through POST /api/data with Authorization header
 */

import defaultNotices from '../data/notices';
import defaultEvents from '../data/events';
import defaultAssignments from '../data/assignments';
import defaultLabReports from '../data/labReports';
import defaultTeachers from '../data/teachers';
import defaultFiles from '../data/files';
import defaultRoutine from '../data/routine';
import defaultNotes from '../data/notes';

const LOCAL_DEFAULTS = {
  notices: defaultNotices,
  events: defaultEvents,
  assignments: defaultAssignments,
  labReports: defaultLabReports,
  teachers: defaultTeachers,
  files: defaultFiles,
  notes: defaultNotes,
};

const API_BASE = '/api/data';

// ── Auth token helper ──

function getAuthToken() {
  try {
    return localStorage.getItem('orios_admin_token') || '';
  } catch {
    return '';
  }
}

function authHeaders() {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// ── API detection ──
// On Cloudflare Pages, /api/data exists.  In local dev (docusaurus start), it doesn't.
// We cache the result so we only probe once.

function getAPIUrl(basePath) {
  const kvName = lsGet('orios_kv_name', '');
  if (!kvName) return basePath;
  const sep = basePath.includes('?') ? '&' : '?';
  return `${basePath}${sep}kvName=${encodeURIComponent(kvName)}`;
}

let _apiAvailable = null;

async function isApiAvailable() {
  if (_apiAvailable !== null) return _apiAvailable;
  try {
    const res = await fetch(getAPIUrl(`${API_BASE}?collection=settings`), { method: 'GET' });
    _apiAvailable = res.status !== 404; // 404 means the api endpoint physically doesn't exist
    return _apiAvailable;
  } catch {
    _apiAvailable = false;
    return false;
  }
}

// ── Fallback: localStorage (for local dev) ──

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

// ── CRUD (public) ──

export async function getAll(collectionName) {
  if (await isApiAvailable()) {
    try {
      const res = await fetch(getAPIUrl(`${API_BASE}?collection=${collectionName}`));
      if (res.ok) return await res.json();
    } catch { /* fall through */ }
  }
  // No local fallback reading anymore. Just return empty.
  return [];
}

export async function getOne(collectionName, id) {
  const data = await getAll(collectionName);
  return data.find(item => String(item.id) === String(id)) || null;
}

export async function addItem(collectionName, item) {
  if (await isApiAvailable()) {
    try {
      const res = await fetch(getAPIUrl(API_BASE), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ action: 'add', collection: collectionName, item }),
      });
      if (res.ok) return await res.json();
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to add item');
    } catch (e) {
      throw e;
    }
  }
  throw new Error('Database API is unavailable. Cannot add item.');
}

export async function updateItem(collectionName, id, updates) {
  if (await isApiAvailable()) {
    try {
      const res = await fetch(getAPIUrl(API_BASE), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ action: 'update', collection: collectionName, id, updates }),
      });
      if (res.ok) return await res.json();
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to update');
    } catch (e) {
      throw e;
    }
  }
  throw new Error('Database API is unavailable. Cannot update item.');
}

export async function deleteItem(collectionName, id) {
  if (await isApiAvailable()) {
    try {
      const res = await fetch(getAPIUrl(API_BASE), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ action: 'delete', collection: collectionName, id }),
      });
      if (res.ok) return true;
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to delete');
    } catch (e) {
      throw e;
    }
  }
  throw new Error('Database API is unavailable. Cannot delete item.');
}

// ── Routine ──

export async function getRoutine() {
  if (await isApiAvailable()) {
    try {
      const res = await fetch(getAPIUrl(`${API_BASE}?collection=routine`));
      if (res.ok) return await res.json();
    } catch { /* fall through */ }
  }
  return lsGet('orios_routine', defaultRoutine);
}

export async function saveRoutine(data) {
  if (await isApiAvailable()) {
    try {
      const res = await fetch(getAPIUrl(API_BASE), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ action: 'set', collection: 'routine', data }),
      });
      if (res.ok) return;
    } catch { /* fall through */ }
  }
  lsSet('orios_routine', data);
}

// ── Settings ──

export async function getSettings() {
  const defaults = { welcomeText: 'Semester 3/1', countryCode: 'BD' };
  if (await isApiAvailable()) {
    try {
      const res = await fetch(getAPIUrl(`${API_BASE}?collection=settings`));
      if (res.ok) {
        const remoteSettings = await res.json();
        return { ...defaults, ...remoteSettings };
      }
    } catch { /* fall through */ }
  }
  return { ...defaults, ...lsGet('orios_settings', {}) };
}

export async function saveSettings(data) {
  if (await isApiAvailable()) {
    try {
      // Save the custom KV name to localStorage immediately
      if (data.kvBindingName) {
        lsSet('orios_kv_name', data.kvBindingName);
      }
      
      const res = await fetch(getAPIUrl(API_BASE), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ action: 'set', collection: 'settings', data }),
      });
      if (res.ok) return;
    } catch { /* fall through */ }
  }
  lsSet('orios_settings', data);
}

// ── Subjects ──

const DEFAULT_SUBJECTS = [
  'Data Structures', 'Physics', 'Mathematics', 'Database Systems',
  'Electronics', 'English', 'Chemistry',
];

export async function getSubjects() {
  if (await isApiAvailable()) {
    try {
      const res = await fetch(getAPIUrl(`${API_BASE}?collection=subjects`));
      if (res.ok) return await res.json();
    } catch { /* fall through */ }
  }
  return lsGet('orios_subjects', DEFAULT_SUBJECTS);
}

export async function saveSubjects(subjects) {
  if (await isApiAvailable()) {
    try {
      const res = await fetch(getAPIUrl(API_BASE), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ action: 'set', collection: 'subjects', data: subjects }),
      });
      if (res.ok) return;
    } catch { /* fall through */ }
  }
  lsSet('orios_subjects', subjects);
}

// ── Auto-status update ──

export async function autoUpdateStatuses() {
  const now = new Date();

  for (const col of ['assignments', 'labReports']) {
    const items = await getAll(col);
    let changed = false;
    items.forEach(item => {
      if (item.status === 'pending' && item.dueDate) {
        if (new Date(item.dueDate) < now) {
          item.status = 'overdue';
          changed = true;
        }
      }
    });
    if (changed) {
      if (await isApiAvailable()) {
        try {
          await fetch(getAPIUrl(API_BASE), {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ action: 'set', collection: col, data: items }),
          });
        } catch { throw new Error('Failed to auto-update statuses via KV'); }
      } else {
        throw new Error('API unavailable, cannot auto-update statuses');
      }
    }
  }
}

// ── Clear and Reset Data ──

export async function clearDemoData() {
  const collections = ['notices', 'events', 'assignments', 'labReports', 'teachers', 'files', 'notes'];

  if (await isApiAvailable()) {
    for (const col of collections) {
      try {
        await fetch(getAPIUrl(API_BASE), {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ action: 'set', collection: col, data: [] }),
        });
      } catch { /* ignore */ }
    }
    try {
      await fetch(getAPIUrl(API_BASE), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ action: 'set', collection: 'subjects', data: [] }),
      });
    } catch { /* ignore */ }
    // Clear routine schedules
    const routine = await getRoutine();
    const emptySchedule = {};
    if (routine.days) routine.days.forEach(d => emptySchedule[d] = []);
    routine.schedule = emptySchedule;
    try {
      await fetch(getAPIUrl(API_BASE), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ action: 'set', collection: 'routine', data: routine }),
      });
    } catch { /* ignore */ }
  } else {
    throw new Error('API unavailable, cannot clear demo data');
  }
  localStorage.setItem('orios_demo_cleared', 'true');
}

export async function restoreDemoData() {
  if (await isApiAvailable()) {
    try {
      const res = await fetch(getAPIUrl(API_BASE), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ action: 'restore_defaults', collection: 'settings' }),
      });
      if (!res.ok) throw new Error("Failed to restore defaults");
    } catch (e) {
      throw new Error(`Cloudflare API unavailable: ${e.message}`);
    }
  }
  localStorage.removeItem('orios_demo_cleared');
}

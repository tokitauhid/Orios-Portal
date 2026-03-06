/**
 * Database Layer — localStorage-only CRUD operations.
 * No external dependencies.
 */

import defaultNotices from '../data/notices';
import defaultEvents from '../data/events';
import defaultAssignments from '../data/assignments';
import defaultLabReports from '../data/labReports';
import defaultTeachers from '../data/teachers';
import defaultFiles from '../data/files';
import defaultRoutine from '../data/routine';
import defaultNotes from '../data/notes';

const COLLECTIONS = {
  notices: { key: 'orios_notices', defaults: defaultNotices },
  events: { key: 'orios_events', defaults: defaultEvents },
  assignments: { key: 'orios_assignments', defaults: defaultAssignments },
  labReports: { key: 'orios_labReports', defaults: defaultLabReports },
  teachers: { key: 'orios_teachers', defaults: defaultTeachers },
  files: { key: 'orios_files', defaults: defaultFiles },
  notes: { key: 'orios_notes', defaults: defaultNotes },
};

const ROUTINE_KEY = 'orios_routine';
const SETTINGS_KEY = 'orios_settings';
const SUBJECTS_KEY = 'orios_subjects';

const DEFAULT_SUBJECTS = [
  'Data Structures', 'Physics', 'Mathematics', 'Database Systems',
  'Electronics', 'English', 'Chemistry',
];

const DEFAULT_SETTINGS = {
  welcomeText: 'Semester 3/1',
  countryCode: 'BD',
};

// ----- INDEXEDDB WRAPPER -----

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('OriosClassDB', 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('collections')) {
        db.createObjectStore('collections');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getIDB(key) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction('collections', 'readonly');
    const store = tx.objectStore('collections');
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

function setIDB(key, value) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction('collections', 'readwrite');
    const store = tx.objectStore('collections');
    const req = store.put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  }));
}

// ----- HELPERS -----

async function getData(collectionName) {
  const config = COLLECTIONS[collectionName];
  if (!config) return [];
  try {
    const stored = await getIDB(config.key);
    // If undefined in IDB, try migration from localStorage
    if (stored === undefined) {
      const lsStored = localStorage.getItem(config.key);
      if (lsStored) {
        const parsed = JSON.parse(lsStored);
        await setIDB(config.key, parsed);
        return parsed;
      }
      // Populate defaults
      await setIDB(config.key, config.defaults);
      return [...config.defaults];
    }
    return stored;
  } catch {
    return [...config.defaults];
  }
}

async function saveData(collectionName, data) {
  const config = COLLECTIONS[collectionName];
  if (config) await setIDB(config.key, data);
}

// ----- CRUD -----

export async function getAll(collectionName) {
  return await getData(collectionName);
}

export async function getOne(collectionName, id) {
  const data = await getData(collectionName);
  return data.find(item => String(item.id) === String(id)) || null;
}

export async function addItem(collectionName, item) {
  const newItem = { ...item, id: Date.now() };
  const items = await getData(collectionName);
  items.push(newItem);
  await saveData(collectionName, items);
  return newItem;
}

export async function updateItem(collectionName, id, updates) {
  const items = await getData(collectionName);
  const idx = items.findIndex(item => String(item.id) === String(id));
  if (idx !== -1) {
    items[idx] = { ...items[idx], ...updates };
    await saveData(collectionName, items);
    return items[idx];
  }
  return null;
}

export async function deleteItem(collectionName, id) {
  const items = await getData(collectionName);
  const filtered = items.filter(item => String(item.id) !== String(id));
  await saveData(collectionName, filtered);
  return true;
}

// ----- ROUTINE -----

export function getRoutine() {
  try {
    const stored = localStorage.getItem(ROUTINE_KEY);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(ROUTINE_KEY, JSON.stringify(defaultRoutine));
    return { ...defaultRoutine };
  } catch {
    return { ...defaultRoutine };
  }
}

export function saveRoutine(data) {
  localStorage.setItem(ROUTINE_KEY, JSON.stringify(data));
}

// ----- SETTINGS -----

export function getSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    return { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(data) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
}

// ----- SUBJECTS -----

export function getSubjects() {
  try {
    const stored = localStorage.getItem(SUBJECTS_KEY);
    if (stored) return JSON.parse(stored);
    return [...DEFAULT_SUBJECTS];
  } catch {
    return [...DEFAULT_SUBJECTS];
  }
}

export function saveSubjects(subjects) {
  localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects));
}

// ----- AUTO-STATUS UPDATE -----

/**
 * Auto-update assignment/lab report statuses based on due dates.
 * pending → overdue if past due date.
 */
export async function autoUpdateStatuses() {
  const now = new Date();

  for (const col of ['assignments', 'labReports']) {
    const items = await getData(col);
    let changed = false;
    items.forEach(item => {
      if (item.status === 'pending' && item.dueDate) {
        if (new Date(item.dueDate) < now) {
          item.status = 'overdue';
          changed = true;
        }
      }
    });
    if (changed) await saveData(col, items);
  }
}

// ----- CLEAR ALL DATA -----

export async function clearDemoData() {
  // Clear all list collections in IndexedDB
  const keys = Object.values(COLLECTIONS).map(c => c.key);
  for (const k of keys) {
    await setIDB(k, []);
  }

  // Clear subjects from localStorage
  localStorage.setItem(SUBJECTS_KEY, JSON.stringify([]));

  // Set flag so we don't show the clear button again
  localStorage.setItem('orios_demo_cleared', 'true');

  // Clear routine to empty slate, keeping structure
  const routine = getRoutine();
  const emptySchedule = {};
  if (routine.days) {
    routine.days.forEach(d => emptySchedule[d] = []);
  }
  routine.schedule = emptySchedule;
  localStorage.setItem(ROUTINE_KEY, JSON.stringify(routine));
}

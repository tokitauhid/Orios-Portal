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

// ----- HELPERS -----

function getData(collectionName) {
  const config = COLLECTIONS[collectionName];
  if (!config) return [];
  try {
    const stored = localStorage.getItem(config.key);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(config.key, JSON.stringify(config.defaults));
    return [...config.defaults];
  } catch {
    return [...config.defaults];
  }
}

function saveData(collectionName, data) {
  const config = COLLECTIONS[collectionName];
  if (config) localStorage.setItem(config.key, JSON.stringify(data));
}

// ----- CRUD -----

export function getAll(collectionName) {
  return getData(collectionName);
}

export function getOne(collectionName, id) {
  return getData(collectionName).find(item => String(item.id) === String(id)) || null;
}

export function addItem(collectionName, item) {
  const newItem = { ...item, id: Date.now() };
  const items = getData(collectionName);
  items.push(newItem);
  saveData(collectionName, items);
  return newItem;
}

export function updateItem(collectionName, id, updates) {
  const items = getData(collectionName);
  const idx = items.findIndex(item => String(item.id) === String(id));
  if (idx !== -1) {
    items[idx] = { ...items[idx], ...updates };
    saveData(collectionName, items);
    return items[idx];
  }
  return null;
}

export function deleteItem(collectionName, id) {
  const items = getData(collectionName).filter(item => String(item.id) !== String(id));
  saveData(collectionName, items);
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
export function autoUpdateStatuses() {
  const now = new Date();

  ['assignments', 'labReports'].forEach(col => {
    const items = getData(col);
    let changed = false;
    items.forEach(item => {
      if (item.status === 'pending' && item.dueDate) {
        if (new Date(item.dueDate) < now) {
          item.status = 'overdue';
          changed = true;
        }
      }
    });
    if (changed) saveData(col, items);
  });
}

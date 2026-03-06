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

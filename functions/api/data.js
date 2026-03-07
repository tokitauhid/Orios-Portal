/**
 * /api/data — Centralized CRUD for all Orios Class collections.
 *
 * Cloudflare KV binding: env.ORIOS_DATA
 * Environment variable: env.ADMIN_SECRET (shared secret for write auth)
 *
 * GET  /api/data?collection=notices          → read collection
 * POST /api/data { action, collection, ... } → write (requires Authorization header)
 */

// ── Default seed data ──
// Embedded inline so the Pages Function doesn't depend on the Docusaurus src/ tree.

const DEFAULT_NOTICES = [
  { id: 1, text: '🎓 Mid-term exams starting March 20th — Check the exam schedule!', type: 'urgent', date: '2026-03-06' },
  { id: 2, text: '📚 Assignment 4 for Data Structures due March 15th', type: 'assignment', date: '2026-03-05' },
  { id: 3, text: '🔬 Physics Lab Report 3 submission extended to March 18th', type: 'info', date: '2026-03-04' },
  { id: 4, text: '🏆 Inter-department Sports Week — March 25-28', type: 'event', date: '2026-03-03' },
  { id: 5, text: '📢 Class representative meeting on Friday at 2:00 PM', type: 'info', date: '2026-03-02' },
];

const DEFAULT_EVENTS = [
  { id: 1, title: 'Mid-Term Examination', date: '2026-03-20', endDate: '2026-03-28', type: 'exam', description: 'Semester 3/1 mid-term exams for all subjects.' },
  { id: 2, title: 'Sports Week', date: '2026-03-25', endDate: '2026-03-28', type: 'event', description: 'Inter-department sports competition.' },
  { id: 3, title: 'Data Structures Assignment 4 Due', date: '2026-03-15', type: 'deadline', description: 'Submit via the online portal before 11:59 PM.' },
  { id: 4, title: 'Physics Lab Report 3 Due', date: '2026-03-18', type: 'deadline', description: 'Extended deadline — submit hardcopy to Dr. Fatima Rahman.' },
  { id: 5, title: 'CR Meeting', date: '2026-03-07', type: 'event', description: 'At 2:00 PM in the seminar hall.' },
];

const DEFAULT_ASSIGNMENTS = [
  { id: 1, title: 'Data Structures Assignment 4', subject: 'Data Structures', dueDate: '2026-03-15', status: 'pending', description: 'Implement AVL tree insertion & deletion.', submissionLink: '#' },
  { id: 2, title: 'Physics Problem Set 3', subject: 'Physics', dueDate: '2026-03-12', status: 'pending', description: 'Chapters 5-7 problems.', submissionLink: '#' },
  { id: 3, title: 'Database ER Diagram', subject: 'Database Systems', dueDate: '2026-03-10', status: 'submitted', description: 'Design ER diagram for library management system.', submissionLink: '#' },
];

const DEFAULT_LAB_REPORTS = [
  { id: 1, title: 'Physics Lab Report 3', subject: 'Physics', dueDate: '2026-03-18', status: 'pending', description: 'Optical bench experiment.', submissionType: 'hardcopy' },
  { id: 2, title: 'Electronics Lab 2', subject: 'Electronics', dueDate: '2026-03-14', status: 'pending', description: 'Transistor characteristics.', submissionType: 'softcopy' },
  { id: 3, title: 'Chemistry Lab 4', subject: 'Chemistry', dueDate: '2026-03-08', status: 'submitted', description: 'Titration experiment.', submissionType: 'hardcopy' },
];

const DEFAULT_TEACHERS = [
  { id: 1, name: 'Dr. Aminul Islam', title: 'Associate Professor', department: 'CSE', email: 'aminul@example.edu', phone: '01700-000001', office: 'CSE-501', subjects: ['Data Structures'], icon: '👨‍🏫' },
  { id: 2, name: 'Dr. Fatima Rahman', title: 'Assistant Professor', department: 'Physics', email: 'fatima@example.edu', phone: '01700-000002', office: 'SCI-301', subjects: ['Physics'], icon: '👩‍🏫' },
  { id: 3, name: 'Md. Karim Hossain', title: 'Lecturer', department: 'Mathematics', email: 'karim@example.edu', phone: '01700-000003', office: 'MATH-201', subjects: ['Mathematics'], icon: '👨‍🏫' },
  { id: 4, name: 'Ms. Nusrat Jahan', title: 'Lecturer', department: 'CSE', email: 'nusrat@example.edu', phone: '01700-000004', office: 'CSE-403', subjects: ['Database Systems'], icon: '👩‍🏫' },
  { id: 5, name: 'Dr. Rafiq Ahmed', title: 'Professor', department: 'EEE', email: 'rafiq@example.edu', phone: '01700-000005', office: 'EEE-601', subjects: ['Electronics'], icon: '👨‍🏫' },
  { id: 6, name: 'Ms. Tasneem Akter', title: 'Lecturer', department: 'English', email: 'tasneem@example.edu', phone: '01700-000006', office: 'ARTS-202', subjects: ['English'], icon: '👩‍🏫' },
  { id: 7, name: 'Dr. Habibur Rahman', title: 'Associate Professor', department: 'Chemistry', email: 'habibur@example.edu', phone: '01700-000007', office: 'SCI-401', subjects: ['Chemistry'], icon: '👨‍🏫' },
];

const DEFAULT_FILES = [
  { id: 1, name: 'Data Structures Lecture Notes', subject: 'Data Structures', type: 'pdf', size: '2.4 MB', uploadedBy: 'Dr. Aminul Islam', date: '2026-03-01', downloads: 45, password: 'ds2026', icon: '📄' },
  { id: 2, name: 'Physics Lab Manual', subject: 'Physics', type: 'pdf', size: '5.1 MB', uploadedBy: 'Dr. Fatima Rahman', date: '2026-02-28', downloads: 38, password: 'phy2026', icon: '📄' },
  { id: 3, name: 'Database ER Diagram Template', subject: 'Database Systems', type: 'image', size: '890 KB', uploadedBy: 'Ms. Nusrat Jahan', date: '2026-03-03', downloads: 22, password: '', icon: '🖼️' },
  { id: 4, name: 'Linear Algebra Formula Sheet', subject: 'Mathematics', type: 'pdf', size: '1.2 MB', uploadedBy: 'Md. Karim Hossain', date: '2026-03-05', downloads: 67, password: 'math2026', icon: '📄' },
  { id: 5, name: 'Circuit Simulation Files', subject: 'Electronics', type: 'zip', size: '12.3 MB', uploadedBy: 'Dr. Rafiq Ahmed', date: '2026-02-25', downloads: 15, password: 'eee2026', icon: '📦' },
  { id: 6, name: 'Previous Year Question Papers', subject: 'General', type: 'zip', size: '28.5 MB', uploadedBy: 'Class Representative', date: '2026-03-06', downloads: 89, password: 'orios2026', icon: '📦' },
];

const DEFAULT_NOTES = [
  { id: 1, title: 'AVL Tree Notes', subject: 'Data Structures', type: 'doc', format: 'PDF', icon: '📄', description: 'Detailed notes on AVL tree rotations.', author: 'Dr. Aminul Islam', date: '2026-03-01', tags: ['trees', 'balanced'], url: '#' },
  { id: 2, title: 'Optics Summary', subject: 'Physics', type: 'doc', format: 'PDF', icon: '📄', description: 'Summary of chapters 5-7.', author: 'Dr. Fatima Rahman', date: '2026-02-28', tags: ['optics', 'light'], url: '#' },
  { id: 3, title: 'Normalization Guide', subject: 'Database Systems', type: 'link', format: 'URL', icon: '🔗', description: 'Online guide to 1NF-BCNF.', author: 'Ms. Nusrat Jahan', date: '2026-03-03', tags: ['normalization'], url: 'https://example.com' },
];

const DEFAULT_ROUTINE = {
  timeSlots: ['8:00', '9:00', '10:00', '11:00', '12:00', '1:00', '2:00', '3:00', '4:00'],
  days: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  schedule: {
    Saturday: [
      { time: '8:00', subject: 'Data Structures', room: 'CSE-301', teacher: 'Dr. Aminul Islam', type: 'lecture' },
      { time: '9:00', subject: 'Data Structures', room: 'CSE-301', teacher: 'Dr. Aminul Islam', type: 'lecture' },
      { time: '10:00', subject: 'Physics', room: 'SCI-205', teacher: 'Dr. Fatima Rahman', type: 'lecture' },
      { time: '11:00', subject: 'Mathematics', room: 'MATH-102', teacher: 'Md. Karim Hossain', type: 'lecture' },
      null,
      { time: '1:00', subject: 'English', room: 'ARTS-108', teacher: 'Ms. Tasneem Akter', type: 'lecture' },
      { time: '2:00', subject: 'English', room: 'ARTS-108', teacher: 'Ms. Tasneem Akter', type: 'lecture' },
      null, null,
    ],
    Sunday: [
      { time: '8:00', subject: 'Database Systems', room: 'CSE-Lab2', teacher: 'Ms. Nusrat Jahan', type: 'lab' },
      { time: '9:00', subject: 'Database Systems', room: 'CSE-Lab2', teacher: 'Ms. Nusrat Jahan', type: 'lab' },
      { time: '10:00', subject: 'Database Systems', room: 'CSE-Lab2', teacher: 'Ms. Nusrat Jahan', type: 'lab' },
      { time: '11:00', subject: 'Electronics', room: 'EEE-401', teacher: 'Dr. Rafiq Ahmed', type: 'lecture' },
      null,
      { time: '1:00', subject: 'Mathematics', room: 'MATH-102', teacher: 'Md. Karim Hossain', type: 'lecture' },
      { time: '2:00', subject: 'Chemistry', room: 'SCI-210', teacher: 'Dr. Habibur Rahman', type: 'lecture' },
      null, null,
    ],
    Monday: [
      { time: '8:00', subject: 'Physics', room: 'SCI-Lab1', teacher: 'Dr. Fatima Rahman', type: 'lab' },
      { time: '9:00', subject: 'Physics', room: 'SCI-Lab1', teacher: 'Dr. Fatima Rahman', type: 'lab' },
      { time: '10:00', subject: 'Physics', room: 'SCI-Lab1', teacher: 'Dr. Fatima Rahman', type: 'lab' },
      { time: '11:00', subject: 'Data Structures', room: 'CSE-301', teacher: 'Dr. Aminul Islam', type: 'lecture' },
      null,
      { time: '1:00', subject: 'Electronics', room: 'EEE-401', teacher: 'Dr. Rafiq Ahmed', type: 'lecture' },
      { time: '2:00', subject: 'Electronics', room: 'EEE-401', teacher: 'Dr. Rafiq Ahmed', type: 'lecture' },
      null, null,
    ],
    Tuesday: [
      { time: '8:00', subject: 'Mathematics', room: 'MATH-102', teacher: 'Md. Karim Hossain', type: 'lecture' },
      { time: '9:00', subject: 'Chemistry', room: 'SCI-Lab2', teacher: 'Dr. Habibur Rahman', type: 'lab' },
      { time: '10:00', subject: 'Chemistry', room: 'SCI-Lab2', teacher: 'Dr. Habibur Rahman', type: 'lab' },
      { time: '11:00', subject: 'Chemistry', room: 'SCI-Lab2', teacher: 'Dr. Habibur Rahman', type: 'lab' },
      null,
      { time: '1:00', subject: 'Data Structures', room: 'CSE-Lab1', teacher: 'Dr. Aminul Islam', type: 'lab' },
      { time: '2:00', subject: 'Data Structures', room: 'CSE-Lab1', teacher: 'Dr. Aminul Islam', type: 'lab' },
      { time: '3:00', subject: 'Data Structures', room: 'CSE-Lab1', teacher: 'Dr. Aminul Islam', type: 'lab' },
      null,
    ],
    Wednesday: [
      { time: '8:00', subject: 'Database Systems', room: 'CSE-303', teacher: 'Ms. Nusrat Jahan', type: 'lecture' },
      { time: '9:00', subject: 'Database Systems', room: 'CSE-303', teacher: 'Ms. Nusrat Jahan', type: 'lecture' },
      { time: '10:00', subject: 'Physics', room: 'SCI-205', teacher: 'Dr. Fatima Rahman', type: 'lecture' },
      { time: '11:00', subject: 'English', room: 'ARTS-108', teacher: 'Ms. Tasneem Akter', type: 'lecture' },
      null, null, null, null, null,
    ],
    Thursday: [
      { time: '8:00', subject: 'Electronics', room: 'EEE-Lab1', teacher: 'Dr. Rafiq Ahmed', type: 'lab' },
      { time: '9:00', subject: 'Electronics', room: 'EEE-Lab1', teacher: 'Dr. Rafiq Ahmed', type: 'lab' },
      { time: '10:00', subject: 'Electronics', room: 'EEE-Lab1', teacher: 'Dr. Rafiq Ahmed', type: 'lab' },
      { time: '11:00', subject: 'Mathematics', room: 'MATH-102', teacher: 'Md. Karim Hossain', type: 'lecture' },
      null, null, null, null, null,
    ],
  },
};

const DEFAULT_SETTINGS = { welcomeText: 'Semester 3/1', countryCode: 'BD' };

const DEFAULT_SUBJECTS = [
  'Data Structures', 'Physics', 'Mathematics', 'Database Systems',
  'Electronics', 'English', 'Chemistry',
];

const DEFAULT_ADMINS = [
  { email: 'admin', password: 'admin123', role: 'super_admin', addedAt: '2026-01-01T00:00:00.000Z' },
];

const DEFAULTS = {
  notices: DEFAULT_NOTICES,
  events: DEFAULT_EVENTS,
  assignments: DEFAULT_ASSIGNMENTS,
  labReports: DEFAULT_LAB_REPORTS,
  teachers: DEFAULT_TEACHERS,
  files: DEFAULT_FILES,
  notes: DEFAULT_NOTES,
  routine: DEFAULT_ROUTINE,
  settings: DEFAULT_SETTINGS,
  subjects: DEFAULT_SUBJECTS,
  admins: DEFAULT_ADMINS,
};

const VALID_COLLECTIONS = Object.keys(DEFAULTS);

// ── Helpers ──

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function err(message, status = 400) {
  return json({ error: message }, status);
}

/** Read a collection from KV, seeding with defaults if it doesn't exist yet. */
async function kvGet(env, collection) {
  const raw = await env.ORIOS_DATA.get(collection);
  if (raw !== null) return JSON.parse(raw);
  // Seed defaults
  const defaults = DEFAULTS[collection];
  if (defaults !== undefined) {
    await env.ORIOS_DATA.put(collection, JSON.stringify(defaults));
    return JSON.parse(JSON.stringify(defaults)); // deep clone
  }
  return null;
}

/** Write a collection to KV. */
async function kvPut(env, collection, data) {
  await env.ORIOS_DATA.put(collection, JSON.stringify(data));
}

/** Verify admin auth. Token = base64(email:password) checked against stored admins. */
async function isAuthorized(env, request) {
  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return false;

  const token = authHeader.slice(7);
  try {
    const decoded = atob(token);
    const [email, password] = decoded.split(':');
    const admins = await kvGet(env, 'admins');
    return admins.some(a => a.email === email && a.password === password);
  } catch {
    return false;
  }
}

// ── Handlers ──

export async function onRequestGet(context) {
  const { env } = context;
  if (!env.ORIOS_DATA) return err('KV Binding "ORIOS_DATA" is missing in Cloudflare.', 500);

  const url = new URL(context.request.url);
  const collection = url.searchParams.get('collection');

  if (!collection || !VALID_COLLECTIONS.includes(collection)) {
    return err('Invalid or missing collection. Valid: ' + VALID_COLLECTIONS.join(', '));
  }

  // Admins: strip passwords for public reads
  if (collection === 'admins') {
    const admins = await kvGet(env, 'admins');
    return json(admins.map(({ password, ...rest }) => rest));
  }

  const data = await kvGet(env, collection);
  return json(data);
}

export async function onRequestPost(context) {
  const { env, request } = context;
  if (!env.ORIOS_DATA) return err('KV Binding "ORIOS_DATA" is missing in Cloudflare.', 500);

  // Auth check for all writes
  if (!(await isAuthorized(env, request))) {
    return err('Unauthorized. Provide a valid admin token.', 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return err('Invalid JSON body.');
  }

  const { action, collection } = body;

  if (!collection || !VALID_COLLECTIONS.includes(collection)) {
    return err('Invalid or missing collection.');
  }

  // ── Singular value stores (routine, settings, subjects) ──
  if (['routine', 'settings', 'subjects'].includes(collection)) {
    if (action === 'set') {
      await kvPut(env, collection, body.data);
      return json({ ok: true });
    }
    if (action === 'verify') {
      return json({ ok: true });
    }
    return err('For ' + collection + ', use action "set" with a "data" field.');
  }

  // ── List collections (notices, events, etc.) ──
  const items = await kvGet(env, collection);

  switch (action) {
    case 'add': {
      const newItem = { ...body.item, id: Date.now() };
      items.push(newItem);
      await kvPut(env, collection, items);
      return json(newItem);
    }

    case 'update': {
      const idx = items.findIndex(i => String(i.id) === String(body.id));
      if (idx === -1) return err('Item not found.', 404);
      items[idx] = { ...items[idx], ...body.updates };
      await kvPut(env, collection, items);
      return json(items[idx]);
    }

    case 'delete': {
      const filtered = items.filter(i => String(i.id) !== String(body.id));
      await kvPut(env, collection, filtered);
      return json({ ok: true });
    }

    case 'set': {
      // Wholesale replace (used by clearDemoData, bulk operations)
      await kvPut(env, collection, body.data);
      return json({ ok: true });
    }

    case 'verify': {
      // Just for auth verification
      return json({ ok: true });
    }

    // ── Admin specific actions ──
    case 'add_admin': {
      if (collection !== 'admins') return err('Invalid collection for this action.');
      const admins = await kvGet(env, 'admins');
      if (admins.some(a => a.email === body.admin.email)) return err('Admin already exists.');
      admins.push(body.admin);
      await kvPut(env, 'admins', admins);
      return json({ ok: true });
    }

    case 'remove_admin': {
      if (collection !== 'admins') return err('Invalid collection for this action.');
      const admins = await kvGet(env, 'admins');
      const filtered = admins.filter(a => a.email !== body.email);
      await kvPut(env, 'admins', filtered);
      return json({ ok: true });
    }

    case 'change_password': {
      if (collection !== 'admins') return err('Invalid collection for this action.');
      const admins = await kvGet(env, 'admins');
      const idx = admins.findIndex(a => a.email === body.email);
      if (idx === -1) return err('Admin not found.');
      if (admins[idx].password !== body.oldPassword) return err('Current password incorrect.', 401);
      admins[idx].password = body.newPassword;
      await kvPut(env, 'admins', admins);
      return json({ ok: true });
    }


    default:
      return err('Invalid action. Use: add, update, delete, set.');
  }
}

// Handle OPTIONS for CORS preflight
export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}

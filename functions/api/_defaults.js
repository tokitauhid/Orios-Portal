export const DEFAULT_NOTICES = [];
export const DEFAULT_EVENTS = [];
export const DEFAULT_ASSIGNMENTS = [];
export const DEFAULT_LAB_REPORTS = [];
export const DEFAULT_TEACHERS = [];
export const DEFAULT_FILES = [];
export const DEFAULT_NOTES = [];

export const DEFAULT_ROUTINE = {
  timeSlots: ['8:00', '9:00', '10:00', '11:00', '12:00', '1:00', '2:00', '3:00', '4:00'],
  days: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  schedule: {
    Saturday: [null, null, null, null, null, null, null, null, null],
    Sunday: [null, null, null, null, null, null, null, null, null],
    Monday: [null, null, null, null, null, null, null, null, null],
    Tuesday: [null, null, null, null, null, null, null, null, null],
    Wednesday: [null, null, null, null, null, null, null, null, null],
    Thursday: [null, null, null, null, null, null, null, null, null],
    Friday: [null, null, null, null, null, null, null, null, null]
  },
};

export const DEFAULT_SETTINGS = { welcomeText: 'Semester 3/1', countryCode: 'BD' };

export const DEFAULT_SUBJECTS = [];

export const DEFAULT_ADMINS = [
  { email: 'admin', password: 'admin123', role: 'super_admin', addedAt: '2026-01-01T00:00:00.000Z' },
];

export const DEFAULTS = {
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

export const VALID_COLLECTIONS = Object.keys(DEFAULTS);

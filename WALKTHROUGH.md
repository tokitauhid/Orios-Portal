# Admin Panel — Walkthrough

## Authentication

Simple **email + password** login. No Firebase, no external dependencies.

- Default credentials: `admin@orios.edu` / `admin123`
- All data stored in `localStorage`
- Admin can add new admins with email + password via the Admins page

## Admin Pages

| Page | URL |
|------|-----|
| Login | `/admin/login` |
| Dashboard | `/admin` |
| Notices | `/admin/notices` |
| Events | `/admin/events` |
| Assignments | `/admin/assignments` |
| Lab Reports | `/admin/lab-reports` |
| Notes | `/admin/notes-manager` |
| Teachers | `/admin/teachers-manager` |
| Files | `/admin/files-manager` |
| Routine | `/admin/routine-manager` |
| Admin Sharing | `/admin/admins` |

## Files Structure

```
src/auth/
├── auth.js     ← Email/password sign-in, admin roles, setup mode logic
└── db.js       ← IndexedDB async CRUD operations (50MB uploads support)

src/components/
├── AdminLayout/ ← Sidebar nav + auth guard
├── AdminForm/   ← Reusable CRUD modal (with base64 file processing)
└── DataTable/   ← Table with search + edit/delete

src/pages/admin/  ← All 11 admin pages
```

## Recent Enhancements
- **Storage Migration**: Upgraded `localStorage` to asynchronous **`IndexedDB`** to securely support up to **50MB** attachments across Notes, Files, Lab Reports, and Assignments.
- **Datetime Sync**: Native browser `datetime-local` inputs now auto-fill the current local exact moment when admins create new Events or Exams.
- **Setup Wizard**: Implemented a fallback super-admin creation wizard on `/admin/login` if the system boots with 0 registered users.
- **Mascot Integration**: Scattered user-uploaded transparent Easter egg pngs of `Pucu` and `Orio` across 7+ different public pages and the GitHub README.
- **Cleanup**: Purged all generic Docusaurus SVG placeholders, original `.jpg` mascot backgrounds, and the unused Docusaurus `docs/` template scaffolding for a fully bespoke codebase.

## Verification
- ✅ Firebase fully removed (dependency + files)
- ✅ IndexedDB operations are asynchronous and stable
- ✅ Pucu and Orio mascots render with transparent backgrounds
- ✅ `npm run build` compiled with zero errors

# Admin Panel — Walkthrough

## Authentication

Simple **email + password** login. No Firebase, no external dependencies.

- On first login in a fresh environment, the first successful credentials become the initial super admin.
- Admins can add new admins with email + password via the Admins page.

## Admin Pages

| Page          | URL                       |
| ------------- | ------------------------- |
| Login         | `/admin/login`            |
| Dashboard     | `/admin`                  |
| Notices       | `/admin/notices`          |
| Events        | `/admin/events`           |
| Assignments   | `/admin/assignments`      |
| Lab Reports   | `/admin/lab-reports`      |
| Notes         | `/admin/notes-manager`    |
| Teachers      | `/admin/teachers-manager` |
| Files         | `/admin/files-manager`    |
| Routine       | `/admin/routine-manager`  |
| Admin Sharing | `/admin/admins`           |

## Files Structure

```
src/auth/
├── auth.js     ← Email/password sign-in, admin roles, first-admin bootstrap
└── db.js       ← Cloudflare KV-backed async CRUD API layer

src/components/
├── AdminLayout/ ← Sidebar nav + auth guard
├── AdminForm/   ← Reusable CRUD modal (with base64 file processing)
└── DataTable/   ← Table with search + edit/delete

src/pages/admin/  ← All 11 admin pages
```

## Recent Enhancements

- **Datetime Sync**: Native browser `datetime-local` inputs now auto-fill the current local exact moment when admins create new Events or Exams.
- **Bootstrap Flow**: First-admin bootstrap now initializes super admin credentials when the admin store is empty.
- **Mascot Integration**: Scattered user-uploaded transparent Easter egg pngs of `Pucu` and `Orio` across 7+ different public pages and the GitHub README.
- **Cleanup**: Purged all generic Docusaurus SVG placeholders, original `.jpg` mascot backgrounds, and the unused Docusaurus `docs/` template scaffolding for a fully bespoke codebase.

## Verification

- ✅ Firebase fully removed (dependency + files)
- ✅ Cloudflare KV-backed operations are asynchronous and stable
- ✅ Pucu and Orio mascots render with transparent backgrounds
- ✅ `npm run build` compiled with zero errors

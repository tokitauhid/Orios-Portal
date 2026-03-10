<p align="center">
  <img src="https://img.shields.io/badge/Built%20with-Docusaurus-6366f1?style=for-the-badge&logo=docusaurus&logoColor=white" alt="Docusaurus" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/License-GPL%20v3-blue?style=for-the-badge" alt="License" />
</p>

<h1 align="center">🎓 Orios Portal</h1>

<p align="center">
  <strong>A gorgeous class companion website</strong><br/>
  Notes · Assignments · Calendar · Lab Reports · File Sharing · Teacher Directory
</p>

---

## ✨ Features

<img src="./static/img/orio.png" align="right" width="100" />

| Feature                      | Description                                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| 📢 **Notice Board**          | Animated scrolling banner with color-coded announcements                                       |
| 📝 **Notes Hub**             | Subject-grouped notes with mixed-format support (PDFs, images, links, docs) — fully searchable |
| 📋 **Assignments**           | Track due dates, upload up to 50MB file attachments, and submit status                         |
| 🔬 **Lab Reports**           | Manage lab experiment reports, attach data files, and track grading                            |
| 📅 **Interactive Calendar**  | Monthly calendar grid with event dots, click-to-view details                                   |
| 🗓️ **Weekly Routine**        | Responsive, mobile-friendly class schedule table with current-day highlighting                 |
| ⏳ **Exam Countdown**        | Live ticking countdown timers for exams and events with native Datetime sync                   |
| 🔍 **Global Search**         | Full-screen overlay searching across all content types                                         |
| 👨‍🏫 **Teacher Directory**     | Profile cards with contact info, office hours, and department filters                          |
| 📁 **Secure File Sharing**   | Password-protected downloads with modal authentication                                         |
| ☁️ **Cloudflare KV Backend** | Serverless centralized database (`/api/data`) for persistent, shared content                   |
| 🔔 **Toast Notifications**   | Beautiful, animated slide-in toasts for success, error, and warning alerts                     |
| 🛡️ **Setup Wizard**          | Automatic Admin Super-user creation interface on first boot                                    |
| 🌗 **Light / Dark Mode**     | System-aware theme toggle                                                                      |
| 📱 **Mobile-First**          | Fully responsive, optimized for phones and tablets                                             |

## 🎨 Design

<img src="./static/img/pucu.png" align="right" width="100" />

- **Typography** — Inter + Outfit (Google Fonts)
- **Effects** — Glassmorphism, backdrop blur, gradient orbs
- **Animations** — Smooth transitions, floating elements, pulsing countdowns, marquee scroll
- **Color System** — Indigo/purple gradient primary with full dark mode palette

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 20.0

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/orios_class.git
cd orios_class

# Install dependencies
npm install
```

### Development

```bash
npm run start
```

Opens at [http://localhost:3000](http://localhost:3000) with hot reload.

### Production Build

```bash
npm run build
npm run serve
```

## 📁 Project Structure

```
orios_class/
├── docusaurus.config.js         # Site configuration
├── src/
│   ├── css/custom.css           # Global design system
│   ├── data/                    # Static data files
│   │   ├── notices.js           # Announcements
│   │   ├── events.js            # Calendar events & exams
│   │   ├── assignments.js       # Assignment entries
│   │   ├── labReports.js        # Lab report entries
│   │   ├── teachers.js          # Teacher directory
│   │   ├── files.js             # Shared files (with passwords)
│   │   ├── routine.js           # Weekly class schedule
│   │   └── notes.js             # Subject-organized notes
│   ├── components/              # Reusable React components
│   │   ├── NoticeBanner/        # Marquee announcement banner
│   │   ├── CountdownTimer/      # Live exam/event countdown
│   │   ├── FeatureCard/         # Homepage quick-access cards
│   │   ├── EventCalendar/       # Interactive monthly calendar
│   │   ├── TeacherCard/         # Teacher profile cards
│   │   ├── FileShareCard/       # Password-gated file downloads
│   │   ├── RoutineViewer/       # Weekly schedule table
│   │   └── SearchOverlay/       # Global search modal
│   └── pages/                   # All website pages
│       ├── index.js             # Homepage
│       ├── notes.js             # Notes hub
│       ├── assignments.js       # Assignments tracker
│       ├── lab-reports.js       # Lab reports
│       ├── calendar.js          # Calendar & routine
│       ├── teachers.js          # Teacher directory
│       └── files.js             # File sharing
└── static/                      # Static assets
```

## ☁️ Cloudflare Deployment & KV Database

Orios Portal uses **Cloudflare Pages** for hosting and **Cloudflare KV** + **Pages Functions** for a free, serverless, centralized database. When an admin makes changes, they are saved to KV and instantly visible to all users.

### One-Time Setup Instructions

1. **Deploy to Cloudflare:** Connect your GitHub repository to Cloudflare Pages.
2. **Create Database:** In your Cloudflare Dashboard, go to **Workers & Pages → KV** and create a new namespace named `ORIOS_DATA`.
3. **Bind Database:** Go to your Pages project settings → **Settings → Bindings**:
   - Add a KV namespace binding.

- Variable name: `ORIOS_DATA`
- Namespace: Select the KV you just created.

4. **Redeploy:** Trigger a new deployment in Cloudflare so the API endpoints (`/functions/api/data.js`) can access the KV store.

### KV Binding Config

The app now uses a single static config file for KV binding selection:

- `kv_config.js` → `KV_BINDING_NAME`

If you want to switch to a different KV binding later, change only that value and redeploy.

_Note: During local development (`npm run start`), the app will gracefully fall back to `localStorage` since the serverless API is only available on Cloudflare._

## ⚙️ Customization

<img src="./static/img/orio1.png" align="right" width="100" />

### Adding Your Own Data

All content lives in `src/data/`. Edit these files to add your own:

- **Notes** — `notes.js` — Add links, PDFs, images organized by subject
- **Events** — `events.js` — Add exams, assignment deadlines, campus events
- **Teachers** — `teachers.js` — Update with real teacher profiles
- **Routine** — `routine.js` — Set your actual weekly class schedule
- **Assignments** — `assignments.js` — Track your current assignments
- **Files** — `files.js` — Share files with optional password protection

### Branding

Update `docusaurus.config.js` to change:

- Site title and tagline
- Navbar and footer links
- Production URL for deployment

## 🛡️ Security Note

The file-sharing password protection is **client-side only** — suitable for preventing casual access but not cryptographically secure. For production use with sensitive files, implement a server-side authentication backend.

## 📜 License

This project is licensed under the **GNU General Public License v3.0** — see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<p align="center">
  Built with ❤️ for Orios Class
</p>

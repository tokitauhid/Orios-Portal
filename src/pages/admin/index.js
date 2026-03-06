import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import AdminLayout from '@site/src/components/AdminLayout';
import { getAll, getSettings, saveSettings, clearDemoData } from '@site/src/auth/db';
import styles from './dashboard.module.css';

const statCards = [
  { key: 'notices', label: 'Notices', icon: '📢', color: '#f59e0b' },
  { key: 'events', label: 'Events', icon: '📅', color: '#6366f1' },
  { key: 'assignments', label: 'Assignments', icon: '📋', color: '#10b981' },
  { key: 'labReports', label: 'Lab Reports', icon: '🔬', color: '#a855f7' },
  { key: 'notes', label: 'Notes', icon: '📝', color: '#ec4899' },
  { key: 'teachers', label: 'Teachers', icon: '👨‍🏫', color: '#06b6d4' },
  { key: 'files', label: 'Files', icon: '📁', color: '#f97316' },
];

const quickActions = [
  { label: 'Manage Notices', to: '/admin/notices', icon: '📢' },
  { label: 'Manage Events', to: '/admin/events', icon: '📅' },
  { label: 'Manage Assignments', to: '/admin/assignments', icon: '📋' },
  { label: 'Manage Lab Reports', to: '/admin/lab-reports', icon: '🔬' },
  { label: 'Manage Notes', to: '/admin/notes-manager', icon: '📝' },
  { label: 'Manage Teachers', to: '/admin/teachers-manager', icon: '👨‍🏫' },
  { label: 'Manage Files', to: '/admin/files-manager', icon: '📁' },
  { label: 'Edit Routine', to: '/admin/routine-manager', icon: '🗓️' },
  { label: 'Admin Users', to: '/admin/admins', icon: '👥' },
];

export default function AdminDashboard() {
  const [counts, setCounts] = useState({});
  const [settings, setSettings] = useState({ welcomeText: '' });
  const [savedSettings, setSavedSettings] = useState(false);
  const [demoCleared, setDemoCleared] = useState(false);

  useEffect(() => {
    async function loadCounts() {
      const results = {};
      for (const card of statCards) {
        try {
          const data = await getAll(card.key);
          results[card.key] = data.length;
        } catch { results[card.key] = 0; }
      }
      setCounts(results);
    }
    loadCounts();
    setSettings(getSettings());
    setDemoCleared(localStorage.getItem('orios_demo_cleared') === 'true');
  }, []);

  const handleSaveSettings = () => {
    saveSettings(settings);
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 2000);
  };

  const handleClearDemo = async () => {
    if (window.confirm("WARNING: This will delete ALL notices, events, assignments, lab reports, notes, teachers, files, and the routine!\\n\\nAre you absolutely sure you want to turn off demo mode?")) {
      await clearDemoData();
      window.location.reload();
    }
  };

  return (
    <Layout title="Admin Dashboard — Orios Class" description="Admin dashboard">
      <AdminLayout title="📊 Dashboard">
        {/* Settings Section */}
        <section className={styles.settingsSection}>
          <div className={styles.settingsHeader} style={{ position: 'relative' }}>
            <img src="/img/orio.png" alt="Orio" style={{ position: 'absolute', left: '-40px', top: '-30px', width: '60px', height: '60px', objectFit: 'contain', transform: 'rotate(-15deg)', opacity: 0.9 }} />
            <h2 className={styles.sectionTitle}>⚙️ Homepage Settings</h2>
            <button className={styles.saveBtn} onClick={handleSaveSettings}>
              {savedSettings ? '✅ Saved!' : '💾 Save Settings'}
            </button>
          </div>
          <div className={styles.settingsGrid}>
            <div className={styles.field}>
              <label>Welcome Text</label>
              <input
                type="text"
                value={settings.welcomeText}
                onChange={e => setSettings({ ...settings, welcomeText: e.target.value })}
                placeholder="Semester 3/1"
              />
              <span className={styles.hint}>Displayed below "Welcome to Orios Class" on the homepage.</span>
            </div>
            {!demoCleared && (
              <div className={styles.field}>
                <label className={styles.dangerLabel}>System Data</label>
                <p className={styles.hint} style={{ margin: '0 0 8px' }}>Remove all dummy populated pre-fill site data in one click.</p>
                <button className={styles.clearBtn} onClick={handleClearDemo}>
                  🗑️ Turn Off Demo Mode (Clear All Data)
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Stats Section */}
        <section className={styles.stats}>
          {statCards.map((card, i) => (
            <a
              key={card.key}
              href={`/admin/${card.key === 'labReports' ? 'lab-reports' : card.key === 'notes' ? 'notes-manager' : card.key === 'teachers' ? 'teachers-manager' : card.key === 'files' ? 'files-manager' : card.key}`}
              className={styles.statCard}
              style={{ animationDelay: `${i * 60}ms`, borderTopColor: card.color }}
            >
              <span className={styles.statIcon}>{card.icon}</span>
              <span className={styles.statCount}>{counts[card.key] ?? '...'}</span>
              <span className={styles.statLabel}>{card.label}</span>
            </a>
          ))}
        </section>

        {/* Quick Actions */}
        <section className={styles.quickSection}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img src="/img/pucu.png" alt="Pucu" style={{ position: 'absolute', right: '-50px', top: '-10px', width: '60px', height: '60px', objectFit: 'contain', transform: 'rotate(10deg)', opacity: 0.9 }} />
            <h2 className={styles.sectionTitle}>🚀 Quick Actions</h2>
          </div>
          <div className={styles.quickGrid}>
            {quickActions.map((action, i) => (
              <a key={action.to} href={action.to} className={styles.quickCard} style={{ animationDelay: `${i * 40}ms` }}>
                <span className={styles.quickIcon}>{action.icon}</span>
                <span className={styles.quickLabel}>{action.label}</span>
                <span className={styles.quickArrow}>→</span>
              </a>
            ))}
          </div>
        </section>
      </AdminLayout>
    </Layout>
  );
}

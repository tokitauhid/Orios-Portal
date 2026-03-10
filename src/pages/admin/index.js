import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import AdminLayout from '@site/src/components/AdminLayout';
import { getAll, getSettings, saveSettings } from '@site/src/auth/db';
import styles from './dashboard.module.css';

const statCards = [
  { key: 'notices', label: 'Notices', icon: '📢', color: '#f59e0b', bentoClass: 'bentoLarge' },
  { key: 'events', label: 'Events', icon: '📅', color: '#6366f1', bentoClass: 'bentoMedium' },
  { key: 'assignments', label: 'Assignments', icon: '📋', color: '#10b981', bentoClass: 'bentoMedium' },
  { key: 'labReports', label: 'Lab Reports', icon: '🔬', color: '#a855f7', bentoClass: 'bentoSmall' },
  { key: 'notes', label: 'Notes', icon: '📝', color: '#ec4899', bentoClass: 'bentoSmall' },
  { key: 'teachers', label: 'Teachers', icon: '👨‍🏫', color: '#06b6d4', bentoClass: 'bentoWide' },
  { key: 'files', label: 'Files', icon: '📁', color: '#f97316', bentoClass: 'bentoTall' },
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
  const [checkingApi, setCheckingApi] = useState(false);

  useEffect(() => {
    async function init() {
      const results = {};
      for (const card of statCards) {
        try {
          const data = await getAll(card.key);
          results[card.key] = data.length;
        } catch { results[card.key] = 0; }
      }
      setCounts(results);
      const remoteSettings = await getSettings();
      setSettings(remoteSettings);
    }
    init();
  }, []);

  const handleSaveSettings = async () => {
    await saveSettings(settings);
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 2000);
  };

  const handleCheckApi = async () => {
    setCheckingApi(true);
    try {
      const res = await fetch('/api/data?collection=settings');
      if (res.status === 500) {
        alert('❌ KV binding is not found in Cloudflare. Check kv_config.js and your environment binding.');
      } else if (res.ok || res.status === 400 || res.status === 401) {
        alert('✅ API is reachable and KV namespace is properly bound!');
      } else {
        alert('⚠️ Unexpected response from API: ' + res.status);
      }
    } catch (e) {
      alert('❌ API is entirely unreachable. Are you running the Cloudflare worker backend locally?');
    } finally {
      setCheckingApi(false);
    }
  };

  return (
    <Layout title="Admin Dashboard — Orios Class" description="Admin dashboard">
      <AdminLayout title="📊 Dashboard">
        {/* Stats Section */}
        <section>
          <div className={styles.statsGrid}>
            {statCards.map((card, i) => (
              <a
                key={card.key}
                href={`/admin/${card.key === 'labReports' ? 'lab-reports' : card.key === 'notes' ? 'notes-manager' : card.key === 'teachers' ? 'teachers-manager' : card.key === 'files' ? 'files-manager' : card.key}`}
                className={`${styles.statCard} ${styles[card.bentoClass]}`}
                style={{ borderTopColor: card.color, '--card-color': card.color }}
              >
                <div className={styles.statIconWrap} style={{ background: `${card.color}1A`, color: card.color }}>
                  <span className={styles.statIcon}>{card.icon}</span>
                </div>
                <div className={styles.statContent}>
                  <span className={styles.statCount}>{counts[card.key] ?? '...'}</span>
                  <span className={styles.statLabel}>{card.label}</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <div className={styles.sectionHeader}>
            <img src="/img/pucu.png" alt="Pucu" className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>🚀 Quick Actions</h2>
          </div>
          <div className={styles.quickGrid}>
            {quickActions.map((action, i) => (
              <a key={action.to} href={action.to} className={styles.quickCard}>
                <span className={styles.quickIcon}>{action.icon}</span>
                <span className={styles.quickLabel}>{action.label}</span>
                <span className={styles.quickArrow}>→</span>
              </a>
            ))}
          </div>
        </section>

        {/* Settings Section */}
        <section className={styles.settingsSection}>
          <div className={styles.settingsHeader}>
            <img src="/img/orio.png" alt="Orio" className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>⚙️ Homepage Settings</h2>
            <button className={styles.saveBtn} onClick={handleSaveSettings}>
              {savedSettings ? '✅ Saved!' : '💾 Save'}
            </button>
          </div>
          <div className={styles.settingsGrid}>
            <div className={styles.field}>
              <label>Welcome Text</label>
              <input
                type="text"
                value={settings.welcomeText || ''}
                onChange={e => setSettings({ ...settings, welcomeText: e.target.value })}
                placeholder="Semester 3/1"
              />
              <span className={styles.hint}>Displayed below "Welcome to Orios Class" on the homepage.</span>
            </div>
            <div className={styles.field}>
              <label>KV Connectivity Check</label>
              <div style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
                <button 
                  className={styles.saveBtn} 
                  style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                  onClick={handleCheckApi}
                  disabled={checkingApi}
                >
                  {checkingApi ? '...' : '📡 Check'}
                </button>
              </div>
              <span className={styles.hint}>Binding name is controlled in kv_config.js and Cloudflare environment.</span>
            </div>
          </div>
        </section>
      </AdminLayout>
    </Layout>
  );
}

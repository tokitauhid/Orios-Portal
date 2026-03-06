import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import AdminLayout from '@site/src/components/AdminLayout';
import { getAll } from '@site/src/auth/db';
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
  { label: 'Admin Settings', to: '/admin/admins', icon: '👥' },
];

export default function AdminDashboard() {
  const [counts, setCounts] = useState({});

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
  }, []);

  return (
    <Layout title="Admin Dashboard — Orios Class" description="Admin dashboard">
      <AdminLayout title="📊 Dashboard">
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

        <section className={styles.quickSection}>
          <h2 className={styles.sectionTitle}>🚀 Quick Actions</h2>
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

import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import labReportsData from '@site/src/data/labReports';
import { autoUpdateStatuses } from '@site/src/auth/db';
import styles from './lab-reports.module.css';

const statusConfig = {
  pending: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  submitted: { label: 'Submitted', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  overdue: { label: 'Overdue', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
  graded: { label: 'Graded', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
};

function computeStatus(r) {
  if (r.status === 'submitted' || r.status === 'graded') return r.status;
  const now = new Date();
  return (r.dueDate && new Date(r.dueDate) < now) ? 'overdue' : 'pending';
}

export default function LabReportsPage() {
  const [filter, setFilter] = useState('all');
  const [data, setData] = useState(labReportsData);

  useEffect(() => {
    try { autoUpdateStatuses(); } catch {}
    setData(labReportsData.map(r => ({ ...r, status: computeStatus(r) })));
  }, []);

  const subjects = [...new Set(data.map(r => r.subject))];

  const filtered = filter === 'all'
    ? data
    : data.filter(r => r.status === filter || r.subject === filter);

  return (
    <Layout title="Lab Reports — Orios Class" description="Manage lab experiment reports by subject">
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.headerIcon}>🔬</span>
          <div>
            <h1 className={styles.title}>Lab Reports</h1>
            <p className={styles.subtitle}>Manage lab experiment reports organized by subject</p>
          </div>
        </header>

        <div className={styles.filters}>
          <button className={`${styles.pill} ${filter === 'all' ? styles.active : ''}`} onClick={() => setFilter('all')}>All</button>
          <button className={`${styles.pill} ${filter === 'pending' ? styles.active : ''}`} onClick={() => setFilter('pending')}>⏳ Pending</button>
          <button className={`${styles.pill} ${filter === 'submitted' ? styles.active : ''}`} onClick={() => setFilter('submitted')}>✅ Submitted</button>
          <button className={`${styles.pill} ${filter === 'overdue' ? styles.active : ''}`} onClick={() => setFilter('overdue')}>🔴 Overdue</button>
          <button className={`${styles.pill} ${filter === 'graded' ? styles.active : ''}`} onClick={() => setFilter('graded')}>⭐ Graded</button>
          {subjects.map(s => (
            <button key={s} className={`${styles.pill} ${filter === s ? styles.active : ''}`} onClick={() => setFilter(s)}>{s}</button>
          ))}
        </div>

        <div className={styles.grid}>
          {filtered.map((report, i) => {
            const status = statusConfig[report.status] || statusConfig.pending;
            return (
              <div key={report.id} className={styles.card} style={{ animationDelay: `${i * 80}ms` }}>
                <div className={styles.cardTop}>
                  <div className={styles.labBadge}>Lab {report.labNumber}</div>
                  <span className={styles.status} style={{ background: status.bg, color: status.color }}>
                    {status.label}
                    {report.grade && ` — ${report.grade}`}
                  </span>
                </div>
                <h3 className={styles.cardTitle}>{report.title}</h3>
                <span className={styles.subject}>{report.subject}</span>
                <p className={styles.cardDesc}>{report.description}</p>
                <div className={styles.cardFooter}>
                  <span className={styles.date}>🧪 {new Date(report.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <span className={styles.due}>📅 Due: {new Date(report.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}

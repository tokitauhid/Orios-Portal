import React, { useState } from 'react';
import Layout from '@theme/Layout';
import assignmentsData from '@site/src/data/assignments';
import styles from './assignments.module.css';

const statusColors = {
  pending: { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', label: 'Pending' },
  submitted: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', label: 'Submitted' },
  overdue: { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', label: 'Overdue' },
  graded: { bg: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', label: 'Graded' },
};

export default function AssignmentsPage() {
  const [filter, setFilter] = useState('all');
  const subjects = [...new Set(assignmentsData.map(a => a.subject))];

  const filtered = filter === 'all'
    ? assignmentsData
    : assignmentsData.filter(a => a.status === filter || a.subject === filter);

  const getDaysLeft = (dueDate) => {
    const diff = new Date(dueDate) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Due today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  return (
    <Layout title="Assignments — Orios Class" description="Track your assignments and due dates">
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.headerIcon}>📋</span>
          <div>
            <h1 className={styles.title}>Assignments</h1>
            <p className={styles.subtitle}>Track due dates, status, and submissions</p>
          </div>
        </header>

        <div className={styles.filters}>
          <button className={`${styles.pill} ${filter === 'all' ? styles.active : ''}`} onClick={() => setFilter('all')}>All</button>
          <button className={`${styles.pill} ${filter === 'pending' ? styles.active : ''}`} onClick={() => setFilter('pending')}>⏳ Pending</button>
          <button className={`${styles.pill} ${filter === 'submitted' ? styles.active : ''}`} onClick={() => setFilter('submitted')}>✅ Submitted</button>
          <button className={`${styles.pill} ${filter === 'overdue' ? styles.active : ''}`} onClick={() => setFilter('overdue')}>🔴 Overdue</button>
          {subjects.map(s => (
            <button key={s} className={`${styles.pill} ${filter === s ? styles.active : ''}`} onClick={() => setFilter(s)}>{s}</button>
          ))}
        </div>

        <div className={styles.grid}>
          {filtered.map((a, i) => {
            const status = statusColors[a.status];
            return (
              <div key={a.id} className={styles.card} style={{ animationDelay: `${i * 80}ms` }}>
                <div className={styles.cardHeader}>
                  <span className={styles.subject}>{a.subject}</span>
                  <span className={styles.status} style={{ background: status.bg, color: status.color }}>
                    {status.label}
                  </span>
                </div>
                <h3 className={styles.cardTitle}>{a.title}</h3>
                <p className={styles.cardDesc}>{a.description}</p>
                <div className={styles.cardFooter}>
                  <span className={styles.dueDate}>📅 {new Date(a.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <span className={`${styles.daysLeft} ${a.status === 'overdue' ? styles.overdue : ''}`}>
                    {getDaysLeft(a.dueDate)}
                  </span>
                </div>
                <div className={styles.tags}>
                  {a.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}

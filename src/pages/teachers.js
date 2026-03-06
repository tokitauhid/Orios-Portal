import React, { useState } from 'react';
import Layout from '@theme/Layout';
import TeacherCard from '@site/src/components/TeacherCard';
import teachersData from '@site/src/data/teachers';
import styles from './teachers.module.css';

export default function TeachersPage() {
  const [query, setQuery] = useState('');
  const departments = [...new Set(teachersData.map(t => t.department))];
  const [dept, setDept] = useState('All');

  const filtered = teachersData.filter(t => {
    const matchDept = dept === 'All' || t.department === dept;
    const q = query.toLowerCase();
    const matchQuery = !q ||
      t.name.toLowerCase().includes(q) ||
      t.department.toLowerCase().includes(q) ||
      t.subjects.some(s => s.toLowerCase().includes(q));
    return matchDept && matchQuery;
  });

  return (
    <Layout title="Teachers — Orios Class" description="Find all teachers' contact info and office hours">
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.headerIcon}>👨‍🏫</span>
          <div>
            <h1 className={styles.title}>Teacher Directory</h1>
            <p className={styles.subtitle}>Find contact info, office hours, and details for all teachers</p>
          </div>
        </header>

        <div className={styles.filters}>
          <input
            type="text"
            placeholder="🔍 Search teachers..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className={styles.searchInput}
          />
          <div className={styles.pills}>
            <button className={`${styles.pill} ${dept === 'All' ? styles.active : ''}`} onClick={() => setDept('All')}>All Departments</button>
            {departments.map(d => (
              <button key={d} className={`${styles.pill} ${dept === d ? styles.active : ''}`} onClick={() => setDept(d)}>{d}</button>
            ))}
          </div>
        </div>

        <div className={styles.grid}>
          {filtered.map((teacher, i) => (
            <TeacherCard key={teacher.id} teacher={teacher} delay={i * 80} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className={styles.empty}>
            <span>🔍</span>
            <p>No teachers found matching your search.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

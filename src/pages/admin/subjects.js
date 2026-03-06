import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import AdminLayout from '@site/src/components/AdminLayout';
import { getSubjects, saveSubjects } from '@site/src/auth/db';
import styles from './subjects.module.css';

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { setSubjects(getSubjects()); }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    const name = newSubject.trim();
    if (!name) return;
    if (subjects.includes(name)) { setError('Subject already exists.'); return; }
    setError('');
    const updated = [...subjects, name];
    saveSubjects(updated);
    setSubjects(updated);
    setNewSubject('');
    setSuccess(`"${name}" added!`);
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleRemove = (name) => {
    const updated = subjects.filter(s => s !== name);
    saveSubjects(updated);
    setSubjects(updated);
    setSuccess(`"${name}" removed.`);
    setTimeout(() => setSuccess(''), 2000);
  };

  return (
    <Layout title="Manage Subjects — Admin">
      <AdminLayout title="📚 Manage Subjects">
        <div className={styles.info}>
          <span>ℹ️</span>
          <p>Subjects appear as filter options across Notes, Assignments, Lab Reports, and admin forms.</p>
        </div>

        <form onSubmit={handleAdd} className={styles.addForm}>
          <input
            type="text"
            value={newSubject}
            onChange={e => setNewSubject(e.target.value)}
            placeholder="New subject name..."
            className={styles.input}
            required
          />
          <button type="submit" className={styles.addBtn}>➕ Add Subject</button>
        </form>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <div className={styles.list}>
          {subjects.map((sub, i) => (
            <div key={sub} className={styles.subjectCard} style={{ animationDelay: `${i * 30}ms` }}>
              <span className={styles.subjectName}>📖 {sub}</span>
              <button className={styles.removeBtn} onClick={() => handleRemove(sub)}>✕</button>
            </div>
          ))}
        </div>
      </AdminLayout>
    </Layout>
  );
}

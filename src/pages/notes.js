import React, { useState } from 'react';
import Layout from '@theme/Layout';
import SearchOverlay from '@site/src/components/SearchOverlay';
import { getAll, getSubjects } from '@site/src/auth/db';
import styles from './notes.module.css';

export default function NotesPage() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeSubject, setActiveSubject] = useState('All');
  const [activeType, setActiveType] = useState('All');
  const [notesData, setNotesData] = useState([]);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    try { 
      setNotesData(getAll('notes')); 
      setSubjects(getSubjects());
    } catch {}
  }, []);

  const types = ['All', 'doc', 'image', 'link'];

  const filtered = notesData.filter(note => {
    const matchSubject = activeSubject === 'All' || note.subject === activeSubject;
    const matchType = activeType === 'All' || note.type === activeType;
    const q = query.toLowerCase();
    const matchQuery = !q ||
      note.title.toLowerCase().includes(q) ||
      note.subject.toLowerCase().includes(q) ||
      note.description.toLowerCase().includes(q) ||
      note.tags.some(t => t.toLowerCase().includes(q));
    return matchSubject && matchType && matchQuery;
  });

  // Group by subject
  const grouped = {};
  filtered.forEach(note => {
    if (!grouped[note.subject]) grouped[note.subject] = [];
    grouped[note.subject].push(note);
  });

  const typeIcons = { doc: '📄', image: '🖼️', link: '🔗' };

  return (
    <Layout title="Notes — Orios Class" description="Subject-wise notes, links, docs, and resources">
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <span className={styles.headerIcon}>📝</span>
            <div>
              <h1 className={styles.title}>Notes</h1>
              <p className={styles.subtitle}>Subject-wise notes, links, docs, PDFs, and resources</p>
            </div>
          </div>
          <button className={styles.searchTrigger} onClick={() => setSearchOpen(true)}>
            🔍 Search everything...
          </button>
        </header>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <input
              type="text"
              placeholder="🔍 Filter notes..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.filterRow}>
            <div className={styles.pills}>
              <button
                className={`${styles.pill} ${activeSubject === 'All' ? styles.pillActive : ''}`}
                onClick={() => setActiveSubject('All')}
              >All Subjects</button>
              {subjects.map(s => (
                <button
                  key={s}
                  className={`${styles.pill} ${activeSubject === s ? styles.pillActive : ''}`}
                  onClick={() => setActiveSubject(s)}
                >{s}</button>
              ))}
            </div>
            <div className={styles.pills}>
              {types.map(t => (
                <button
                  key={t}
                  className={`${styles.pill} ${styles.typePill} ${activeType === t ? styles.pillActive : ''}`}
                  onClick={() => setActiveType(t)}
                >{t === 'All' ? '📌 All Types' : `${typeIcons[t]} ${t.charAt(0).toUpperCase() + t.slice(1)}`}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Notes grouped by subject */}
        <div className={styles.content}>
          {Object.keys(grouped).length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>📭</span>
              <p>No notes found matching your filters.</p>
            </div>
          ) : (
            Object.entries(grouped).map(([subject, notes]) => (
              <section key={subject} className={styles.subjectSection}>
                <h2 className={styles.subjectTitle}>{subject}</h2>
                <div className={styles.notesGrid}>
                  {notes.map((note, i) => (
                    <a
                      key={note.id}
                      href={note.url}
                      target={note.type === 'link' ? '_blank' : undefined}
                      rel={note.type === 'link' ? 'noopener noreferrer' : undefined}
                      className={styles.noteCard}
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <div className={styles.noteHeader}>
                        <span className={styles.noteIcon}>{note.icon}</span>
                        <span className={styles.noteFormat}>{note.format}</span>
                      </div>
                      <h3 className={styles.noteTitle}>{note.title}</h3>
                      <p className={styles.noteDesc}>{note.description}</p>
                      <div className={styles.noteMeta}>
                        <span className={styles.noteAuthor}>{note.author}</span>
                        <span className={styles.noteDate}>{new Date(note.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className={styles.noteTags}>
                        {note.tags.map(tag => (
                          <span key={tag} className={styles.tag}>#{tag}</span>
                        ))}
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>

      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        data={notesData}
      />
    </Layout>
  );
}

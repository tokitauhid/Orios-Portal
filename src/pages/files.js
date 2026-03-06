import React, { useState } from 'react';
import Layout from '@theme/Layout';
import FileShareCard from '@site/src/components/FileShareCard';
import filesData from '@site/src/data/files';
import styles from './files.module.css';

export default function FilesPage() {
  const [filter, setFilter] = useState('all');
  const subjects = [...new Set(filesData.map(f => f.subject))];

  const filtered = filter === 'all'
    ? filesData
    : filesData.filter(f => f.subject === filter || f.type === filter);

  return (
    <Layout title="File Sharing — Orios Class" description="Securely share and download class materials">
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.headerIcon}>📁</span>
          <div>
            <h1 className={styles.title}>File Sharing</h1>
            <p className={styles.subtitle}>Securely share and download class materials and resources</p>
          </div>
        </header>

        <div className={styles.info}>
          <span className={styles.infoIcon}>🔒</span>
          <p>Some files are password-protected. Contact your class representative for access passwords.</p>
        </div>

        <div className={styles.filters}>
          <button className={`${styles.pill} ${filter === 'all' ? styles.active : ''}`} onClick={() => setFilter('all')}>All</button>
          <button className={`${styles.pill} ${filter === 'pdf' ? styles.active : ''}`} onClick={() => setFilter('pdf')}>📄 PDF</button>
          <button className={`${styles.pill} ${filter === 'zip' ? styles.active : ''}`} onClick={() => setFilter('zip')}>📦 ZIP</button>
          <button className={`${styles.pill} ${filter === 'image' ? styles.active : ''}`} onClick={() => setFilter('image')}>🖼️ Image</button>
          {subjects.map(s => (
            <button key={s} className={`${styles.pill} ${filter === s ? styles.active : ''}`} onClick={() => setFilter(s)}>{s}</button>
          ))}
        </div>

        <div className={styles.grid}>
          {filtered.map((file, i) => (
            <FileShareCard key={file.id} file={file} delay={i * 80} />
          ))}
        </div>
      </div>
    </Layout>
  );
}

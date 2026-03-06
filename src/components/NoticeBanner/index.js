import React from 'react';
import styles from './styles.module.css';

export default function NoticeBanner({ notices }) {
  if (!notices || notices.length === 0) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.label}>
        <span className={styles.labelIcon}>📢</span>
        <span className={styles.labelText}>NOTICES</span>
      </div>
      <div className={styles.track}>
        <div className={styles.marquee}>
          {notices.map((notice, i) => (
            <span key={notice.id} className={styles.item}>
              <span className={`${styles.dot} ${styles[notice.type]}`} />
              {notice.text}
              {i < notices.length - 1 && <span className={styles.separator}>•</span>}
            </span>
          ))}
          {/* Duplicate for seamless loop */}
          {notices.map((notice, i) => (
            <span key={`dup-${notice.id}`} className={styles.item}>
              <span className={`${styles.dot} ${styles[notice.type]}`} />
              {notice.text}
              {i < notices.length - 1 && <span className={styles.separator}>•</span>}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

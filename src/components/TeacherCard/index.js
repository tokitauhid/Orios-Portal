import React from 'react';
import styles from './styles.module.css';

export default function TeacherCard({ teacher, delay = 0 }) {
  return (
    <div className={styles.card} style={{ animationDelay: `${delay}ms` }}>
      <div className={styles.avatar}>{teacher.avatar}</div>
      <div className={styles.info}>
        <h3 className={styles.name}>{teacher.name}</h3>
        <span className={styles.designation}>{teacher.designation}</span>
        <span className={styles.department}>{teacher.department}</span>
      </div>
      <div className={styles.details}>
        <div className={styles.detailRow}>
          <span className={styles.detailIcon}>📧</span>
          <a href={`mailto:${teacher.email}`} className={styles.detailText}>{teacher.email}</a>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailIcon}>📞</span>
          <span className={styles.detailText}>{teacher.phone}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailIcon}>🏢</span>
          <span className={styles.detailText}>{teacher.office}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailIcon}>🕐</span>
          <span className={styles.detailText}>{teacher.officeHours}</span>
        </div>
      </div>
      <div className={styles.subjects}>
        {teacher.subjects.map((s, i) => (
          <span key={i} className={styles.subjectTag}>{s}</span>
        ))}
      </div>
    </div>
  );
}

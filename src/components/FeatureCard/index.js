import React from 'react';
import styles from './styles.module.css';

const featureIcons = {
  notes: '📝',
  assignments: '📋',
  'lab-reports': '🔬',
  calendar: '📅',
  teachers: '👨‍🏫',
  files: '📁',
};

export default function FeatureCard({ title, description, to, type, delay = 0 }) {
  const icon = featureIcons[type] || '📌';

  return (
    <a
      href={to}
      className={styles.card}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={styles.iconWrap}>
        <span className={styles.icon}>{icon}</span>
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      <div className={styles.arrow}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </a>
  );
}

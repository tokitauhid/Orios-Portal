import React, { useState, useEffect } from 'react';
import styles from './styles.module.css';

function getTimeRemaining(targetDate) {
  const now = new Date();
  const target = new Date(targetDate);
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true, totalHours: 0 };
  }

  const totalHours = diff / (1000 * 60 * 60);

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    totalHours,
    expired: false,
  };
}

export default function CountdownTimer({ title, targetDate, type = 'exam', icon = '⏰' }) {
  const [time, setTime] = useState(getTimeRemaining(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeRemaining(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const typeClass = styles[type] || '';
  const isUrgent = time.totalHours <= 24 && !time.expired;

  return (
    <div className={`${styles.countdown} ${typeClass} ${isUrgent ? styles.urgent : ''}`}>
      <div className={styles.header}>
        <span className={styles.icon}>{icon}</span>
        <span className={styles.title}>{title}</span>
        {isUrgent && <span className={styles.urgentBadge}>⚡ LESS THAN 24H</span>}
      </div>
      {time.expired ? (
        <div className={styles.expired}>Event has passed</div>
      ) : isUrgent ? (
        /* Under 24 hours: show HH:MM:SS with urgency */
        <div className={styles.digits}>
          <div className={styles.unit}>
            <span className={`${styles.number} ${styles.urgentNumber}`}>{String(time.hours).padStart(2, '0')}</span>
            <span className={styles.label}>Hours</span>
          </div>
          <span className={styles.colon}>:</span>
          <div className={styles.unit}>
            <span className={`${styles.number} ${styles.urgentNumber}`}>{String(time.minutes).padStart(2, '0')}</span>
            <span className={styles.label}>Min</span>
          </div>
          <span className={styles.colon}>:</span>
          <div className={styles.unit}>
            <span className={`${styles.number} ${styles.seconds} ${styles.urgentNumber}`}>{String(time.seconds).padStart(2, '0')}</span>
            <span className={styles.label}>Sec</span>
          </div>
        </div>
      ) : (
        /* Over 24 hours: show days + hours */
        <div className={styles.digits}>
          <div className={styles.unit}>
            <span className={styles.number}>{String(time.days).padStart(2, '0')}</span>
            <span className={styles.label}>Days</span>
          </div>
          <span className={styles.colon}>:</span>
          <div className={styles.unit}>
            <span className={styles.number}>{String(time.hours).padStart(2, '0')}</span>
            <span className={styles.label}>Hrs</span>
          </div>
          <span className={styles.colon}>:</span>
          <div className={styles.unit}>
            <span className={styles.number}>{String(time.minutes).padStart(2, '0')}</span>
            <span className={styles.label}>Min</span>
          </div>
          <span className={styles.colon}>:</span>
          <div className={styles.unit}>
            <span className={`${styles.number} ${styles.seconds}`}>{String(time.seconds).padStart(2, '0')}</span>
            <span className={styles.label}>Sec</span>
          </div>
        </div>
      )}
      <div className={styles.date}>
        {new Date(targetDate).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </div>
    </div>
  );
}

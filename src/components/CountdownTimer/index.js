import React, { useState, useEffect } from 'react';
import styles from './styles.module.css';

function getTimeRemaining(targetDate) {
  const now = new Date();
  const target = new Date(targetDate);
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
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

  return (
    <div className={`${styles.countdown} ${typeClass}`}>
      <div className={styles.header}>
        <span className={styles.icon}>{icon}</span>
        <span className={styles.title}>{title}</span>
      </div>
      {time.expired ? (
        <div className={styles.expired}>Event has passed</div>
      ) : (
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

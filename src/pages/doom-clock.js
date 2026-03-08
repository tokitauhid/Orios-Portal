import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { getAll } from '@site/src/auth/db';
import styles from './doom-clock.module.css';

// Hook to calculate remaining time
function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate).getTime();

    const update = () => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        isPast: false
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

const CountdownDisplay = ({ date }) => {
  const { days, hours, minutes, seconds, isPast } = useCountdown(date);
  
  if (isPast) {
    return (
      <div className={styles.clockContainer}>
        <div className={styles.timeGrid} style={{ color: '#ef4444', fontWeight: 'bold' }}>DEADLINE PASSED</div>
      </div>
    );
  }

  // Determine danger level based on days left
  let clockClass = styles.clockSafe;
  if (days < 1) clockClass = styles.clockDanger;
  else if (days < 3) clockClass = styles.clockWarning;

  return (
    <div className={`${styles.clockContainer} ${clockClass}`}>
      <div className={styles.timeGrid}>
        <div className={styles.timeUnit}>
          <span className={styles.timeValue}>{String(days).padStart(2, '0')}</span>
          <span className={styles.timeLabel}>Days</span>
        </div>
        <div className={styles.timeUnit}>
          <span className={styles.timeValue}>{String(hours).padStart(2, '0')}</span>
          <span className={styles.timeLabel}>Hrs</span>
        </div>
        <div className={styles.timeUnit}>
          <span className={styles.timeValue}>{String(minutes).padStart(2, '0')}</span>
          <span className={styles.timeLabel}>Min</span>
        </div>
        <div className={styles.timeUnit}>
          <span className={styles.timeValue}>{String(seconds).padStart(2, '0')}</span>
          <span className={styles.timeLabel}>Sec</span>
        </div>
      </div>
    </div>
  );
};

export default function DoomClockPage() {
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [evs, asgns, labs] = await Promise.all([
          getAll('events'),
          getAll('assignments'),
          getAll('labReports')
        ]);

        const now = new Date().getTime();

        const mapped = [
          ...evs
            .filter(e => new Date(e.date).getTime() > now)
            .map(e => ({ id: `ev-${e.id}`, title: e.title, subject: 'Event/Exam', date: e.date, type: e.type, color: e.color || '#10b981', link: '/calendar' })),
          ...asgns
            .filter(a => a.status === 'pending' && new Date(a.dueDate).getTime() > now)
            .map(a => ({ id: `asgn-${a.id}`, title: a.title, subject: a.subject, date: a.dueDate, type: 'assignment', color: '#3b82f6', link: '/assignments' })),
          ...labs
            .filter(l => l.status === 'pending' && new Date(l.dueDate).getTime() > now)
            .map(l => ({ id: `lab-${l.id}`, title: l.title, subject: l.subject, date: l.dueDate, type: 'lab report', color: '#6366f1', link: '/lab-reports' }))
        ];

        mapped.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setDeadlines(mapped);
      } catch (err) {
        console.error("Failed to load doom clock data", err);
      }
      setLoading(false);
    }
    fetchAll();
  }, []);

  return (
    <Layout title="Doom Clock — Orios Class" description="Global countdowns for all exams, assignments, and labs">
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>⏳ Doom Clock</h1>
          <p className={styles.subtitle}>
            Your active countdowns. Submit your work and finish your exams before the clock strikes zero.
          </p>
        </header>

        {loading ? (
          <div className={styles.emptyState}>Synchronizing clocks...</div>
        ) : deadlines.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>🎉 You are completely free!</h2>
            <p>No upcoming exams, pending assignments, or due lab reports.</p>
          </div>
        ) : (
          <div className={styles.activeList}>
            {deadlines.map(d => (
              <Link to={d.link} key={d.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.cardTitle}>{d.title}</h3>
                    <p className={styles.cardSubject}>{d.subject}</p>
                  </div>
                  <span className={styles.cardBadge} style={{ background: d.color }}>
                    {d.type}
                  </span>
                </div>
                <CountdownDisplay date={d.date} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

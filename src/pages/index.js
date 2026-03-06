import React, { useState } from 'react';
import Layout from '@theme/Layout';
import NoticeBanner from '@site/src/components/NoticeBanner';
import CountdownTimer from '@site/src/components/CountdownTimer';
import FeatureCard from '@site/src/components/FeatureCard';
import SearchOverlay from '@site/src/components/SearchOverlay';
import notices from '@site/src/data/notices';
import events from '@site/src/data/events';
import notes from '@site/src/data/notes';
import assignments from '@site/src/data/assignments';
import teachers from '@site/src/data/teachers';
import files from '@site/src/data/files';
import styles from './index.module.css';

// Get upcoming events sorted by date
function getUpcomingEvents(eventList, count = 3) {
  const now = new Date();
  return eventList
    .filter(e => new Date(e.date) > now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, count);
}

// Get next exam
function getNextExam(eventList) {
  const now = new Date();
  return eventList
    .filter(e => e.type === 'exam' && new Date(e.date) > now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
}

const features = [
  { title: 'Notes', description: 'Access subject-wise notes, links, docs, and resources all in one place.', to: '/notes', type: 'notes' },
  { title: 'Assignments', description: 'Track all your assignments with due dates and submission status.', to: '/assignments', type: 'assignments' },
  { title: 'Lab Reports', description: 'Manage lab experiment reports organized by subject.', to: '/lab-reports', type: 'lab-reports' },
  { title: 'Calendar', description: 'Interactive calendar with events, routine, and important dates.', to: '/calendar', type: 'calendar' },
  { title: 'Teachers', description: 'Find contact info, office hours, and details for all teachers.', to: '/teachers', type: 'teachers' },
  { title: 'File Sharing', description: 'Securely share and download class materials and resources.', to: '/files', type: 'files' },
];

export default function Home() {
  const [searchOpen, setSearchOpen] = useState(false);
  const upcomingEvents = getUpcomingEvents(events);
  const nextExam = getNextExam(events);

  // Combine all searchable content
  const searchData = [
    ...notes,
    ...assignments.map(a => ({ ...a, icon: '📋', type: 'assignment' })),
    ...teachers.map(t => ({ ...t, title: t.name, icon: t.avatar, type: 'teacher' })),
    ...files.map(f => ({ ...f, title: f.name, icon: f.icon })),
  ];

  return (
    <Layout
      title="Home — Orios Class Portal"
      description="Your smart class companion — Notes, Assignments, Events & more"
    >
      <NoticeBanner notices={notices} />

      {/* Hero Section */}
      <header className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <span className={styles.heroBadge}>🎓 Class Portal</span>
          <h1 className={styles.heroTitle}>
            Welcome to <span className={styles.gradient}>Orios Class</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Your all-in-one class companion. Access notes, track assignments, check schedules, and stay updated — all in one beautiful place.
          </p>
          <div className={styles.heroActions}>
            <button className={styles.searchBtn} onClick={() => setSearchOpen(true)}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M19 19L14.65 14.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Search everything...
              <span className={styles.searchKbd}>⌘K</span>
            </button>
          </div>
        </div>
        <div className={styles.heroOrbs}>
          <div className={`${styles.orb} ${styles.orb1}`} />
          <div className={`${styles.orb} ${styles.orb2}`} />
          <div className={`${styles.orb} ${styles.orb3}`} />
        </div>
      </header>

      <main className={styles.main}>
        {/* Countdown Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>⏳ Upcoming Countdowns</h2>
            <p className={styles.sectionDesc}>Stay on top of exams and important dates</p>
          </div>
          <div className={styles.countdownGrid}>
            {nextExam && (
              <CountdownTimer
                title={nextExam.title}
                targetDate={nextExam.date}
                type="exam"
                icon="🎯"
              />
            )}
            {upcomingEvents.map(event => (
              <CountdownTimer
                key={event.id}
                title={event.title}
                targetDate={event.date}
                type={event.type}
                icon={event.type === 'exam' ? '📝' : event.type === 'assignment' ? '📋' : '🎉'}
              />
            ))}
          </div>
        </section>

        {/* Quick Access Features */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>🚀 Quick Access</h2>
            <p className={styles.sectionDesc}>Jump to what you need</p>
          </div>
          <div className={styles.featureGrid}>
            {features.map((feature, i) => (
              <FeatureCard key={feature.type} {...feature} delay={i * 80} />
            ))}
          </div>
        </section>
      </main>

      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        data={searchData}
      />
    </Layout>
  );
}

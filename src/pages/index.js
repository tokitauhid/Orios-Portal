import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import NoticeBanner from '@site/src/components/NoticeBanner';
import CountdownTimer from '@site/src/components/CountdownTimer';
import FeatureCard from '@site/src/components/FeatureCard';
import RoutineViewer from '@site/src/components/RoutineViewer';
import SearchOverlay from '@site/src/components/SearchOverlay';
import { getSettings, getRoutine, autoUpdateStatuses, getAll } from '@site/src/auth/db';
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

function getTodayClasses(routineData) {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = dayNames[new Date().getDay()];
  const slots = routineData?.schedule?.[today] || [];
  return slots.filter(Boolean);
}

// Helper to format time to AM/PM
function formatTime(timeStr) {
  try {
    if (!timeStr.includes(':')) return timeStr;
    const [hourStr, minStr] = timeStr.split(':');
    let hour = parseInt(hourStr, 10);
    let isPM = false;
    if (hour >= 12) isPM = true;
    else if (hour >= 1 && hour <= 7) isPM = true;
    const suffix = isPM ? 'PM' : 'AM';
    if (hour === 0) hour = 12;
    else if (hour > 12) hour -= 12;
    return `${hour}:${minStr || '00'} ${suffix}`;
  } catch { return timeStr; }
}

// Get pending assignment count
function getPendingCount(list) {
  const now = new Date();
  return list.filter(a => {
    if (a.status === 'pending' && a.dueDate && new Date(a.dueDate) >= now) return true;
    return false;
  }).length;
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
  const [welcomeText, setWelcomeText] = useState('Semester 3/1');
  const [liveRoutine, setLiveRoutine] = useState({ days: [], timeSlots: [], schedule: {} });
  const [notices, setNotices] = useState([]);
  const [events, setEvents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    try {
      autoUpdateStatuses();
      const settings = getSettings();
      if (settings.welcomeText) setWelcomeText(settings.welcomeText);
      const savedRoutine = getRoutine();
      if (savedRoutine?.days) setLiveRoutine(savedRoutine);

      setNotices(getAll('notices'));
      setEvents(getAll('events'));
      setNotes(getAll('notes'));
      setAssignments(getAll('assignments'));
      setTeachers(getAll('teachers'));
      setFiles(getAll('files'));
    } catch {}
  }, []);

  const upcomingEvents = getUpcomingEvents(events);
  const nextExam = getNextExam(events);
  const todayClasses = getTodayClasses(liveRoutine);
  const pendingAssignments = getPendingCount(assignments);

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
          <p className={styles.welcomeBox}>{welcomeText}</p>
          <p className={styles.heroSubtitle}>
            Your all-in-one class companion. Access notes, track assignments, check schedules, and stay updated.
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
        {/* Quick Stats Row */}
        <section className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📚</span>
            <div>
              <span className={styles.statNumber}>{todayClasses.length}</span>
              <span className={styles.statLabel}>Classes Today</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📋</span>
            <div>
              <span className={styles.statNumber}>{pendingAssignments}</span>
              <span className={styles.statLabel}>Pending Tasks</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📅</span>
            <div>
              <span className={styles.statNumber}>{upcomingEvents.length}</span>
              <span className={styles.statLabel}>Upcoming Events</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📝</span>
            <div>
              <span className={styles.statNumber}>{notes.length}</span>
              <span className={styles.statLabel}>Total Notes</span>
            </div>
          </div>
        </section>

        {/* Countdown Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>⏳ Upcoming Countdowns</h2>
            <p className={styles.sectionDesc}>Stay on top of exams and important dates</p>
          </div>
          <div className={styles.countdownGrid}>
            {nextExam && (
              <CountdownTimer title={nextExam.title} targetDate={nextExam.date} type="exam" icon="🎯" />
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

        {/* Today's Schedule */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>📚 Today's Schedule</h2>
            <p className={styles.sectionDesc}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          {todayClasses.length > 0 ? (
            <div className={styles.todayGrid}>
              {todayClasses.map((cls, i) => (
                <div key={i} className={`${styles.todayCard} ${styles[cls.type + 'Card']}`}>
                  <span className={styles.todayTime}>{formatTime(cls.time)}</span>
                  <h4 className={styles.todaySubject}>{cls.subject}</h4>
                  <span className={styles.todayRoom}>{cls.room} · {cls.teacher}</span>
                  <span className={`${styles.todayBadge} ${cls.type === 'lab' ? styles.labBadge : ''}`}>
                    {cls.type === 'lab' ? '🔬 Lab' : '📖 Lecture'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noClasses}>
              <span>🎉</span>
              <p>No classes today! Enjoy your day off.</p>
            </div>
          )}
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

import React from 'react';
import Layout from '@theme/Layout';
import EventCalendar from '@site/src/components/EventCalendar';
import RoutineViewer from '@site/src/components/RoutineViewer';
import events from '@site/src/data/events';
import routine from '@site/src/data/routine';
import styles from './calendar.module.css';

export default function CalendarPage() {
  return (
    <Layout title="Calendar — Orios Class" description="Interactive calendar with events and class routine">
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.headerIcon}>📅</span>
          <div>
            <h1 className={styles.title}>Calendar & Schedule</h1>
            <p className={styles.subtitle}>View events, exams, and your weekly routine</p>
          </div>
        </header>

        <div className={styles.layout}>
          <div className={styles.calendarCol}>
            <h2 className={styles.sectionTitle}>📆 Event Calendar</h2>
            <EventCalendar events={events} />
          </div>
          <div className={styles.eventsCol}>
            <h2 className={styles.sectionTitle}>📌 All Events</h2>
            <div className={styles.eventList}>
              {events
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map(event => (
                  <div key={event.id} className={styles.eventCard} style={{ borderLeftColor: event.color }}>
                    <div className={styles.eventDate}>
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className={styles.eventInfo}>
                      <span className={styles.eventBadge} style={{ background: event.color }}>{event.type}</span>
                      <h4 className={styles.eventTitle}>{event.title}</h4>
                      <p className={styles.eventDesc}>{event.description}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <section className={styles.routineSection}>
          <h2 className={styles.sectionTitle}>🗓️ Weekly Routine</h2>
          <RoutineViewer routine={routine} />
        </section>
      </div>
    </Layout>
  );
}

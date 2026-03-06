import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import EventCalendar from '@site/src/components/EventCalendar';
import RoutineViewer from '@site/src/components/RoutineViewer';
import events from '@site/src/data/events';
import defaultRoutine from '@site/src/data/routine';
import { getRoutine, getSettings } from '@site/src/auth/db';
import styles from './calendar.module.css';

export default function CalendarPage() {
  const [liveRoutine, setLiveRoutine] = useState(defaultRoutine);
  const [googleCalUrl, setGoogleCalUrl] = useState('');
  const [countryCode, setCountryCode] = useState('BD');
  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    try {
      const saved = getRoutine();
      if (saved?.days) setLiveRoutine(saved);
      const settings = getSettings();
      if (settings.googleCalendarUrl) setGoogleCalUrl(settings.googleCalendarUrl);
      if (settings.countryCode) setCountryCode(settings.countryCode);
    } catch {}

    // Fetch public holidays
    fetchHolidays(countryCode);
  }, []);

  const fetchHolidays = async (code) => {
    try {
      const year = new Date().getFullYear();
      const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${code}`);
      if (res.ok) {
        const data = await res.json();
        setHolidays(data.map(h => ({
          id: `holiday-${h.date}`,
          title: h.localName || h.name,
          date: h.date,
          type: 'holiday',
          description: h.name,
          color: '#10b981',
        })));
      }
    } catch {}
  };

  // Merge events with holidays
  const allEvents = [...events, ...holidays];

  return (
    <Layout title="Calendar — Orios Class" description="Interactive calendar with events and class routine">
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.headerIcon}>📅</span>
          <div>
            <h1 className={styles.title}>Calendar & Schedule</h1>
            <p className={styles.subtitle}>View events, exams, holidays, and your weekly routine</p>
          </div>
        </header>

        <div className={styles.layout}>
          <div className={styles.calendarCol}>
            <h2 className={styles.sectionTitle}>📆 Event Calendar</h2>
            <EventCalendar events={allEvents} />
          </div>
          <div className={styles.eventsCol}>
            <h2 className={styles.sectionTitle}>📌 All Events</h2>
            <div className={styles.eventList}>
              {allEvents
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

            {/* Google Calendar Sync */}
            {googleCalUrl && (
              <div className={styles.calSyncSection}>
                <h3 className={styles.calSyncTitle}>🔗 Google Calendar</h3>
                <a href={googleCalUrl} target="_blank" rel="noopener noreferrer" className={styles.calSyncBtn}>
                  Open in Google Calendar →
                </a>
              </div>
            )}
          </div>
        </div>

        <section className={styles.routineSection}>
          <h2 className={styles.sectionTitle}>🗓️ Weekly Routine</h2>
          <RoutineViewer routine={liveRoutine} />
        </section>
      </div>
    </Layout>
  );
}

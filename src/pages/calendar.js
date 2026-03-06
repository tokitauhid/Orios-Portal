import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import EventCalendar from '@site/src/components/EventCalendar';
import RoutineViewer from '@site/src/components/RoutineViewer';
import { getRoutine, getSettings, getAll } from '@site/src/auth/db';
import styles from './calendar.module.css';

export default function CalendarPage() {
  const [liveRoutine, setLiveRoutine] = useState({ days: [], timeSlots: [], schedule: {} });
  const [countryCode, setCountryCode] = useState('BD');
  const [holidays, setHolidays] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    async function init() {
      try {
        const saved = getRoutine();
        if (saved?.days) setLiveRoutine(saved);
        const settings = getSettings();
        if (settings.countryCode) setCountryCode(settings.countryCode);
        setEvents(await getAll('events'));
      } catch {}
    }
    init();
    
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
                      {event.date && event.date.includes('T') && (
                        <div style={{ fontSize: '0.8em', opacity: 0.8, marginTop: '2px' }}>
                          {new Date(event.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </div>
                      )}
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
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img src="/img/orio.png" alt="Orio" style={{ position: 'absolute', right: '-50px', top: '-30px', width: '60px', height: '60px', objectFit: 'contain', transform: 'rotate(15deg)', opacity: 0.9 }} />
            <h2 className={styles.sectionTitle}>🗓️ Weekly Routine</h2>
          </div>
          <RoutineViewer routine={liveRoutine} />
        </section>
      </div>
    </Layout>
  );
}

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
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'routine'

  useEffect(() => {
    async function init() {
      try {
        const saved = await getRoutine();
        if (saved?.days) setLiveRoutine(saved);
        const settings = await getSettings();
        if (settings.countryCode) setCountryCode(settings.countryCode);
        
        const evs = await getAll('events');
        const asgns = await getAll('assignments');
        const labs = await getAll('labReports');

        const mappedAsgns = asgns.map(a => ({
          id: `asgn-${a.id}`,
          title: `Assignment: ${a.title}`,
          date: a.dueDate,
          type: 'assignment',
          description: `Due for ${a.subject}`,
          color: '#3b82f6'
        }));

        const mappedLabs = labs.map(l => ({
          id: `lab-${l.id}`,
          title: `Lab Report: ${l.title}`,
          date: l.dueDate,
          type: 'lab',
          description: `Due for ${l.subject}`,
          color: '#6366f1'
        }));

        setEvents([...evs, ...mappedAsgns, ...mappedLabs]);
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

  // Map routine into events for the calendar view
  const generateRoutineEvents = () => {
    if (!liveRoutine || !liveRoutine.schedule) return [];
    const routineEvents = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    
    // Generate for next 30 days
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const dayName = dayNames[d.getDay()];
      const slots = liveRoutine.schedule[dayName] || [];
      
      slots.forEach(slot => {
        if (slot && slot.subject) {
          let dateStr = d.toISOString().split('T')[0];
          if (slot.time) {
            const parts = slot.time.split(':');
            const hh = parts[0].padStart(2, '0');
            const mm = parts[1] || '00';
            dateStr += `T${hh}:${mm}:00`;
          }
          
          routineEvents.push({
            id: `routine-${i}-${slot.time}`,
            title: `${slot.subject}`,
            date: dateStr,
            type: slot.type === 'lab' ? 'lab' : 'lecture',
            description: `Room: ${slot.room} | Teacher: ${slot.teacher}`,
            color: slot.type === 'lab' ? '#10b981' : '#6366f1'
          });
        }
      });
    }
    return routineEvents;
  };

  const currentDisplayEvents = viewMode === 'routine' ? generateRoutineEvents() : allEvents;

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
              <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                {viewMode === 'routine' ? '🎒 Routine Calendar' : '📆 Event Calendar'}
              </h2>
              <div className={styles.toggleGroup} style={{ margin: 0 }}>
                <button 
                  className={`${styles.toggleBtn} ${viewMode === 'calendar' ? styles.toggleActive : ''}`} 
                  onClick={() => setViewMode('calendar')}
                >
                  📆 Events
                </button>
                <button 
                  className={`${styles.toggleBtn} ${viewMode === 'routine' ? styles.toggleActive : ''}`} 
                  onClick={() => setViewMode('routine')}
                >
                  🎒 Routine
                </button>
              </div>
            </div>
            
            <EventCalendar events={currentDisplayEvents} />
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

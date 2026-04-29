import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import EventCalendar from '@site/src/components/EventCalendar';
import RoutineViewer from '@site/src/components/RoutineViewer';
import { getRoutine, getSettings, getAll } from '@site/src/auth/db';
import styles from './calendar.module.css';

export default function CalendarPage() {
  const [liveRoutine, setLiveRoutine] = useState({ days: [], timeSlots: [], schedule: {} });
  const [holidays, setHolidays] = useState([]);
  const [events, setEvents] = useState([]);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'routine'

  useEffect(() => {
    async function init() {
      try {
        const saved = await getRoutine();
        if (saved?.days) setLiveRoutine(saved);
        const settings = await getSettings();
        
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

        // Fetch holidays from ICS calendar feed if configured
        if (settings.icsUrl) {
          fetchICSHolidays(settings.icsUrl);
        }
      } catch {}
    }
    init();
  }, []);

  const fetchICSHolidays = async (icsUrl) => {
    try {
      const res = await fetch(`/api/ics-proxy?url=${encodeURIComponent(icsUrl)}`);
      if (!res.ok) return;
      const text = await res.text();
      const parsed = parseICS(text);
      setHolidays(parsed);
    } catch {}
  };

  /** Minimal ICS/iCal parser — extracts VEVENT blocks into calendar events */
  const parseICS = (icsText) => {
    const events = [];
    const blocks = icsText.split('BEGIN:VEVENT');
    blocks.shift(); // remove preamble
    for (const block of blocks) {
      const end = block.indexOf('END:VEVENT');
      const content = end !== -1 ? block.substring(0, end) : block;
      const get = (key) => {
        // Handle multi-format keys like DTSTART;VALUE=DATE:20260101
        const regex = new RegExp(`^${key}[;:](.*)$`, 'm');
        const match = content.match(regex);
        if (!match) return '';
        let val = match[1];
        // Strip parameters before the actual value
        if (val.includes(':')) val = val.split(':').pop();
        return val.trim();
      };
      const summary = get('SUMMARY');
      const dtstart = get('DTSTART');
      if (!summary || !dtstart) continue;
      // Parse ICS date: 20260429 or 20260429T120000Z
      let dateStr = '';
      if (dtstart.length >= 8) {
        dateStr = `${dtstart.slice(0,4)}-${dtstart.slice(4,6)}-${dtstart.slice(6,8)}`;
        if (dtstart.length >= 15) {
          dateStr += `T${dtstart.slice(9,11)}:${dtstart.slice(11,13)}:${dtstart.slice(13,15)}`;
        }
      }
      const description = get('DESCRIPTION') || summary;
      events.push({
        id: `ics-${dtstart}-${summary.slice(0,20)}`,
        title: summary,
        date: dateStr,
        type: 'holiday',
        description,
        color: '#10b981',
      });
    }
    return events;
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
                .sort((a, b) => {
                  const now = new Date();
                  const aDate = new Date(a.date);
                  const bDate = new Date(b.date);
                  const aIsPast = aDate < now;
                  const bIsPast = bDate < now;
                  // Upcoming events first, then past events
                  if (aIsPast !== bIsPast) return aIsPast ? 1 : -1;
                  // Within same group, sort by date ascending
                  return aDate - bDate;
                })
                .map(event => {
                  const isPast = new Date(event.date) < new Date();
                  return (
                    <div key={event.id} className={styles.eventCard} style={{ borderLeftColor: event.color, opacity: isPast ? 0.5 : 1 }}>
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
                  );
                })}
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

import React, { useState } from 'react';
import styles from './styles.module.css';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

function isInRange(date, startStr, endStr) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const start = new Date(startStr);
  const end = endStr ? new Date(endStr) : start;
  return d >= start && d <= end;
}

// Routine generation can produce duplicates; keep one per day/title/type combo.
function dedupeEvents(events) {
  const seen = new Set();
  return events.filter(e => {
    const key = `${e.date.slice(0, 10)}-${e.title}-${e.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function EventCalendar({ events = [] }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
    setSelectedDate(null);
  };

  const dedupedEvents = dedupeEvents(events);

  const getEventsForDate = (day) => {
    const date = new Date(currentYear, currentMonth, day);
    return dedupedEvents.filter(e => {
      const eventStart = new Date(e.date);
      if (e.endDate) return isInRange(date, e.date, e.endDate);
      return isSameDay(date, eventStart);
    });
  };

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} className={styles.emptyCell} />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDate(day);
    const isToday = isSameDay(new Date(currentYear, currentMonth, day), today);
    const isSelected = selectedDate === day;

    // Keep cells compact: show two chips, then collapse the rest.
    const visibleChips = dayEvents.slice(0, 2);

    cells.push(
      <button
        key={day}
        className={`${styles.dayCell} ${isToday ? styles.today : ''} ${isSelected ? styles.selected : ''}`}
        onClick={() => setSelectedDate(isSelected ? null : day)}
      >
        <span className={styles.dayNumber}>{day}</span>

        {/* Event chips */}
        {visibleChips.map((ev, i) => (
          <span
            key={i}
            className={styles.eventChip}
            style={{ background: ev.color + '22', borderLeft: `2px solid ${ev.color}`, color: ev.color }}
          >
            {ev.title.length > 14 ? ev.title.slice(0, 13) + '…' : ev.title}
          </span>
        ))}

        {/* Hidden-count indicator */}
        {dayEvents.length > 2 && (
          <span className={styles.overflowChip}>+{dayEvents.length - 2} more</span>
        )}
      </button>
    );
  }

  // Keep a fixed 6x7 grid so month height does not jump.
  const currentTotal = cells.length;
  if (currentTotal < 42) {
    for (let i = 0; i < 42 - currentTotal; i++) {
      cells.push(<div key={`empty-end-${i}`} className={styles.emptyCell} />);
    }
  }

  return (
    <div className={styles.calendar}>
      {/* Month header */}
      <div className={styles.calendarHeader}>
        <button onClick={prevMonth} className={styles.navBtn}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M12 5L7 10L12 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h3 className={styles.monthTitle}>{MONTHS[currentMonth]} {currentYear}</h3>
        <button onClick={nextMonth} className={styles.navBtn}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M8 5L13 10L8 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Weekday labels */}
      <div className={styles.weekDays}>
        {DAYS.map(d => <div key={d} className={styles.weekDay}>{d}</div>)}
      </div>

      {/* Day grid */}
      <div className={styles.grid}>
        {cells}
      </div>

      {/* Selected-day details */}
      {selectedDate && (
        <div className={styles.eventPanel}>
          <h4 className={styles.panelTitle}>
            {MONTHS[currentMonth]} {selectedDate}
          </h4>
          {selectedEvents.length === 0 ? (
            <p className={styles.noEvents}>No events on this day</p>
          ) : (
            <div className={styles.eventList}>
              {selectedEvents.map(ev => (
                <div key={ev.id} className={styles.eventItem} style={{ borderLeftColor: ev.color }}>
                  <span className={styles.eventType} style={{ background: ev.color }}>{ev.type}</span>
                  <h5 className={styles.eventTitle}>{ev.title}</h5>
                  {ev.description && <p className={styles.eventDesc}>{ev.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import styles from './styles.module.css';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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

export default function EventCalendar({ events = [] }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [expandedDay, setExpandedDay] = useState(null);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setExpandedDay(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setExpandedDay(null);
  };

  const getEventsForDate = (day) => {
    const date = new Date(currentYear, currentMonth, day);
    return events.filter(e => {
      const eventStart = new Date(e.date);
      if (e.endDate) {
        return isInRange(date, e.date, e.endDate);
      }
      return isSameDay(date, eventStart);
    });
  };

  const handleDayClick = (day) => {
    setExpandedDay(expandedDay === day ? null : day);
  };

  const expandedEvents = expandedDay ? getEventsForDate(expandedDay) : [];

  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} className={styles.emptyCell} />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDate(day);
    const isToday = isSameDay(new Date(currentYear, currentMonth, day), today);
    const isExpanded = expandedDay === day;
    // Filter out routine events for inside-cell display (only show non-routine)
    const nonRoutineEvents = dayEvents.filter(e => !e.id?.startsWith('routine-'));

    cells.push(
      <button
        key={day}
        className={`${styles.dayCell} ${isToday ? styles.today : ''} ${isExpanded ? styles.expanded : ''} ${dayEvents.length > 0 ? styles.hasEvents : ''}`}
        onClick={() => handleDayClick(day)}
      >
        <span className={styles.dayNumber}>{day}</span>
        {nonRoutineEvents.length > 0 && (
          <div className={styles.dayEventList}>
            {nonRoutineEvents.slice(0, 2).map((ev, i) => (
              <span key={i} className={styles.dayEventLabel} style={{ '--event-color': ev.color }}>
                {ev.title.length > 14 ? ev.title.slice(0, 12) + '…' : ev.title}
              </span>
            ))}
            {nonRoutineEvents.length > 2 && (
              <span className={styles.dayEventMore}>+{nonRoutineEvents.length - 2}</span>
            )}
          </div>
        )}
        {nonRoutineEvents.length === 0 && dayEvents.length > 0 && (
          <div className={styles.eventDots}>
            {dayEvents.slice(0, 3).map((ev, i) => (
              <span key={i} className={styles.eventDot} style={{ background: ev.color }} />
            ))}
          </div>
        )}
      </button>
    );
  }

  return (
    <div className={styles.calendar}>
      <div className={styles.calendarHeader}>
        <button onClick={prevMonth} className={styles.navBtn}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 5L7 10L12 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h3 className={styles.monthTitle}>{MONTHS[currentMonth]} {currentYear}</h3>
        <button onClick={nextMonth} className={styles.navBtn}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M8 5L13 10L8 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className={styles.weekDays}>
        {DAYS.map(d => <div key={d} className={styles.weekDay}>{d}</div>)}
      </div>

      <div className={styles.grid}>
        {cells}
      </div>

      {/* Expanded day detail panel — smooth slide-down */}
      <div className={`${styles.eventPanel} ${expandedDay ? styles.eventPanelOpen : ''}`}>
        {expandedDay && (
          <div className={styles.eventPanelInner}>
            <h4 className={styles.panelTitle}>
              {MONTHS[currentMonth]} {expandedDay}, {currentYear}
            </h4>
            {expandedEvents.length === 0 ? (
              <p className={styles.noEvents}>No events on this day</p>
            ) : (
              <div className={styles.eventList}>
                {expandedEvents.map(ev => (
                  <div key={ev.id} className={styles.eventItem} style={{ borderLeftColor: ev.color }}>
                    <span className={styles.eventType} style={{ background: ev.color }}>{ev.type}</span>
                    <h5 className={styles.eventTitle}>{ev.title}</h5>
                    <p className={styles.eventDesc}>{ev.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

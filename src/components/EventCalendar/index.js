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
  const [selectedDate, setSelectedDate] = useState(null);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
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

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} className={styles.emptyCell} />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDate(day);
    const isToday = isSameDay(new Date(currentYear, currentMonth, day), today);
    const isSelected = selectedDate === day;

    cells.push(
      <button
        key={day}
        className={`${styles.dayCell} ${isToday ? styles.today : ''} ${isSelected ? styles.selected : ''} ${dayEvents.length > 0 ? styles.hasEvents : ''}`}
        onClick={() => setSelectedDate(day)}
      >
        <span className={styles.dayNumber}>{day}</span>
        {dayEvents.length > 0 && (
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

      {selectedDate && (
        <div className={styles.eventPanel}>
          <h4 className={styles.panelTitle}>
            {MONTHS[currentMonth]} {selectedDate}, {currentYear}
          </h4>
          {selectedEvents.length === 0 ? (
            <p className={styles.noEvents}>No events on this day</p>
          ) : (
            <div className={styles.eventList}>
              {selectedEvents.map(ev => (
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
  );
}

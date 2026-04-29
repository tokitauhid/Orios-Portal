import React, { useState } from 'react';
import styles from './styles.module.css';

export default function RoutineViewer({ routine }) {
  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[today.getDay()];
  const [expandedDay, setExpandedDay] = useState(todayName);

  const formatTime = (timeStr) => {
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
  };

  // Get classes for a day (non-null slots only)
  const getClassesForDay = (day) => {
    return (routine.schedule[day] || [])
      .map((slot, idx) => slot ? { ...slot, time: routine.timeSlots[idx] } : null)
      .filter(Boolean);
  };

  return (
    <div className={styles.wrapper}>
      {/* ─── Desktop: Table View ─── */}
      <div className={styles.desktopView}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.dayHeaderCell}>Day</th>
                {routine.timeSlots.map(time => (
                  <th key={time} className={styles.timeHeader}>
                    {formatTime(time)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {routine.days.map(day => {
                const isToday = day === todayName;
                return (
                  <tr key={day} className={isToday ? styles.todayRow : ''}>
                    <td className={`${styles.dayCell} ${isToday ? styles.todayDayCell : ''}`}>
                      {isToday && <span className={styles.todayDot} />}
                      {day.slice(0, 3)}
                    </td>
                    {routine.timeSlots.map((time, colIdx) => {
                      const slot = routine.schedule[day]?.[colIdx];
                      if (!slot) {
                        return (
                          <td key={time} className={`${styles.cell} ${isToday ? styles.todayCol : ''}`}>
                            <span className={styles.free}></span>
                          </td>
                        );
                      }
                      return (
                        <td key={time} className={`${styles.cell} ${isToday ? styles.todayCol : ''} ${styles[slot.type]}`}>
                          <div className={styles.slotContent}>
                            <span className={styles.subject}>{slot.subject}</span>
                            {slot.room && <span className={styles.room}>📍 {slot.room}</span>}
                            {slot.teacher && <span className={styles.teacher}>👤 {slot.teacher}</span>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Mobile: Card View ─── */}
      <div className={styles.mobileView}>
        {routine.days.map(day => {
          const isToday = day === todayName;
          const classes = getClassesForDay(day);
          const isExpanded = expandedDay === day;

          return (
            <div key={day} className={`${styles.dayCard} ${isToday ? styles.dayCardToday : ''}`}>
              <button
                className={styles.dayCardHeader}
                onClick={() => setExpandedDay(isExpanded ? null : day)}
              >
                <div className={styles.dayCardLeft}>
                  {isToday && <span className={styles.todayBadge}>TODAY</span>}
                  <span className={styles.dayCardName}>{day}</span>
                  <span className={styles.dayCardCount}>
                    {classes.length > 0 ? `${classes.length} class${classes.length > 1 ? 'es' : ''}` : 'No classes'}
                  </span>
                </div>
                <span className={`${styles.dayCardChevron} ${isExpanded ? styles.chevronOpen : ''}`}>▾</span>
              </button>

              {isExpanded && (
                <div className={styles.dayCardBody}>
                  {classes.length === 0 ? (
                    <div className={styles.dayCardEmpty}>🎉 Free day!</div>
                  ) : (
                    classes.map((slot, i) => (
                      <div key={i} className={`${styles.mobileSlot} ${styles[`mobile_${slot.type}`]}`}>
                        <div className={styles.mobileSlotTime}>{formatTime(slot.time)}</div>
                        <div className={styles.mobileSlotInfo}>
                          <span className={styles.mobileSlotSubject}>{slot.subject}</span>
                          <div className={styles.mobileSlotMeta}>
                            {slot.room && <span>📍 {slot.room}</span>}
                            {slot.teacher && <span>👤 {slot.teacher}</span>}
                            <span className={`${styles.mobileTypeBadge} ${styles[`badge_${slot.type}`]}`}>
                              {slot.type === 'lab' ? '🔬 Lab' : '📖 Lecture'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.lectureDot}`} /> Lecture
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.labDot}`} /> Lab
        </span>
      </div>
    </div>
  );
}

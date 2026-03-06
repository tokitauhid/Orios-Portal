import React from 'react';
import styles from './styles.module.css';

export default function RoutineViewer({ routine }) {
  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[today.getDay()];

  // Helper to format time (e.g. "1:00" -> "1:00 PM")
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

  return (
    <div className={styles.wrapper}>
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
                          <span className={styles.free}>—</span>
                        </td>
                      );
                    }
                    return (
                      <td key={time} className={`${styles.cell} ${isToday ? styles.todayCol : ''} ${styles[slot.type]}`}>
                        <div className={styles.slotContent}>
                          <span className={styles.subject}>{slot.subject}</span>
                          <span className={styles.room}>{slot.room}</span>
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

import React from 'react';
import styles from './styles.module.css';

export default function RoutineViewer({ routine }) {
  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[today.getDay()];

  return (
    <div className={styles.wrapper}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.timeHeader}>Time</th>
              {routine.days.map(day => (
                <th
                  key={day}
                  className={`${styles.dayHeader} ${day === todayName ? styles.todayHeader : ''}`}
                >
                  {day === todayName && <span className={styles.todayDot} />}
                  {day.slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {routine.timeSlots.map((time, rowIdx) => (
              <tr key={time}>
                <td className={styles.timeCell}>{time}</td>
                {routine.days.map(day => {
                  const slot = routine.schedule[day]?.[rowIdx];
                  const isToday = day === todayName;
                  if (!slot) {
                    return (
                      <td key={day} className={`${styles.cell} ${isToday ? styles.todayCol : ''}`}>
                        <span className={styles.free}>—</span>
                      </td>
                    );
                  }
                  return (
                    <td key={day} className={`${styles.cell} ${isToday ? styles.todayCol : ''} ${styles[slot.type]}`}>
                      <div className={styles.slotContent}>
                        <span className={styles.subject}>{slot.subject}</span>
                        <span className={styles.room}>{slot.room}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
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

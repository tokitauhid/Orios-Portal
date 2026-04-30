import React, { useRef, useState } from "react";
import styles from "./styles.module.css";

export default function RoutineViewer({ routine }) {
  const today = new Date();
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const todayName = dayNames[today.getDay()];
  const [expandedDay, setExpandedDay] = useState(todayName);
  const [selectedDay, setSelectedDay] = useState("All");
  const [density, setDensity] = useState("comfortable");
  const todayRowRef = useRef(null);

  const formatTime = (timeStr) => {
    try {
      if (!timeStr.includes(":")) return timeStr;
      const [hourStr, minStr] = timeStr.split(":");
      let hour = parseInt(hourStr, 10);
      let isPM = false;
      if (hour >= 12) isPM = true;
      else if (hour >= 1 && hour <= 7) isPM = true;
      const suffix = isPM ? "PM" : "AM";
      if (hour === 0) hour = 12;
      else if (hour > 12) hour -= 12;
      return `${hour}:${minStr || "00"} ${suffix}`;
    } catch {
      return timeStr;
    }
  };

  // Get classes for a day (non-null slots only)
  const getClassesForDay = (day) => {
    return (routine.schedule[day] || [])
      .map((slot, idx) =>
        slot ? { ...slot, time: routine.timeSlots[idx] } : null,
      )
      .filter(Boolean);
  };

  const hasRoutineData =
    routine?.days?.length > 0 &&
    routine?.timeSlots?.length > 0 &&
    Object.keys(routine?.schedule || {}).length > 0;

  const visibleDays =
    selectedDay === "All"
      ? routine.days
      : routine.days.filter((day) => day === selectedDay);

  const jumpToToday = () => {
    setSelectedDay(todayName);
    if (todayRowRef.current) {
      todayRowRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* ─── Desktop: Table View ─── */}
      <div className={styles.desktopView}>
        <div className={styles.desktopToolbar}>
          <div className={styles.filterPills} role="tablist" aria-label="Filter days">
            <button
              type="button"
              className={`${styles.pill} ${selectedDay === "All" ? styles.pillActive : ""}`}
              onClick={() => setSelectedDay("All")}
              aria-pressed={selectedDay === "All"}
            >
              All days
            </button>
            {routine.days.map((day) => (
              <button
                key={day}
                type="button"
                className={`${styles.pill} ${selectedDay === day ? styles.pillActive : ""}`}
                onClick={() => setSelectedDay(day)}
                aria-pressed={selectedDay === day}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>

          <div className={styles.toolbarActions}>
            <button
              type="button"
              className={styles.utilityButton}
              onClick={jumpToToday}
            >
              Today
            </button>
            <button
              type="button"
              className={`${styles.utilityButton} ${density === "compact" ? styles.utilityButtonActive : ""}`}
              onClick={() =>
                setDensity((curr) =>
                  curr === "comfortable" ? "compact" : "comfortable",
                )
              }
            >
              {density === "comfortable" ? "Compact" : "Comfortable"}
            </button>
          </div>
        </div>

        {!hasRoutineData ? (
          <div className={styles.desktopEmptyState}>
            <h3>No routine available yet</h3>
            <p>
              Add days and time slots from Routine Manager to see the weekly
              schedule here.
            </p>
          </div>
        ) : (
          <>
            <div className={styles.tableScroll}>
              <table
                className={`${styles.table} ${density === "compact" ? styles.tableCompact : ""}`}
              >
                <thead>
                  <tr>
                    <th className={styles.dayHeaderCell}>Day</th>
                    {routine.timeSlots.map((time) => (
                      <th key={time} className={styles.timeHeader}>
                        {formatTime(time)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleDays.map((day) => {
                    const isToday = day === todayName;
                    return (
                      <tr
                        key={day}
                        className={isToday ? styles.todayRow : ""}
                        ref={isToday ? todayRowRef : null}
                      >
                        <td
                          className={`${styles.dayCell} ${isToday ? styles.todayDayCell : ""}`}
                        >
                          {isToday && <span className={styles.todayDot} />}
                          {day.slice(0, 3)}
                        </td>
                        {routine.timeSlots.map((time, colIdx) => {
                          const slot = routine.schedule[day]?.[colIdx];
                          if (!slot) {
                            return (
                              <td
                                key={time}
                                className={`${styles.cell} ${isToday ? styles.todayCol : ""}`}
                              >
                                <span className={styles.free}>Free</span>
                              </td>
                            );
                          }
                          const slotType = slot.type === "lab" ? "lab" : "lecture";
                          return (
                            <td
                              key={time}
                              className={`${styles.cell} ${isToday ? styles.todayCol : ""} ${styles[slotType]}`}
                            >
                              <div className={styles.slotContent}>
                                <div className={styles.slotHead}>
                                  <span className={styles.subject}>{slot.subject}</span>
                                  <span
                                    className={`${styles.typeBadge} ${
                                      slotType === "lab" ? styles.badgeLab : styles.badgeLecture
                                    }`}
                                  >
                                    {slotType}
                                  </span>
                                </div>
                                {slot.room && <span className={styles.room}>Room: {slot.room}</span>}
                                {slot.teacher && (
                                  <span className={styles.teacher}>Teacher: {slot.teacher}</span>
                                )}
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
                <span className={`${styles.legendDot} ${styles.lectureDot}`} />
                Lecture
              </span>
              <span className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.labDot}`} />
                Lab
              </span>
            </div>
          </>
        )}
      </div>

      {/* ─── Mobile: Card View ─── */}
      <div className={styles.mobileView}>
        {routine.days.map((day) => {
          const isToday = day === todayName;
          const classes = getClassesForDay(day);
          const isExpanded = expandedDay === day;

          return (
            <div
              key={day}
              className={`${styles.dayCard} ${isToday ? styles.dayCardToday : ""}`}
            >
              <button
                className={styles.dayCardHeader}
                onClick={() => setExpandedDay(isExpanded ? null : day)}
              >
                <div className={styles.dayCardLeft}>
                  {isToday && <span className={styles.todayBadge}>TODAY</span>}
                  <span className={styles.dayCardName}>{day}</span>
                  <span className={styles.dayCardCount}>
                    {classes.length > 0
                      ? `${classes.length} class${classes.length > 1 ? "es" : ""}`
                      : "No classes"}
                  </span>
                </div>
                <span
                  className={`${styles.dayCardChevron} ${isExpanded ? styles.chevronOpen : ""}`}
                >
                  ▾
                </span>
              </button>

              {isExpanded && (
                <div className={styles.dayCardBody}>
                  {classes.length === 0 ? (
                    <div className={styles.dayCardEmpty}>🎉 Free day!</div>
                  ) : (
                    classes.map((slot, i) => (
                      <div
                        key={i}
                        className={`${styles.mobileSlot} ${styles[`mobile_${slot.type}`]}`}
                      >
                        <div className={styles.mobileSlotTime}>
                          {formatTime(slot.time)}
                        </div>
                        <div className={styles.mobileSlotInfo}>
                          <span className={styles.mobileSlotSubject}>
                            {slot.subject}
                          </span>
                          <div className={styles.mobileSlotMeta}>
                            {slot.room && <span>📍 {slot.room}</span>}
                            {slot.teacher && <span>👤 {slot.teacher}</span>}
                            <span
                              className={`${styles.mobileTypeBadge} ${styles[`badge_${slot.type}`]}`}
                            >
                              {slot.type === "lab" ? "🔬 Lab" : "📖 Lecture"}
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

        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.lectureDot}`} />{" "}
            Lecture
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.labDot}`} /> Lab
          </span>
        </div>
      </div>
    </div>
  );
}

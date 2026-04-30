import React, { useState, useRef } from "react";
import styles from "./styles.module.css";

export default function RoutineViewer({ routine }) {
  const today = new Date();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = dayNames[today.getDay()];
  
  const [selectedDay, setSelectedDay] = useState("All");
  const [expandedDay, setExpandedDay] = useState(todayName);
  // Mobile: which day is selected in the compact selector
  const [mobileDaySelected, setMobileDaySelected] = useState(todayName);

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

  const getClassesForDay = (day) => {
    return (routine.schedule[day] || [])
      .map((slot, idx) => (slot ? { ...slot, time: routine.timeSlots[idx] } : null))
      .filter(Boolean);
  };

  const hasRoutineData =
    routine?.days?.length > 0 &&
    routine?.timeSlots?.length > 0 &&
    Object.keys(routine?.schedule || {}).length > 0;

  const visibleDays = selectedDay === "All" ? routine.days : routine.days.filter((d) => d === selectedDay);

  if (!hasRoutineData) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🗓️</div>
        <h3>No Routine Available</h3>
        <p>The weekly routine has not been configured yet.</p>
      </div>
    );
  }

  // Calculate grid columns for desktop: narrow day label + equal-width time columns
  const gridTemplateColumns = `60px repeat(${routine.timeSlots.length}, minmax(0, 1fr))`;

  return (
    <div className={styles.container}>
      
      {/* ─── TOOLBAR ─── */}
      <div className={styles.toolbar}>
        <div className={styles.dayFilters}>
          <button 
            className={`${styles.filterBtn} ${selectedDay === "All" ? styles.activeFilter : ""}`} 
            onClick={() => setSelectedDay("All")}
          >
            All Days
          </button>
          {routine.days.map(day => (
            <button 
              key={day}
              className={`${styles.filterBtn} ${selectedDay === day ? styles.activeFilter : ""}`} 
              onClick={() => setSelectedDay(day)}
            >
              {day.slice(0, 3)}
              {day === todayName && <span className={styles.todayDot}></span>}
            </button>
          ))}
        </div>
        <div className={styles.legend}>
          <span className={styles.legendItem}><span className={styles.dotLecture}></span> Lecture</span>
          <span className={styles.legendItem}><span className={styles.dotLab}></span> Lab</span>
        </div>
      </div>

      {/* ─── DESKTOP GRID ─── */}
      <div className={styles.desktopGridWrap}>
        <div className={styles.gridContainer}>
          {/* Header Row */}
          <div className={styles.gridHeader} style={{ gridTemplateColumns }}>
            <div className={styles.headerCell}>DAY</div>
            {routine.timeSlots.map(time => (
              <div key={time} className={styles.headerCellTime}>
                {formatTime(time)}
              </div>
            ))}
          </div>

          {/* Body Rows */}
          <div className={styles.gridBody}>
            {visibleDays.map(day => {
              const isToday = day === todayName;
              return (
                <div key={day} className={`${styles.gridRow} ${isToday ? styles.todayRow : ""}`} style={{ gridTemplateColumns }}>
                  {/* Day Label Cell */}
                  <div className={styles.rowLabel}>
                    <span className={styles.dayText}>{day.slice(0, 3)}</span>
                    {isToday && <span className={styles.todayBadge}>TODAY</span>}
                  </div>

                  {/* Class Cells */}
                  {routine.timeSlots.map((time, colIdx) => {
                    const slot = routine.schedule[day]?.[colIdx];
                    if (!slot) {
                      return (
                        <div key={time} className={styles.gridCell}>
                          <div className={styles.emptySlot}>-</div>
                        </div>
                      );
                    }
                    
                    const isLab = slot.type === "lab";
                    return (
                      <div key={time} className={styles.gridCell}>
                        <div className={`${styles.classCard} ${isLab ? styles.labCard : styles.lectureCard}`}>
                          <div className={styles.cardHeader}>
                            <span className={styles.subject}>{slot.subject}</span>
                            <span className={styles.typeIcon}>{isLab ? "🔬" : "📖"}</span>
                          </div>
                          <div className={styles.cardDetails}>
                            {slot.room && <span><span className={styles.detailIcon}>📍</span> {slot.room}</span>}
                            {slot.teacher && <span><span className={styles.detailIcon}>👤</span> {slot.teacher}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Mobile: Compact Day Selector + Classes ─── */}
      <div className={styles.mobileView}>
        {/* Day pill strip */}
        <div className={styles.mobileDayStrip}>
          {routine.days.map((day) => {
            const isToday = day === todayName;
            const isActive = mobileDaySelected === day;
            return (
              <button
                key={day}
                className={`${styles.mobileDayPill} ${isActive ? styles.mobileDayPillActive : ""}`}
                onClick={() => setMobileDaySelected(day)}
              >
                {day.slice(0, 3)}
                {isToday && <span className={styles.todayDot} />}
              </button>
            );
          })}
        </div>

        {/* Selected day header */}
        {(() => {
          const day = mobileDaySelected || routine.days[0];
          const isToday = day === todayName;
          const classes = getClassesForDay(day);
          return (
            <div className={styles.mobileDayContent}>
              <div className={styles.mobileDayHeading}>
                {isToday && <span className={styles.todayBadge}>TODAY</span>}
                <span className={styles.mobileDayName}>{day}</span>
                <span className={styles.mobileDayCount}>
                  {classes.length > 0
                    ? `${classes.length} class${classes.length > 1 ? "es" : ""}`
                    : "No classes"}
                </span>
              </div>

              {classes.length === 0 ? (
                <div className={styles.dayCardEmpty}>🎉 Free day!</div>
              ) : (
                <div className={styles.mobileDaySlots}>
                  {classes.map((slot, i) => (
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
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        <div className={styles.mobileLegend}>
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

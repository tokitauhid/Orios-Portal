import React, { useState, useEffect } from "react";
import Layout from "@theme/Layout";
import EventCalendar from "@site/src/components/EventCalendar";
import RoutineViewer from "@site/src/components/RoutineViewer";
import { getRoutine, getSettings, getAll } from "@site/src/auth";
import styles from "./calendar.module.css";

export default function CalendarPage() {
  const [liveRoutine, setLiveRoutine] = useState({
    days: [],
    timeSlots: [],
    schedule: {},
  });
  const [holidays, setHolidays] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    async function init() {
      try {
        const saved = await getRoutine();
        if (saved?.days) setLiveRoutine(saved);
        const settings = await getSettings();

        const evs = await getAll("events");
        const asgns = await getAll("assignments");
        const labs = await getAll("labReports");

        const mappedAsgns = asgns.map((a) => ({
          id: `asgn-${a.id}`,
          title: `📋 ${a.title}`,
          date: a.dueDate,
          type: "assignment",
          description: `Due for ${a.subject}`,
          color: "#3b82f6",
        }));

        const mappedLabs = labs.map((l) => ({
          id: `lab-${l.id}`,
          title: `🔬 ${l.title}`,
          date: l.dueDate,
          type: "lab report",
          description: `Due for ${l.subject}`,
          color: "#a855f7",
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
      const res = await fetch(
        `/api/ics-proxy?url=${encodeURIComponent(icsUrl)}`,
      );
      if (!res.ok) return;
      const text = await res.text();
      const parsed = parseICS(text);
      setHolidays(parsed);
    } catch {}
  };

  /** Minimal ICS/iCal parser — extracts VEVENT blocks into calendar events */
  const parseICS = (icsText) => {
    const events = [];
    const blocks = icsText.split("BEGIN:VEVENT");
    blocks.shift();
    for (const block of blocks) {
      const end = block.indexOf("END:VEVENT");
      const content = end !== -1 ? block.substring(0, end) : block;
      const get = (key) => {
        const regex = new RegExp(`^${key}[;:](.*)$`, "m");
        const match = content.match(regex);
        if (!match) return "";
        let val = match[1];
        if (val.includes(":")) val = val.split(":").pop();
        return val.trim();
      };
      const summary = get("SUMMARY");
      const dtstart = get("DTSTART");
      if (!summary || !dtstart) continue;
      let dateStr = "";
      if (dtstart.length >= 8) {
        dateStr = `${dtstart.slice(0, 4)}-${dtstart.slice(4, 6)}-${dtstart.slice(6, 8)}`;
        if (dtstart.length >= 15) {
          dateStr += `T${dtstart.slice(9, 11)}:${dtstart.slice(11, 13)}:${dtstart.slice(13, 15)}`;
        }
      }
      const description = get("DESCRIPTION") || summary;
      events.push({
        id: `ics-${dtstart}-${summary.slice(0, 20)}`,
        title: summary,
        date: dateStr,
        type: "holiday",
        description,
        color: "#10b981",
      });
    }
    return events;
  };

  // Generate routine events for the calendar (next 60 days)
  const generateRoutineEvents = () => {
    if (!liveRoutine || !liveRoutine.schedule) return [];
    const routineEvents = [];
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const today = new Date();

    for (let i = 0; i < 60; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const dayName = dayNames[d.getDay()];
      const slots = liveRoutine.schedule[dayName] || [];

      slots.forEach((slot) => {
        if (slot && slot.subject) {
          let dateStr = d.toISOString().split("T")[0];
          if (slot.time) {
            const parts = slot.time.split(":");
            const hh = parts[0].padStart(2, "0");
            const mm = parts[1] || "00";
            dateStr += `T${hh}:${mm}:00`;
          }

          routineEvents.push({
            id: `routine-${i}-${slot.time}`,
            title: slot.subject,
            date: dateStr,
            type: slot.type === "lab" ? "lab" : "class",
            description: [
              slot.room && `📍 ${slot.room}`,
              slot.teacher && `👤 ${slot.teacher}`,
            ]
              .filter(Boolean)
              .join(" · "),
            color: slot.type === "lab" ? "#06b6d4" : "#8b5cf6",
          });
        }
      });
    }
    return routineEvents;
  };

  // Merge everything into one unified list
  const routineEvents = generateRoutineEvents();
  const allEvents = [...events, ...holidays, ...routineEvents];

  // Sidebar shows only non-routine events (events, holidays, assignments, labs)
  const sidebarEvents = [...events, ...holidays];

  return (
    <Layout
      title="Calendar — Orios Class"
      description="Interactive calendar with events, routine, and holidays in one view"
    >
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.headerIcon}>📅</span>
          <div>
            <h1 className={styles.title}>Calendar & Schedule</h1>
            <p className={styles.subtitle}>
              Events, classes, assignments, and holidays — all in one place
            </p>
          </div>
        </header>

        <div className={styles.layout}>
          <div className={styles.calendarCol}>
            <h2
              className={styles.sectionTitle}
              style={{ marginBottom: "16px" }}
            >
              📆 Calendar
            </h2>
            <EventCalendar events={allEvents} />

            {/* Color Legend */}
            <div className={styles.legendRow}>
              <span className={styles.legendItem}>
                <span
                  className={styles.legendDot}
                  style={{ background: "#8b5cf6" }}
                />{" "}
                Class
              </span>
              <span className={styles.legendItem}>
                <span
                  className={styles.legendDot}
                  style={{ background: "#10b981" }}
                />{" "}
                Holiday
              </span>
              <span className={styles.legendItem}>
                <span
                  className={styles.legendDot}
                  style={{ background: "#06b6d4" }}
                />{" "}
                Lab
              </span>
              <span className={styles.legendItem}>
                <span
                  className={styles.legendDot}
                  style={{ background: "#3b82f6" }}
                />{" "}
                Assignment
              </span>
              <span className={styles.legendItem}>
                <span
                  className={styles.legendDot}
                  style={{ background: "#f59e0b" }}
                />{" "}
                Event
              </span>
            </div>
          </div>

          <div className={styles.eventsCol}>
            <h2 className={styles.sectionTitle}>📌 Upcoming</h2>
            <div className={styles.eventList}>
              {sidebarEvents.length === 0 ? (
                <div className={styles.emptyEvents}>
                  <span>📭</span>
                  <p>No upcoming events</p>
                </div>
              ) : (
                sidebarEvents
                  .sort((a, b) => {
                    const now = new Date();
                    const aDate = new Date(a.date);
                    const bDate = new Date(b.date);
                    const aIsPast = aDate < now;
                    const bIsPast = bDate < now;
                    if (aIsPast !== bIsPast) return aIsPast ? 1 : -1;
                    return aDate - bDate;
                  })
                  .map((event) => {
                    const isPast = new Date(event.date) < new Date();
                    return (
                      <div
                        key={event.id}
                        className={styles.eventCard}
                        style={{
                          borderLeftColor: event.color,
                          opacity: isPast ? 0.5 : 1,
                        }}
                      >
                        <div className={styles.eventDate}>
                          {new Date(event.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                          {event.date && event.date.includes("T") && (
                            <div
                              style={{
                                fontSize: "0.8em",
                                opacity: 0.8,
                                marginTop: "2px",
                              }}
                            >
                              {new Date(event.date).toLocaleTimeString(
                                "en-US",
                                { hour: "numeric", minute: "2-digit" },
                              )}
                            </div>
                          )}
                        </div>
                        <div className={styles.eventInfo}>
                          <span
                            className={styles.eventBadge}
                            style={{ background: event.color }}
                          >
                            {event.type}
                          </span>
                          <h4 className={styles.eventTitle}>{event.title}</h4>
                          <p className={styles.eventDesc}>
                            {event.description}
                          </p>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>

        {/* Weekly Routine Table */}
        <section className={styles.routineSection}>
          <div className={styles.routineHeader}>
            <div className={styles.routineHeaderText}>
              <h2 className={styles.sectionTitle}>Weekly Routine</h2>
              <p className={styles.routineSubtitle}>
                Updated desktop schedule view with day filters and clearer slot
                details.
              </p>
            </div>
            <img
              src="/img/orio.png"
              alt="Orio"
              className={styles.routineMascot}
            />
          </div>
          <RoutineViewer routine={liveRoutine} />
        </section>
      </div>
    </Layout>
  );
}

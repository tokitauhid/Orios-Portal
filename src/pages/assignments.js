import React, { useState, useEffect } from "react";
import Layout from "@theme/Layout";
import SearchOverlay from "@site/src/components/SearchOverlay";
import { getAll, autoUpdateStatuses } from "@site/src/auth";
import styles from "./assignments.module.css";

const statusColors = {
  pending: {
    bg: "rgba(245, 158, 11, 0.1)",
    color: "#f59e0b",
    label: "Pending",
  },
  submitted: {
    bg: "rgba(16, 185, 129, 0.1)",
    color: "#10b981",
    label: "Submitted",
  },
  overdue: { bg: "rgba(239, 68, 68, 0.1)", color: "#ef4444", label: "Overdue" },
  graded: { bg: "rgba(99, 102, 241, 0.1)", color: "#6366f1", label: "Graded" },
};

function computeStatus(a) {
  if (a.status === "submitted" || a.status === "graded") return a.status;
  const now = new Date();
  return a.dueDate && new Date(a.dueDate) < now ? "overdue" : "pending";
}

export default function AssignmentsPage() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [data, setData] = useState([]);

  useEffect(() => {
    async function init() {
      try {
        try {
          await autoUpdateStatuses();
        } catch (e) {}
        const items = await getAll("assignments");
        setData(items.map((a) => ({ ...a, status: computeStatus(a) })));
      } catch (err) {
        console.error(err);
      }
    }
    init();
  }, []);

  const subjects = [...new Set(data.map((a) => a.subject))];

  const filtered = (() => {
    let base = data;
    if (query) {
      const q = query.toLowerCase();
      base = base.filter(
        (a) =>
          (a.title || "").toLowerCase().includes(q) ||
          (a.subject || "").toLowerCase().includes(q) ||
          (a.description || "").toLowerCase().includes(q) ||
          (a.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }
    if (filter !== "all") {
      base = base.filter((a) => a.status === filter || a.subject === filter);
    }
    return base;
  })();

  const grouped = filtered.reduce((acc, a) => {
    if (!acc[a.subject]) acc[a.subject] = [];
    acc[a.subject].push(a);
    return acc;
  }, {});

  const getDaysLeft = (dueDate) => {
    const diff = new Date(dueDate) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return "Overdue";
    if (days === 0) return "Due today";
    if (days === 1) return "1 day left";
    return `${days} days left`;
  };

  return (
    <Layout
      title="Assignments — Orios Class"
      description="Track your assignments and due dates"
    >
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerContent} style={{ position: "relative" }}>
            <img
              src="/img/orio1.png"
              alt="Orio"
              style={{
                position: "absolute",
                left: "-50px",
                top: "-20px",
                width: "50px",
                height: "50px",
                objectFit: "contain",
                transform: "rotate(-15deg)",
                opacity: 0.9,
              }}
            />
            <img
              src="/img/pucu.png"
              alt="Pucu"
              style={{
                position: "absolute",
                right: "-40px",
                bottom: "-10px",
                width: "60px",
                height: "60px",
                objectFit: "contain",
                transform: "rotate(10deg)",
                opacity: 0.9,
              }}
            />
            <span className={styles.headerIcon}>📋</span>
            <div>
              <h1 className={styles.title}>Assignments</h1>
              <p className={styles.subtitle}>
                Track due dates, status, and submissions
              </p>
            </div>
          </div>
          <button
            className={styles.searchTrigger}
            onClick={() => setSearchOpen(true)}
          >
            🔍 Search everything...
          </button>
        </header>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <input
              type="text"
              placeholder="🔍 Filter assignments..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.filterRow}>
            <div className={styles.pills}>
              <button
                className={`${styles.pill} ${filter === "all" ? styles.pillActive : ""}`}
                onClick={() => setFilter("all")}
              >
                All
              </button>
              <button
                className={`${styles.pill} ${filter === "pending" ? styles.pillActive : ""}`}
                onClick={() => setFilter("pending")}
              >
                ⏳ Pending
              </button>
              <button
                className={`${styles.pill} ${filter === "submitted" ? styles.pillActive : ""}`}
                onClick={() => setFilter("submitted")}
              >
                ✅ Submitted
              </button>
              <button
                className={`${styles.pill} ${filter === "overdue" ? styles.pillActive : ""}`}
                onClick={() => setFilter("overdue")}
              >
                🔴 Overdue
              </button>
              <button
                className={`${styles.pill} ${filter === "graded" ? styles.pillActive : ""}`}
                onClick={() => setFilter("graded")}
              >
                ⭐ Graded
              </button>
            </div>
            <div className={styles.pills}>
              {subjects.map((s) => (
                <button
                  key={s}
                  className={`${styles.pill} ${styles.subjectPill} ${filter === s ? styles.pillActive : ""}`}
                  onClick={() => setFilter(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.content}>
          {Object.keys(grouped).length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>📭</span>
              <p>No assignments found matching your filters.</p>
            </div>
          ) : (
            Object.entries(grouped).map(([subject, asgns]) => (
              <section key={subject} className={styles.subjectSection}>
                <h2 className={styles.subjectTitle}>{subject}</h2>
                <div className={styles.grid}>
                  {asgns.map((a, i) => {
                    const status = statusColors[a.status] || statusColors.pending;
                    return (
                      <div
                        key={a.id}
                        className={styles.card}
                        style={{ animationDelay: `${i * 80}ms` }}
                      >
                        <div className={styles.cardHeader}>
                          <span className={styles.subject}>{a.subject}</span>
                          <span
                            className={styles.status}
                            style={{ background: status.bg, color: status.color }}
                          >
                            {status.label}
                          </span>
                        </div>
                        <h3 className={styles.cardTitle}>{a.title}</h3>
                        <p className={styles.cardDesc}>{a.description}</p>
                        <div className={styles.cardFooter}>
                          <div className={styles.footerMeta}>
                            <div className={styles.dateRow}>
                              <span className={styles.dueDate}>
                                📅{" "}
                                {new Date(a.dueDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                              <span
                                className={`${styles.daysLeft} ${a.status === "overdue" ? styles.overdue : ""}`}
                              >
                                {getDaysLeft(a.dueDate)}
                              </span>
                            </div>
                            {a.fileData && (
                              <a
                                href={a.fileData}
                                download={
                                  a.title + "." + (a.format || "bin").toLowerCase()
                                }
                                className={styles.downloadBtn}
                              >
                                ⬇ Download Attachment
                              </a>
                            )}
                          </div>
                        </div>
                        <div className={styles.tags}>
                          {(a.tags || []).map((t) => (
                            <span key={t} className={styles.tag}>
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      </div>

      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        data={data}
      />
    </Layout>
  );
}

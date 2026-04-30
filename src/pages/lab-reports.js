import React, { useState, useEffect } from "react";
import Layout from "@theme/Layout";
import SearchOverlay from "@site/src/components/SearchOverlay";
import { getAll, autoUpdateStatuses } from "@site/src/auth";
import styles from "./lab-reports.module.css";

const statusConfig = {
  pending: {
    label: "Pending",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.1)",
  },
  submitted: {
    label: "Submitted",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.1)",
  },
  overdue: { label: "Overdue", color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" },
  graded: { label: "Graded", color: "#6366f1", bg: "rgba(99, 102, 241, 0.1)" },
};

function computeStatus(r) {
  if (r.status === "submitted" || r.status === "graded") return r.status;
  const now = new Date();
  return r.dueDate && new Date(r.dueDate) < now ? "overdue" : "pending";
}

export default function LabReportsPage() {
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
        const items = await getAll("labReports");
        setData(items.map((r) => ({ ...r, status: computeStatus(r) })));
      } catch (err) {
        console.error(err);
      }
    }
    init();
  }, []);

  const subjects = [...new Set(data.map((r) => r.subject))];

  const filtered = (() => {
    let base = data;
    if (query) {
      const q = query.toLowerCase();
      base = base.filter(
        (r) =>
          (r.title || "").toLowerCase().includes(q) ||
          (r.subject || "").toLowerCase().includes(q) ||
          (r.description || "").toLowerCase().includes(q)
      );
    }
    if (filter !== "all") {
      base = base.filter((r) => r.status === filter || r.subject === filter);
    }
    return base;
  })();

  const grouped = filtered.reduce((acc, r) => {
    if (!acc[r.subject]) acc[r.subject] = [];
    acc[r.subject].push(r);
    return acc;
  }, {});

  return (
    <Layout
      title="Lab Reports — Orios Class"
      description="Manage lab experiment reports by subject"
    >
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerContent} style={{ position: "relative" }}>
            <img
              src="/img/orio.png"
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
            <span className={styles.headerIcon}>🔬</span>
            <div>
              <h1 className={styles.title}>Lab Reports</h1>
              <p className={styles.subtitle}>
                Manage lab experiment reports organized by subject
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
              placeholder="🔍 Filter lab reports..."
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
              <p>No lab reports found matching your filters.</p>
            </div>
          ) : (
            Object.entries(grouped).map(([subject, reports]) => (
              <section key={subject} className={styles.subjectSection}>
                <h2 className={styles.subjectTitle}>{subject}</h2>
                <div className={styles.grid}>
                  {reports.map((report, i) => {
                    const status = statusConfig[report.status] || statusConfig.pending;
                    return (
                      <div
                        key={report.id}
                        className={styles.card}
                        style={{ animationDelay: `${i * 80}ms` }}
                      >
                        <div className={styles.cardTop}>
                          <div className={styles.labBadge}>Lab {report.labNumber}</div>
                          <span
                            className={styles.status}
                            style={{ background: status.bg, color: status.color }}
                          >
                            {status.label}
                            {report.grade && ` — ${report.grade}`}
                          </span>
                        </div>
                        <h3 className={styles.cardTitle}>{report.title}</h3>
                        <span className={styles.subject}>{report.subject}</span>
                        <p className={styles.cardDesc}>{report.description}</p>
                        <div className={styles.cardFooter}>
                          <div className={styles.footerMeta}>
                            <div className={styles.dateRow}>
                              <span className={styles.date}>
                                🧪{" "}
                                {new Date(report.date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                              <span className={styles.due}>
                                📅 Due:{" "}
                                {new Date(report.dueDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                            {report.fileData && (
                              <a
                                href={report.fileData}
                                download={
                                  report.title +
                                  "." +
                                  (report.format || "bin").toLowerCase()
                                }
                                className={styles.downloadBtn}
                              >
                                ⬇ Download Attachment
                              </a>
                            )}
                          </div>
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

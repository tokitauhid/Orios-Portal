import React, { useState, useEffect } from "react";
import Layout from "@theme/Layout";
import SearchOverlay from "@site/src/components/SearchOverlay";
import { FileShareCard } from "@site/src/components/Cards";
import { getAll } from "@site/src/auth";
import styles from "./files.module.css";

export default function FilesPage() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [filesData, setFilesData] = useState([]);

  useEffect(() => {
    async function init() {
      try {
        setFilesData(await getAll("files"));
      } catch {}
    }
    init();
  }, []);

  const subjects = [...new Set(filesData.map((f) => f.subject))];

  const filtered = (() => {
    let base = filesData;
    if (query) {
      const q = query.toLowerCase();
      base = base.filter(
        (f) =>
          (f.name || "").toLowerCase().includes(q) ||
          (f.subject || "").toLowerCase().includes(q) ||
          (f.uploadedBy || "").toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") {
      base = base.filter((f) => f.type === typeFilter);
    }
    if (subjectFilter !== "all") {
      base = base.filter((f) => f.subject === subjectFilter);
    }
    return base;
  })();

  const grouped = filtered.reduce((acc, f) => {
    if (!acc[f.subject]) acc[f.subject] = [];
    acc[f.subject].push(f);
    return acc;
  }, {});

  return (
    <Layout
      title="File Sharing — Orios Class"
      description="Securely share and download class materials"
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
            <span className={styles.headerIcon}>📁</span>
            <div>
              <h1 className={styles.title}>File Sharing</h1>
              <p className={styles.subtitle}>
                Securely share and download class materials and resources
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

        <div className={styles.info}>
          <span className={styles.infoIcon}>🔒</span>
          <p>
            Some files are password-protected. Contact your class representative
            for access passwords.
          </p>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <input
              type="text"
              placeholder="🔍 Filter files..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.filterRow}>
            <div className={styles.pills}>
              <button
                className={`${styles.pill} ${typeFilter === "all" ? styles.pillActive : ""}`}
                onClick={() => setTypeFilter("all")}
              >
                All
              </button>
              <button
                className={`${styles.pill} ${typeFilter === "pdf" ? styles.pillActive : ""}`}
                onClick={() => setTypeFilter("pdf")}
              >
                📄 PDF
              </button>
              <button
                className={`${styles.pill} ${typeFilter === "zip" ? styles.pillActive : ""}`}
                onClick={() => setTypeFilter("zip")}
              >
                📦 ZIP
              </button>
              <button
                className={`${styles.pill} ${typeFilter === "image" ? styles.pillActive : ""}`}
                onClick={() => setTypeFilter("image")}
              >
                🖼️ Image
              </button>
            </div>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className={styles.subjectSelect}
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.content}>
          {Object.keys(grouped).length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>📭</span>
              <p>No files found matching your filters.</p>
            </div>
          ) : (
            Object.entries(grouped).map(([subject, files]) => (
              <section key={subject} className={styles.subjectSection}>
                <h2 className={styles.subjectTitle}>{subject}</h2>
                <div className={styles.grid}>
                  {files.map((file, i) => (
                    <FileShareCard key={file.id} file={file} delay={i * 80} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>

      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        data={filesData}
      />
    </Layout>
  );
}

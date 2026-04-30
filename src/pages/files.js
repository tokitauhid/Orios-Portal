import React, { useState, useEffect } from "react";
import Layout from "@theme/Layout";
import { FileShareCard } from "@site/src/components/Cards";
import { getAll } from "@site/src/auth";
import styles from "./files.module.css";

export default function FilesPage() {
  const [filter, setFilter] = useState("all");
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

  const filtered =
    filter === "all"
      ? filesData
      : filesData.filter((f) => f.subject === filter || f.type === filter);

  return (
    <Layout
      title="File Sharing — Orios Class"
      description="Securely share and download class materials"
    >
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerContent} style={{ position: "relative" }}>
            <img
              src="/img/pucu.png"
              alt="Pucu"
              style={{
                position: "absolute",
                left: "-50px",
                bottom: "-10px",
                width: "60px",
                height: "60px",
                objectFit: "contain",
                transform: "rotate(-10deg)",
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
        </header>

        <div className={styles.info}>
          <span className={styles.infoIcon}>🔒</span>
          <p>
            Some files are password-protected. Contact your class representative
            for access passwords.
          </p>
        </div>

        <div className={styles.filters}>
          <button
            className={`${styles.pill} ${filter === "all" ? styles.pillActive : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`${styles.pill} ${filter === "pdf" ? styles.pillActive : ""}`}
            onClick={() => setFilter("pdf")}
          >
            📄 PDF
          </button>
          <button
            className={`${styles.pill} ${filter === "zip" ? styles.pillActive : ""}`}
            onClick={() => setFilter("zip")}
          >
            📦 ZIP
          </button>
          <button
            className={`${styles.pill} ${filter === "image" ? styles.pillActive : ""}`}
            onClick={() => setFilter("image")}
          >
            🖼️ Image
          </button>
          {subjects.map((s) => (
            <button
              key={s}
              className={`${styles.pill} ${filter === s ? styles.pillActive : ""}`}
              onClick={() => setFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>

        <div className={styles.content}>
          {Object.entries(
            filtered.reduce((acc, f) => {
              if (!acc[f.subject]) acc[f.subject] = [];
              acc[f.subject].push(f);
              return acc;
            }, {})
          ).map(([subject, files]) => (
            <section key={subject} className={styles.subjectSection}>
              <h2 className={styles.subjectTitle}>{subject}</h2>
              <div className={styles.grid}>
                {files.map((file, i) => (
                  <FileShareCard key={file.id} file={file} delay={i * 80} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </Layout>
  );
}

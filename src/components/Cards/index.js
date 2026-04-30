import React, { useState, useEffect } from "react";
import { useToast } from "@site/src/components/Toast";
import styles from "./styles.module.css";

/* ==========================================
   FEATURE CARD
   ========================================== */
const featureIcons = {
  notes: "📝",
  assignments: "📋",
  "lab-reports": "🔬",
  calendar: "📅",
  teachers: "👨‍🏫",
  files: "📁",
};

export function FeatureCard({ title, description, to, type, delay = 0 }) {
  const icon = featureIcons[type] || "📌";
  return (
    <a href={to} className={styles.featureCard} style={{ animationDelay: `${delay}ms` }}>
      <div className={styles.featureIconWrap}>
        <span className={styles.featureIcon}>{icon}</span>
      </div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDescription}>{description}</p>
      <div className={styles.featureArrow}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </a>
  );
}

/* ==========================================
   FILE SHARE CARD
   ========================================== */
export function FileShareCard({ file, delay = 0 }) {
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [unlocked, setUnlocked] = useState(!file.password);
  const { showToast } = useToast();

  const triggerDownload = () => {
    if (file.fileData) {
      const a = document.createElement("a");
      a.href = file.fileData;
      a.download = file.name || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (file.url) {
      window.open(file.url, "_blank");
    } else {
      showToast("No file source is attached for this item.", "info");
    }
  };

  const handleDownload = () => {
    if (!file.password || unlocked) {
      triggerDownload();
      return;
    }
    setShowModal(true);
    setError("");
    setPassword("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === file.password) {
      setUnlocked(true);
      setShowModal(false);
      triggerDownload();
    } else {
      setError("Incorrect password. Try again.");
    }
  };

  return (
    <>
      <div className={styles.fileCard} style={{ animationDelay: `${delay}ms` }}>
        <div className={styles.fileCardHeader}>
          <span className={styles.fileIcon}>{file.icon}</span>
          <div className={styles.fileMeta}>
            <span className={styles.fileType}>{file.type.toUpperCase()}</span>
            <span className={styles.fileSize}>{file.size}</span>
          </div>
        </div>
        <h3 className={styles.fileName}>{file.name}</h3>
        <div className={styles.fileInfo}>
          <span className={styles.fileSubject}>{file.subject}</span>
          <span className={styles.fileDot}>•</span>
          <span className={styles.fileUploader}>{file.uploadedBy}</span>
        </div>
        <div className={styles.fileFooter}>
          <span className={styles.fileDownloads}>⬇ {file.downloads} downloads</span>
          <button className={styles.fileDownloadBtn} onClick={handleDownload}>
            {file.password && !unlocked ? "🔒 Download" : "⬇ Download"}
          </button>
        </div>
      </div>

      {showModal && (
        <div className={styles.fileOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.fileModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.fileModalTitle}>🔐 Password Required</h3>
            <p className={styles.fileModalDesc}>This file is password-protected. Enter the password to download.</p>
            <form onSubmit={handleSubmit}>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password..." className={styles.filePasswordInput} autoFocus />
              {error && <p className={styles.fileError}>{error}</p>}
              <div className={styles.fileModalActions}>
                <button type="button" className={styles.fileCancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.fileSubmitBtn}>Unlock & Download</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/* ==========================================
   TEACHER CARD
   ========================================== */
export function TeacherCard({ teacher, delay = 0 }) {
  return (
    <div className={styles.teacherCard} style={{ animationDelay: `${delay}ms` }}>
      <div className={styles.teacherAvatar}>{teacher.icon || teacher.avatar || "👨‍🏫"}</div>
      <div className={styles.teacherInfo}>
        <h3 className={styles.teacherName}>{teacher.name}</h3>
        <span className={styles.teacherDesignation}>{teacher.title || teacher.designation}</span>
        <span className={styles.teacherDepartment}>{teacher.department}</span>
      </div>
      <div className={styles.teacherDetails}>
        {teacher.email && (
          <div className={styles.teacherDetailRow}>
            <span className={styles.teacherDetailIcon}>📧</span>
            <a href={`mailto:${teacher.email}`} className={styles.teacherDetailText}>{teacher.email}</a>
          </div>
        )}
        {teacher.phone && (
          <div className={styles.teacherDetailRow}>
            <span className={styles.teacherDetailIcon}>📞</span>
            <span className={styles.teacherDetailText}>{Array.isArray(teacher.phone) ? teacher.phone.join(", ") : teacher.phone}</span>
          </div>
        )}
        {teacher.office && (
          <div className={styles.teacherDetailRow}>
            <span className={styles.teacherDetailIcon}>🏢</span>
            <span className={styles.teacherDetailText}>{teacher.office}</span>
          </div>
        )}
        {teacher.officeHours && (
          <div className={styles.teacherDetailRow}>
            <span className={styles.teacherDetailIcon}>🕐</span>
            <span className={styles.teacherDetailText}>{teacher.officeHours}</span>
          </div>
        )}
      </div>
      <div className={styles.teacherSubjects}>
        {(Array.isArray(teacher.subjects) ? teacher.subjects : teacher.subjects ? teacher.subjects.split(",").map((s) => s.trim()).filter(Boolean) : []).map((s, i) => (
          <span key={i} className={styles.teacherSubjectTag}>{s}</span>
        ))}
      </div>
    </div>
  );
}

/* ==========================================
   COUNTDOWN TIMER
   ========================================== */
function getTimeRemaining(targetDate) {
  const now = new Date();
  const target = new Date(targetDate);
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true, totalHours: 0 };
  }

  const totalHours = diff / (1000 * 60 * 60);
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    totalHours,
    expired: false,
  };
}

export function CountdownTimer({ title, targetDate, type = "exam", icon = "⏰" }) {
  const [time, setTime] = useState(getTimeRemaining(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeRemaining(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const typeClass = styles[`timer_${type}`] || "";
  const isUrgent = time.totalHours <= 24 && !time.expired;

  return (
    <div className={`${styles.timer} ${typeClass} ${isUrgent ? styles.timerUrgent : ""}`}>
      <div className={styles.timerHeader}>
        <span className={styles.timerIcon}>{icon}</span>
        <span className={styles.timerTitle}>{title}</span>
        {isUrgent && <span className={styles.timerUrgentBadge}>⚡ LESS THAN 24H</span>}
      </div>
      {time.expired ? (
        <div className={styles.timerExpired}>Event has passed</div>
      ) : isUrgent ? (
        <div className={styles.timerDigits}>
          <div className={styles.timerUnit}>
            <span className={`${styles.timerNumber} ${styles.timerUrgentNumber}`}>{String(time.hours).padStart(2, "0")}</span>
            <span className={styles.timerLabel}>Hours</span>
          </div>
          <span className={styles.timerColon}>:</span>
          <div className={styles.timerUnit}>
            <span className={`${styles.timerNumber} ${styles.timerUrgentNumber}`}>{String(time.minutes).padStart(2, "0")}</span>
            <span className={styles.timerLabel}>Min</span>
          </div>
          <span className={styles.timerColon}>:</span>
          <div className={styles.timerUnit}>
            <span className={`${styles.timerNumber} ${styles.timerSeconds} ${styles.timerUrgentNumber}`}>{String(time.seconds).padStart(2, "0")}</span>
            <span className={styles.timerLabel}>Sec</span>
          </div>
        </div>
      ) : (
        <div className={styles.timerDigits}>
          <div className={styles.timerUnit}>
            <span className={styles.timerNumber}>{String(time.days).padStart(2, "0")}</span>
            <span className={styles.timerLabel}>Days Left</span>
          </div>
        </div>
      )}
      <div className={styles.timerDate}>
        {new Date(targetDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
        {targetDate && targetDate.includes("T") && " · " + new Date(targetDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
      </div>
    </div>
  );
}

/* ==========================================
   NOTICE BANNER
   ========================================== */
export function NoticeBanner({ notices }) {
  if (!notices || notices.length === 0) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.bannerLabel}>
        <span className={styles.bannerLabelIcon}>📢</span>
        <span className={styles.bannerLabelText}>NOTICES</span>
      </div>
      <div className={styles.bannerTrack}>
        <div className={styles.bannerMarquee}>
          {notices.map((notice, i) => (
            <span key={notice.id} className={styles.bannerItem}>
              <span className={`${styles.bannerDot} ${styles[`bannerDot_${notice.type}`]}`} />
              {notice.text}
              {i < notices.length - 1 && <span className={styles.bannerSeparator}>•</span>}
            </span>
          ))}
          {/* Duplicate for seamless loop */}
          {notices.map((notice, i) => (
            <span key={`dup-${notice.id}`} className={styles.bannerItem}>
              <span className={`${styles.bannerDot} ${styles[`bannerDot_${notice.type}`]}`} />
              {notice.text}
              {i < notices.length - 1 && <span className={styles.bannerSeparator}>•</span>}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

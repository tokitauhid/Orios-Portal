import React, { useState } from 'react';
import styles from './styles.module.css';

export default function FileShareCard({ file, delay = 0 }) {
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [unlocked, setUnlocked] = useState(!file.password);

  const handleDownload = () => {
    if (!file.password) {
      alert('Download started! (Demo — no actual file)');
      return;
    }
    setShowModal(true);
    setError('');
    setPassword('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === file.password) {
      setUnlocked(true);
      setShowModal(false);
      alert('Access granted! Download started. (Demo — no actual file)');
    } else {
      setError('Incorrect password. Try again.');
    }
  };

  return (
    <>
      <div className={styles.card} style={{ animationDelay: `${delay}ms` }}>
        <div className={styles.cardHeader}>
          <span className={styles.icon}>{file.icon}</span>
          <div className={styles.meta}>
            <span className={styles.type}>{file.type.toUpperCase()}</span>
            <span className={styles.size}>{file.size}</span>
          </div>
        </div>
        <h3 className={styles.name}>{file.name}</h3>
        <div className={styles.info}>
          <span className={styles.subject}>{file.subject}</span>
          <span className={styles.dot}>•</span>
          <span className={styles.uploader}>{file.uploadedBy}</span>
        </div>
        <div className={styles.footer}>
          <span className={styles.downloads}>⬇ {file.downloads} downloads</span>
          <button className={styles.downloadBtn} onClick={handleDownload}>
            {file.password && !unlocked ? '🔒 Download' : '⬇ Download'}
          </button>
        </div>
      </div>

      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>🔐 Password Required</h3>
            <p className={styles.modalDesc}>This file is password-protected. Enter the password to download.</p>
            <form onSubmit={handleSubmit}>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password..."
                className={styles.passwordInput}
                autoFocus
              />
              {error && <p className={styles.error}>{error}</p>}
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Unlock & Download
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

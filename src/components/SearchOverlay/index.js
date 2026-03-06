import React, { useState, useEffect, useRef } from 'react';
import styles from './styles.module.css';

export default function SearchOverlay({ isOpen, onClose, data = [] }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();
  const results = q
    ? data.filter(item =>
        item.title?.toLowerCase().includes(q) ||
        item.subject?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.tags?.some(t => t.toLowerCase().includes(q)) ||
        item.name?.toLowerCase().includes(q)
      ).slice(0, 12)
    : [];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.container} onClick={e => e.stopPropagation()}>
        <div className={styles.inputWrap}>
          <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M19 19L14.65 14.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search notes, assignments, teachers, files..."
            className={styles.input}
          />
          <button className={styles.escBadge} onClick={onClose}>ESC</button>
        </div>

        {q && (
          <div className={styles.results}>
            {results.length === 0 ? (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>🔍</span>
                <p>No results found for "{query}"</p>
              </div>
            ) : (
              results.map((item, i) => (
                <a
                  key={item.id || i}
                  href={item.url || '#'}
                  className={styles.resultItem}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <span className={styles.resultIcon}>{item.icon || '📌'}</span>
                  <div className={styles.resultInfo}>
                    <span className={styles.resultTitle}>{item.title || item.name}</span>
                    <span className={styles.resultMeta}>
                      {item.subject && <span className={styles.resultSubject}>{item.subject}</span>}
                      {item.description && <span className={styles.resultDesc}>{item.description}</span>}
                    </span>
                  </div>
                  {item.type && <span className={styles.resultType}>{item.type}</span>}
                </a>
              ))
            )}
          </div>
        )}

        {!q && (
          <div className={styles.hint}>
            <p>Start typing to search across all content...</p>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import styles from './styles.module.css';

/**
 * DataTable — Reusable table with search, edit, and delete.
 * @param {object} props
 * @param {Array} props.columns - [{ key, label, render? }]
 * @param {Array} props.data - Array of row objects
 * @param {function} props.onEdit - Edit handler (receives row)
 * @param {function} props.onDelete - Delete handler (receives row)
 * @param {string} props.searchKeys - Keys to search against
 */
export default function DataTable({ columns, data, onEdit, onDelete, searchKeys = [] }) {
  const [query, setQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const q = query.toLowerCase().trim();
  const filtered = q
    ? data.filter(row =>
        searchKeys.some(key => {
          const val = row[key];
          if (Array.isArray(val)) return val.some(v => String(v).toLowerCase().includes(q));
          return String(val || '').toLowerCase().includes(q);
        })
      )
    : data;

  const handleDelete = (row) => {
    if (confirmDelete === row.id) {
      onDelete(row);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(row.id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  // Generate dynamic grid-template-columns inline based on column count
  const gridTemplateColumns = `repeat(${columns.length}, 1fr) 100px`;

  return (
    <div className={styles.container}>
      <div className={styles.tableHeader}>
        <div className={styles.tableMeta}>
          <h2 className={styles.tableTitle}>Records</h2>
          <span className={styles.countBadge}>{filtered.length} items</span>
        </div>
        
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search all columns..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className={styles.searchInput}
          />
          {query && (
            <button className={styles.clearSearch} onClick={() => setQuery('')}>×</button>
          )}
        </div>
      </div>

      <div className={styles.tableWrap}>
        <div className={styles.table}>
          {/* Header Row */}
          <div className={styles.thead} style={{ gridTemplateColumns }}>
            {columns.map(col => (
              <div key={col.key} className={styles.th}>{col.label}</div>
            ))}
            <div className={styles.th} style={{ textAlign: 'right' }}>Actions</div>
          </div>

          {/* Body Rows */}
          <div className={styles.tbody}>
            {filtered.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyState}>
                  <p>No items found matching "{query}"</p>
                </div>
              </div>
            ) : (
              filtered.map(row => (
                <div key={row.id} className={styles.row} style={{ gridTemplateColumns }}>
                  {columns.map(col => (
                    <div key={col.key} className={styles.td} data-label={col.label}>
                      {col.render ? col.render(row) : (
                        Array.isArray(row[col.key])
                          ? <div className={styles.tagWrap}>{row[col.key].map(t => <span key={t} className={styles.tag}>{t}</span>)}</div>
                          : <span className={styles.cellText}>{String(row[col.key] || '—')}</span>
                      )}
                    </div>
                  ))}
                  <div className={styles.td} data-label="Actions">
                    <div className={styles.actions}>
                      <button className={styles.actionBtn} onClick={() => onEdit(row)} title="Edit">
                        <span>✏️</span>
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={() => handleDelete(row)}
                        title={confirmDelete === row.id ? 'Confirm?' : 'Delete'}
                      >
                        {confirmDelete === row.id ? <span>⚠️</span> : <span>🗑️</span>}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="🔍 Search..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className={styles.searchInput}
        />
        <span className={styles.count}>{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} className={styles.th}>{col.label}</th>
              ))}
              <th className={styles.th} style={{ width: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className={styles.empty}>
                  No items found
                </td>
              </tr>
            ) : (
              filtered.map(row => (
                <tr key={row.id} className={styles.row}>
                  {columns.map(col => (
                    <td key={col.key} className={styles.td}>
                      {col.render ? col.render(row) : (
                        Array.isArray(row[col.key])
                          ? row[col.key].join(', ')
                          : String(row[col.key] || '—')
                      )}
                    </td>
                  ))}
                  <td className={styles.td}>
                    <div className={styles.actions}>
                      <button className={styles.editBtn} onClick={() => onEdit(row)} title="Edit">✏️</button>
                      <button
                        className={`${styles.deleteBtn} ${confirmDelete === row.id ? styles.confirmDelete : ''}`}
                        onClick={() => handleDelete(row)}
                        title={confirmDelete === row.id ? 'Click again to confirm' : 'Delete'}
                      >
                        {confirmDelete === row.id ? '⚠️ Confirm?' : '🗑️'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

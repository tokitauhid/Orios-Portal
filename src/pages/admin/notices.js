import React from 'react';
import AdminCrud from '@site/src/components/AdminCrud';
import styles from './shared.module.css';

const fields = [
  { name: 'text', label: 'Notice Text', type: 'textarea', required: true, fullWidth: true, placeholder: 'Enter notice text...' },
  { name: 'type', label: 'Type', type: 'select', required: true, options: ['urgent', 'assignment', 'info', 'event'] },
  { name: 'date', label: 'Date', type: 'date', required: true },
];

const columns = [
  { key: 'text', label: 'Notice', render: r => r.text?.substring(0, 60) + (r.text?.length > 60 ? '...' : '') },
  { key: 'type', label: 'Type', render: r => <span className={styles.badge} style={{ background: r.type === 'urgent' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)', color: r.type === 'urgent' ? '#ef4444' : '#6366f1' }}>{r.type}</span> },
  { key: 'date', label: 'Date' },
];

export default function AdminNotices() {
  return (
    <AdminCrud
      title="Manage Notices"
      icon="📢"
      collection="notices"
      fields={fields}
      columns={columns}
      searchKeys={['text', 'type']}
      addLabel="Add Notice"
    />
  );
}

import React from 'react';
import AdminCrud from '@site/src/components/AdminCrud';
import styles from './shared.module.css';

const fields = [
  { name: 'fileData', label: 'Attachment (Max 50MB)', type: 'file' },
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'subject', label: 'Subject', type: 'text', required: true },
  { name: 'labNumber', label: 'Lab Number', type: 'number', required: true },
  { name: 'date', label: 'Date', type: 'date', required: true },
  { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
  { name: 'status', label: 'Status', type: 'select', required: true, options: ['pending', 'submitted', 'graded'] },
  { name: 'grade', label: 'Grade', type: 'text', placeholder: 'A, B+, etc.' },
  { name: 'description', label: 'Description', type: 'textarea', fullWidth: true },
];

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'subject', label: 'Subject' },
  { key: 'labNumber', label: 'Lab #' },
  { key: 'status', label: 'Status', render: r => {
    const c = { pending: '#f59e0b', submitted: '#10b981', graded: '#6366f1' };
    return <span className={styles.badge} style={{ background: `${c[r.status]}15`, color: c[r.status] }}>{r.status}{r.grade ? ` — ${r.grade}` : ''}</span>;
  }},
];

export default function AdminLabReports() {
  return (
    <AdminCrud
      title="Manage Lab Reports"
      icon="🔬"
      collection="labReports"
      fields={fields}
      columns={columns}
      searchKeys={['title', 'subject', 'status']}
      addLabel="Add Lab Report"
    />
  );
}

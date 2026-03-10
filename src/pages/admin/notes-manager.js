import React from 'react';
import AdminCrud from '@site/src/components/AdminCrud';
import styles from './shared.module.css';

const fields = [
  { name: 'fileData', label: 'Upload File (Max 25MB)', type: 'file' },
  { name: 'url', label: 'URL / Link (Auto-fills if file attached)', type: 'text', required: true, placeholder: 'https://...' },
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'subject', label: 'Subject', type: 'select-with-custom', required: true, options: ['Data Structures', 'Physics', 'Mathematics', 'Database Systems', 'Electronics', 'English', 'Chemistry'] },
  { name: 'description', label: 'Description', type: 'textarea', fullWidth: true },
  { name: 'date', label: 'Date', type: 'date' },
  { name: 'tags', label: 'Tags', type: 'tags', placeholder: 'tag1, tag2' },
];

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'subject', label: 'Subject' },
  { key: 'type', label: 'Type', render: r => <span className={styles.badge} style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>{r.type}</span> },
  { key: 'author', label: 'Author' },
];

export default function AdminNotes() {
  return (
    <AdminCrud
      title="Manage Notes"
      icon="📝"
      collection="notes"
      fields={fields}
      columns={columns}
      searchKeys={['title', 'subject', 'author', 'type']}
      addLabel="Add Note"
    />
  );
}

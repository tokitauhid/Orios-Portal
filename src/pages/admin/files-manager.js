import React from 'react';
import AdminCrud from '@site/src/components/AdminCrud';
import styles from './shared.module.css';

const fields = [
  { name: 'fileData', label: 'Upload File (Max 50MB)', type: 'file' },
  { name: 'name', label: 'File Name', type: 'text', required: true },
  { name: 'subject', label: 'Subject', type: 'text', required: true },
  { name: 'type', label: 'File Type', type: 'select', required: true, options: ['pdf', 'zip', 'image', 'doc', 'other'] },
  { name: 'size', label: 'File Size', type: 'text', placeholder: 'Auto-detected' },
  { name: 'uploadedBy', label: 'Uploaded By', type: 'text' },
  { name: 'date', label: 'Date', type: 'date' },
  { name: 'password', label: 'Password (leave empty for public)', type: 'text' },
  { name: 'icon', label: 'Icon', type: 'select', options: ['📄', '📦', '🖼️', '📁', '📊'] },
  { name: 'downloads', label: 'Download Count', type: 'number', defaultValue: '0' },
];

const columns = [
  { key: 'name', label: 'File Name' },
  { key: 'subject', label: 'Subject' },
  { key: 'type', label: 'Type', render: r => <span className={styles.badge} style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>{r.type?.toUpperCase()}</span> },
  { key: 'size', label: 'Size' },
  { key: 'password', label: 'Protected', render: r => r.password ? '🔒 Yes' : '🔓 No' },
];

export default function AdminFiles() {
  return (
    <AdminCrud
      title="Manage Files"
      icon="📁"
      collection="files"
      fields={fields}
      columns={columns}
      searchKeys={['name', 'subject', 'type']}
      addLabel="Add File"
    />
  );
}

import React from 'react';
import AdminCrud from '@site/src/components/AdminCrud';
import styles from './shared.module.css';

const fields = [
  { name: 'title', label: 'Event Title', type: 'text', required: true, placeholder: 'e.g. Mid-Term Examination' },
  { name: 'type', label: 'Type', type: 'select', required: true, options: ['exam', 'class test', 'event'] },
  { name: 'date', label: 'Start Date & Time', type: 'datetime-local', required: true },
  { name: 'endDate', label: 'End Date & Time', type: 'datetime-local' },
  { name: 'description', label: 'Description', type: 'textarea', fullWidth: true, placeholder: 'Event description...' },
];

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type', render: r => <span className={styles.badge} style={{ background: r.type === 'exam' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)', color: r.type === 'exam' ? '#ef4444' : '#6366f1' }}>{r.type}</span> },
  { key: 'date', label: 'Date' },
];

export default function AdminEvents() {
  return (
    <AdminCrud
      title="Manage Events"
      icon="📅"
      collection="events"
      fields={fields}
      columns={columns}
      searchKeys={['title', 'type', 'description']}
      addLabel="Add Event"
      onSubmitModifier={(data) => {
        const colors = {
          'exam': '#ef4444', 
          'class test': '#f97316', 
          'event': '#10b981', 
        };
        data.color = colors[data.type] || '#3b82f6';
        return data;
      }}
    />
  );
}

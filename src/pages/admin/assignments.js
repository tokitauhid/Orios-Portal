import React from 'react';
import AdminCrud from '@site/src/components/AdminCrud';
import styles from './shared.module.css';

const fields = [
  { name: 'fileData', label: 'Attachment (Max 25MB)', type: 'file' },
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'subject', label: 'Subject', type: 'select-with-custom', required: true, options: ['Data Structures', 'Physics', 'Mathematics', 'Database Systems', 'Electronics', 'English', 'Chemistry'] },
  { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
  { name: 'description', label: 'Description', type: 'textarea', fullWidth: true },
  { name: 'tags', label: 'Tags', type: 'tags', placeholder: 'coding, algorithms' },
];

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'subject', label: 'Subject' },
  { key: 'dueDate', label: 'Due Date' },
  { key: 'status', label: 'Status', render: r => {
    const colors = { pending: '#f59e0b', submitted: '#10b981', overdue: '#ef4444', graded: '#6366f1' };
    return <span className={styles.badge} style={{ background: `${colors[r.status]}15`, color: colors[r.status] }}>{r.status}</span>;
  }},
];

export default function AdminAssignments() {
  return (
    <AdminCrud
      title="Manage Assignments"
      icon="📋"
      collection="assignments"
      fields={fields}
      columns={columns}
      searchKeys={['title', 'subject', 'status']}
      addLabel="Add Assignment"
      onSubmitModifier={(data) => {
        if (!data.status) data.status = 'pending';
        
        // Auto-revert if deadline extended
        if (data.status === 'overdue' && data.dueDate) {
          const target = data.dueDate.includes('T') ? new Date(data.dueDate) : new Date(data.dueDate + 'T23:59:59');
          if (target.getTime() > new Date().getTime()) data.status = 'pending';
        }
        
        return data;
      }}
    />
  );
}

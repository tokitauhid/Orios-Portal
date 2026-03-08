import React from 'react';
import AdminCrud from '@site/src/components/AdminCrud';
import styles from './shared.module.css';

const fields = [
  { name: 'fileData', label: 'Attachment (Max 25MB)', type: 'file' },
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'subject', label: 'Subject', type: 'select-with-custom', required: true, options: ['Data Structures', 'Physics', 'Mathematics', 'Database Systems', 'Electronics', 'English', 'Chemistry'] },
  { name: 'date', label: 'Date', type: 'date', required: true },
  { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
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

import { getAll } from '@site/src/auth/db';

export default function AdminLabReports() {
  const [reports, setReports] = React.useState([]);
  React.useEffect(() => {
    getAll('labReports').then(setReports);
  }, []);

  return (
    <AdminCrud
      title="Manage Lab Reports"
      icon="🔬"
      collection="labReports"
      fields={fields}
      columns={columns}
      searchKeys={['title', 'subject', 'status']}
      addLabel="Add Lab Report"
      onSubmitModifier={(data) => {
        if (!data.status) data.status = 'pending';
        if (!data.labNumber) {
          const subjectReports = reports.filter(r => r.subject === data.subject);
          data.labNumber = subjectReports.length + 1;
        }
        return data;
      }}
    />
  );
}

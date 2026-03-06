import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import AdminLayout from '@site/src/components/AdminLayout';
import DataTable from '@site/src/components/DataTable';
import AdminForm from '@site/src/components/AdminForm';
import { getAll, addItem, updateItem, deleteItem } from '@site/src/auth/db';
import styles from './shared.module.css';

const fields = [
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
  const [data, setData] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const load = async () => { setData(await getAll('labReports')); };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (formData) => {
    if (editing) { await updateItem('labReports', editing.id, formData); }
    else { await addItem('labReports', formData); }
    setEditing(null); await load();
  };

  return (
    <Layout title="Manage Lab Reports — Admin"><AdminLayout title="🔬 Manage Lab Reports">
      <button className={styles.addBtn} onClick={() => { setEditing(null); setFormOpen(true); }}>➕ Add Lab Report</button>
      <DataTable columns={columns} data={data} onEdit={r => { setEditing(r); setFormOpen(true); }} onDelete={async r => { await deleteItem('labReports', r.id); await load(); }} searchKeys={['title', 'subject', 'status']} />
      <AdminForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title={editing ? 'Edit Lab Report' : 'Add Lab Report'} fields={fields} initialData={editing} />
    </AdminLayout></Layout>
  );
}

import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import AdminLayout from '@site/src/components/AdminLayout';
import DataTable from '@site/src/components/DataTable';
import AdminForm from '@site/src/components/AdminForm';
import { getAll, addItem, updateItem, deleteItem } from '@site/src/auth/db';
import styles from './shared.module.css';

const fields = [
  { name: 'fileData', label: 'Attachment (Max 50MB)', type: 'file' },
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'subject', label: 'Subject', type: 'text', required: true },
  { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
  { name: 'status', label: 'Status', type: 'select', required: true, options: ['pending', 'submitted', 'overdue', 'graded'] },
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
  const [data, setData] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => { setData(await getAll('assignments')); };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (formData) => {
    if (editing) { await updateItem('assignments', editing.id, formData); }
    else { await addItem('assignments', formData); }
    setEditing(null); await load();
  };

  return (
    <Layout title="Manage Assignments — Admin"><AdminLayout title="📋 Manage Assignments">
      <button className={styles.addBtn} onClick={() => { setEditing(null); setFormOpen(true); }}>➕ Add Assignment</button>
      <DataTable columns={columns} data={data} onEdit={r => { setEditing(r); setFormOpen(true); }} onDelete={async r => { await deleteItem('assignments', r.id); await load(); }} searchKeys={['title', 'subject', 'status']} />
      <AdminForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title={editing ? 'Edit Assignment' : 'Add Assignment'} fields={fields} initialData={editing} />
    </AdminLayout></Layout>
  );
}

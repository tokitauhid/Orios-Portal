import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import AdminLayout from '@site/src/components/AdminLayout';
import DataTable from '@site/src/components/DataTable';
import AdminForm from '@site/src/components/AdminForm';
import { getAll, addItem, updateItem, deleteItem } from '@site/src/auth/db';
import styles from './shared.module.css';

const fields = [
  { name: 'title', label: 'Event Title', type: 'text', required: true, placeholder: 'e.g. Mid-Term Examination' },
  { name: 'type', label: 'Type', type: 'select', required: true, options: ['exam', 'assignment', 'event'] },
  { name: 'date', label: 'Start Date', type: 'date', required: true },
  { name: 'endDate', label: 'End Date', type: 'date' },
  { name: 'description', label: 'Description', type: 'textarea', fullWidth: true, placeholder: 'Event description...' },
  { name: 'color', label: 'Color', type: 'text', placeholder: '#ef4444' },
];

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type', render: r => <span className={styles.badge} style={{ background: r.type === 'exam' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)', color: r.type === 'exam' ? '#ef4444' : '#6366f1' }}>{r.type}</span> },
  { key: 'date', label: 'Date' },
];

export default function AdminEvents() {
  const [data, setData] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => { setData(await getAll('events')); };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (formData) => {
    if (editing) { await updateItem('events', editing.id, formData); }
    else { await addItem('events', formData); }
    setEditing(null); await load();
  };

  return (
    <Layout title="Manage Events — Admin"><AdminLayout title="📅 Manage Events">
      <button className={styles.addBtn} onClick={() => { setEditing(null); setFormOpen(true); }}>➕ Add Event</button>
      <DataTable columns={columns} data={data} onEdit={r => { setEditing(r); setFormOpen(true); }} onDelete={async r => { await deleteItem('events', r.id); await load(); }} searchKeys={['title', 'type', 'description']} />
      <AdminForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title={editing ? 'Edit Event' : 'Add Event'} fields={fields} initialData={editing} />
    </AdminLayout></Layout>
  );
}

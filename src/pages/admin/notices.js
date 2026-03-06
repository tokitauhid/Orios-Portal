import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import AdminLayout from '@site/src/components/AdminLayout';
import DataTable from '@site/src/components/DataTable';
import AdminForm from '@site/src/components/AdminForm';
import { getAll, addItem, updateItem, deleteItem } from '@site/src/auth/db';
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
  const [data, setData] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => { setData(await getAll('notices')); };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (formData) => {
    if (editing) { await updateItem('notices', editing.id, formData); }
    else { await addItem('notices', formData); }
    setEditing(null); await load();
  };

  const handleEdit = (row) => { setEditing(row); setFormOpen(true); };
  const handleDelete = async (row) => { await deleteItem('notices', row.id); await load(); };

  return (
    <Layout title="Manage Notices — Admin"><AdminLayout title="📢 Manage Notices">
      <button className={styles.addBtn} onClick={() => { setEditing(null); setFormOpen(true); }}>➕ Add Notice</button>
      <DataTable columns={columns} data={data} onEdit={handleEdit} onDelete={handleDelete} searchKeys={['text', 'type']} />
      <AdminForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title={editing ? 'Edit Notice' : 'Add Notice'} fields={fields} initialData={editing} />
    </AdminLayout></Layout>
  );
}

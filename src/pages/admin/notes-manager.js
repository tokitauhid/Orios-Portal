import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import AdminLayout from '@site/src/components/AdminLayout';
import DataTable from '@site/src/components/DataTable';
import AdminForm from '@site/src/components/AdminForm';
import { getAll, addItem, updateItem, deleteItem } from '@site/src/auth/db';
import styles from './shared.module.css';

const fields = [
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'subject', label: 'Subject', type: 'select', required: true, options: ['Data Structures', 'Physics', 'Mathematics', 'Database Systems', 'Electronics', 'English', 'Chemistry'] },
  { name: 'type', label: 'Content Type', type: 'select', required: true, options: ['doc', 'image', 'link'] },
  { name: 'format', label: 'Format', type: 'text', placeholder: 'PDF, PNG, URL, etc.' },
  { name: 'description', label: 'Description', type: 'textarea', fullWidth: true },
  { name: 'url', label: 'URL / Link', type: 'text', required: true, placeholder: 'https://...' },
  { name: 'author', label: 'Author', type: 'text' },
  { name: 'date', label: 'Date', type: 'date' },
  { name: 'tags', label: 'Tags', type: 'tags', placeholder: 'tag1, tag2' },
  { name: 'icon', label: 'Icon', type: 'select', options: ['📄', '🖼️', '🔗', '📹', '📊'] },
];

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'subject', label: 'Subject' },
  { key: 'type', label: 'Type', render: r => <span className={styles.badge} style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>{r.type}</span> },
  { key: 'author', label: 'Author' },
];

export default function AdminNotes() {
  const [data, setData] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const load = async () => { setData(await getAll('notes')); };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (formData) => {
    if (editing) { await updateItem('notes', editing.id, formData); }
    else { await addItem('notes', formData); }
    setEditing(null); await load();
  };

  return (
    <Layout title="Manage Notes — Admin"><AdminLayout title="📝 Manage Notes">
      <button className={styles.addBtn} onClick={() => { setEditing(null); setFormOpen(true); }}>➕ Add Note</button>
      <DataTable columns={columns} data={data} onEdit={r => { setEditing(r); setFormOpen(true); }} onDelete={async r => { await deleteItem('notes', r.id); await load(); }} searchKeys={['title', 'subject', 'author', 'type']} />
      <AdminForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title={editing ? 'Edit Note' : 'Add Note'} fields={fields} initialData={editing} />
    </AdminLayout></Layout>
  );
}

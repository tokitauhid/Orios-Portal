import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import AdminLayout from '@site/src/components/AdminLayout';
import DataTable from '@site/src/components/DataTable';
import AdminForm from '@site/src/components/AdminForm';
import { getAll, addItem, updateItem, deleteItem } from '@site/src/auth/db';
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
  const [data, setData] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const load = async () => { setData(await getAll('files')); };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (formData) => {
    if (editing) { await updateItem('files', editing.id, formData); }
    else { await addItem('files', formData); }
    setEditing(null); await load();
  };

  return (
    <Layout title="Manage Files — Admin"><AdminLayout title="📁 Manage Files">
      <button className={styles.addBtn} onClick={() => { setEditing(null); setFormOpen(true); }}>➕ Add File</button>
      <DataTable columns={columns} data={data} onEdit={r => { setEditing(r); setFormOpen(true); }} onDelete={async r => { await deleteItem('files', r.id); await load(); }} searchKeys={['name', 'subject', 'type']} />
      <AdminForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title={editing ? 'Edit File' : 'Add File'} fields={fields} initialData={editing} />
    </AdminLayout></Layout>
  );
}

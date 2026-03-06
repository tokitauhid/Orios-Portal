import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import AdminLayout from '@site/src/components/AdminLayout';
import DataTable from '@site/src/components/DataTable';
import AdminForm from '@site/src/components/AdminForm';
import { getAll, addItem, updateItem, deleteItem } from '@site/src/auth/db';
import styles from './shared.module.css';

const fields = [
  { name: 'name', label: 'Full Name', type: 'text', required: true },
  { name: 'designation', label: 'Designation', type: 'select', required: true, options: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Senior Lecturer'] },
  { name: 'department', label: 'Department', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone', type: 'text' },
  { name: 'office', label: 'Office Location', type: 'text' },
  { name: 'officeHours', label: 'Office Hours', type: 'text', placeholder: 'Mon & Wed, 2-4 PM' },
  { name: 'subjects', label: 'Subjects', type: 'tags', placeholder: 'Subject 1, Subject 2' },
  { name: 'avatar', label: 'Avatar Emoji', type: 'text', placeholder: '👨‍🏫' },
];

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'designation', label: 'Designation' },
  { key: 'department', label: 'Department' },
  { key: 'email', label: 'Email' },
];

export default function AdminTeachers() {
  const [data, setData] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const load = async () => { setData(await getAll('teachers')); };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (formData) => {
    if (editing) { await updateItem('teachers', editing.id, formData); }
    else { await addItem('teachers', formData); }
    setEditing(null); await load();
  };

  return (
    <Layout title="Manage Teachers — Admin"><AdminLayout title="👨‍🏫 Manage Teachers">
      <button className={styles.addBtn} onClick={() => { setEditing(null); setFormOpen(true); }}>➕ Add Teacher</button>
      <DataTable columns={columns} data={data} onEdit={r => { setEditing(r); setFormOpen(true); }} onDelete={async r => { await deleteItem('teachers', r.id); await load(); }} searchKeys={['name', 'department', 'email', 'subjects']} />
      <AdminForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title={editing ? 'Edit Teacher' : 'Add Teacher'} fields={fields} initialData={editing} />
    </AdminLayout></Layout>
  );
}

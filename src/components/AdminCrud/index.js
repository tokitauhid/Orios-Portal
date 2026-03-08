import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import AdminLayout from '@site/src/components/AdminLayout';
import DataTable from '@site/src/components/DataTable';
import AdminForm from '@site/src/components/AdminForm';
import { getAll, addItem, updateItem, deleteItem } from '@site/src/auth/db';
import styles from '@site/src/pages/admin/shared.module.css';

export default function AdminCrud({ title, icon, collection, fields, columns, searchKeys, addLabel = "Add Item" }) {
  const [data, setData] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => { setData(await getAll(collection)); };
  useEffect(() => { load(); }, [collection]);

  const handleSubmit = async (formData) => {
    if (editing) { await updateItem(collection, editing.id, formData); }
    else { await addItem(collection, formData); }
    setEditing(null); 
    await load();
  };

  const handleEdit = (row) => { setEditing(row); setFormOpen(true); };
  const handleDelete = async (row) => { await deleteItem(collection, row.id); await load(); };

  return (
    <Layout title={`${title} — Admin`}>
      <AdminLayout title={`${icon} ${title}`}>
        <button className={styles.addBtn} onClick={() => { setEditing(null); setFormOpen(true); }}>
          ➕ {addLabel}
        </button>
        <DataTable 
          columns={columns} 
          data={data} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
          searchKeys={searchKeys} 
        />
        <AdminForm 
          isOpen={formOpen} 
          onClose={() => setFormOpen(false)} 
          onSubmit={handleSubmit} 
          title={editing ? `Edit ${addLabel.replace('Add ', '')}` : addLabel} 
          fields={fields} 
          initialData={editing} 
        />
      </AdminLayout>
    </Layout>
  );
}

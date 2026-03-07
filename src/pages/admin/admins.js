import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import AdminLayout from '@site/src/components/AdminLayout';
import { getAdmins, addAdmin, removeAdmin, isSuperAdmin, getCurrentUser } from '@site/src/auth/auth';
import styles from './admins.module.css';

export default function AdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [isSuperAdm, setIsSuperAdm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentUser = getCurrentUser();

  useEffect(() => {
    async function init() {
      setAdmins(await getAdmins());
      if (currentUser?.email) {
        setIsSuperAdm(await isSuperAdmin(currentUser.email));
      }
    }
    init();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newEmail.trim() || !newPassword.trim()) return;
    setError(''); setSuccess('');
    try {
      await addAdmin(newEmail.trim(), newPassword, newRole);
      setNewEmail('');
      setNewPassword('');
      setSuccess(`Admin "${newEmail}" added successfully!`);
      setAdmins(await getAdmins());
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemove = async (email) => {
    if (email === currentUser?.email) {
      setError("You can't remove yourself!");
      return;
    }
    setError(''); setSuccess('');
    await removeAdmin(email);
    setSuccess(`Removed "${email}" from admins.`);
    setAdmins(await getAdmins());
  };

  return (
    <Layout title="Manage Admins — Orios Class">
      <AdminLayout title="👥 Admin Management">
        <div className={styles.info}>
          <span>ℹ️</span>
          <p>Add or remove admin accounts. Share admin access by creating new credentials.</p>
        </div>

        <form onSubmit={handleAdd} className={styles.addForm}>
          <h3 className={styles.sectionTitle}>Add New Admin</h3>
          <div className={styles.formRow}>
            <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@example.com" className={styles.emailInput} required />
            <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Password" className={styles.emailInput} style={{ maxWidth: '160px' }} required />
            <select value={newRole} onChange={e => setNewRole(e.target.value)} className={styles.roleSelect}>
              <option value="admin">Admin</option>
              {isSuperAdm && <option value="super_admin">Super Admin</option>}
            </select>
            <button type="submit" className={styles.addBtn} disabled={loading}>➕ Add</button>
          </div>
        </form>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <div className={styles.listSection}>
          <h3 className={styles.sectionTitle}>Current Admins ({admins.length})</h3>
          <div className={styles.adminList}>
            {admins.map(admin => (
              <div key={admin.email} className={styles.adminCard}>
                <div className={styles.adminInfo}>
                  <div className={styles.adminAvatar}>{admin.email?.[0]?.toUpperCase() || '?'}</div>
                  <div>
                    <span className={styles.adminEmail}>{admin.email}</span>
                    <span className={`${styles.roleBadge} ${admin.role === 'super_admin' ? styles.superBadge : ''}`}>
                      {admin.role === 'super_admin' ? '👑 Super Admin' : '🔑 Admin'}
                    </span>
                  </div>
                </div>
                <div className={styles.adminActions}>
                  {admin.email === currentUser?.email ? (
                    <span className={styles.youBadge}>You</span>
                  ) : (
                    <button className={styles.removeBtn} onClick={() => handleRemove(admin.email)}>Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </AdminLayout>
    </Layout>
  );
}

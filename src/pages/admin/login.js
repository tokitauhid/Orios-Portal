import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import { useHistory } from '@docusaurus/router';
import { signIn, getAdmins, addAdmin } from '@site/src/auth/auth';
import styles from './login.module.css';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const history = useHistory();

  useEffect(() => {
    // Check if there are no admins. If 0 admins exist, switch to Setup Mode.
    const admins = getAdmins();
    if (admins.length === 0) {
      setIsSetupMode(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSetupMode) {
        // Create the very first super admin
        addAdmin(email, password, 'super_admin');
        signIn(email, password);
        history.push('/admin');
      } else {
        // Standard login
        signIn(email, password);
        history.push('/admin');
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <Layout title={isSetupMode ? "Setup Admin — Orios Class" : "Admin Login — Orios Class"} description="Admin authentication">
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.icon}>{isSetupMode ? '🛠️' : '🔐'}</div>
          <h1 className={styles.title}>{isSetupMode ? 'Admin Setup' : 'Admin Login'}</h1>
          <p className={styles.subtitle}>
            {isSetupMode ? 'Create the initial super admin account for your site.' : 'Enter your admin credentials to continue.'}
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Username / Email</label>
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={isSetupMode ? "superadmin" : "admin"}
                className={styles.input}
                required
                autoFocus
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className={styles.input}
                required
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? (isSetupMode ? 'Creating...' : 'Signing in...') : (isSetupMode ? '🌟 Create Super Admin' : '🔓 Sign In')}
            </button>
          </form>

          {isSetupMode && (
            <div className={styles.info}>
              <span>ℹ️</span>
              <p>Since no admins exist, the first account created here will be granted <strong>super_admin</strong> privileges.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

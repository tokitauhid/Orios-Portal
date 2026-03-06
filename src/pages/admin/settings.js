import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import AdminLayout from '@site/src/components/AdminLayout';
import { getSettings, saveSettings } from '@site/src/auth/db';
import styles from './settings.module.css';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({ welcomeText: '', countryCode: 'BD' });
  const [saved, setSaved] = useState(false);

  useEffect(() => { setSettings(getSettings()); }, []);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Layout title="Settings — Admin">
      <AdminLayout title="⚙️ Site Settings">
        <div className={styles.card}>
          <h3 className={styles.sectionTitle}>🏠 Homepage Settings</h3>
          <div className={styles.field}>
            <label className={styles.label}>Welcome Text</label>
            <input type="text" value={settings.welcomeText} onChange={e => handleChange('welcomeText', e.target.value)} placeholder="Semester 3/1" className={styles.input} />
            <span className={styles.hint}>Displayed under "Welcome to Orios Class" on the homepage</span>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.sectionTitle}>🌍 Holiday Settings</h3>
          <div className={styles.field}>
            <label className={styles.label}>Country Code</label>
            <input type="text" value={settings.countryCode} onChange={e => handleChange('countryCode', e.target.value.toUpperCase())} placeholder="BD" className={styles.input} maxLength={2} style={{ maxWidth: '100px' }} />
            <span className={styles.hint}>2-letter ISO code (BD = Bangladesh, US = United States, IN = India, etc.)</span>
          </div>
        </div>

        <button className={styles.saveBtn} onClick={handleSave}>
          {saved ? '✅ Saved!' : '💾 Save Settings'}
        </button>
      </AdminLayout>
    </Layout>
  );
}

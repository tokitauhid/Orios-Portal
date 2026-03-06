import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import AdminLayout from '@site/src/components/AdminLayout';
import { getSettings, saveSettings } from '@site/src/auth/db';
import styles from './settings.module.css';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    welcomeText: '', countryCode: 'BD', googleCalendars: [],
  });
  const [saved, setSaved] = useState(false);
  const [newCal, setNewCal] = useState({ name: '', url: '', color: '#4285f4' });

  useEffect(() => { setSettings(getSettings()); }, []);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // -- Google Calendar Management --
  const addCalendar = () => {
    if (!newCal.name.trim() || !newCal.url.trim()) return;
    const cal = { ...newCal, id: Date.now(), enabled: true };
    handleChange('googleCalendars', [...(settings.googleCalendars || []), cal]);
    setNewCal({ name: '', url: '', color: '#4285f4' });
  };

  const removeCalendar = (id) => {
    handleChange('googleCalendars', (settings.googleCalendars || []).filter(c => c.id !== id));
  };

  const toggleCalendar = (id) => {
    handleChange('googleCalendars', (settings.googleCalendars || []).map(c =>
      c.id === id ? { ...c, enabled: !c.enabled } : c
    ));
  };

  return (
    <Layout title="Settings — Admin">
      <AdminLayout title="⚙️ Site Settings">
        {/* Homepage */}
        <div className={styles.card}>
          <h3 className={styles.sectionTitle}>🏠 Homepage Settings</h3>
          <div className={styles.field}>
            <label className={styles.label}>Welcome Text</label>
            <input type="text" value={settings.welcomeText} onChange={e => handleChange('welcomeText', e.target.value)} placeholder="Semester 3/1" className={styles.input} />
            <span className={styles.hint}>Displayed under "Welcome to Orios Class" on the homepage</span>
          </div>
        </div>

        {/* Calendar / Holidays */}
        <div className={styles.card}>
          <h3 className={styles.sectionTitle}>🌍 Holidays</h3>
          <div className={styles.field}>
            <label className={styles.label}>Country Code</label>
            <input type="text" value={settings.countryCode} onChange={e => handleChange('countryCode', e.target.value.toUpperCase())} placeholder="BD" className={styles.input} maxLength={2} style={{ maxWidth: '100px' }} />
            <span className={styles.hint}>2-letter ISO code (BD = Bangladesh, US = United States, IN = India, etc.)</span>
          </div>
        </div>

        {/* Google Calendars */}
        <div className={styles.card}>
          <h3 className={styles.sectionTitle}>📅 Google Calendar Sync</h3>
          <p className={styles.hint} style={{ marginBottom: '12px' }}>
            Add Google Calendar embed URLs. In Google Calendar → Settings → Calendar → Integrate → "Public URL to this calendar" or use the embed iframe src.
          </p>

          {/* Existing Calendars */}
          {(settings.googleCalendars || []).length > 0 && (
            <div className={styles.calList}>
              {settings.googleCalendars.map(cal => (
                <div key={cal.id} className={`${styles.calItem} ${!cal.enabled ? styles.calDisabled : ''}`}>
                  <span className={styles.calDot} style={{ background: cal.color }} />
                  <div className={styles.calInfo}>
                    <span className={styles.calName}>{cal.name}</span>
                    <span className={styles.calUrl}>{cal.url.substring(0, 50)}...</span>
                  </div>
                  <button className={styles.calToggle} onClick={() => toggleCalendar(cal.id)}>
                    {cal.enabled ? '👁️' : '🚫'}
                  </button>
                  <button className={styles.calRemove} onClick={() => removeCalendar(cal.id)}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Add New */}
          <div className={styles.calAdd}>
            <input type="text" value={newCal.name} onChange={e => setNewCal({ ...newCal, name: e.target.value })} placeholder="Calendar name" className={styles.input} />
            <input type="url" value={newCal.url} onChange={e => setNewCal({ ...newCal, url: e.target.value })} placeholder="Google Calendar embed URL" className={styles.input} />
            <div className={styles.calAddRow}>
              <input type="color" value={newCal.color} onChange={e => setNewCal({ ...newCal, color: e.target.value })} className={styles.colorPicker} />
              <button className={styles.calAddBtn} onClick={addCalendar}>➕ Add Calendar</button>
            </div>
          </div>
        </div>

        <button className={styles.saveBtn} onClick={handleSave}>
          {saved ? '✅ Saved!' : '💾 Save All Settings'}
        </button>
      </AdminLayout>
    </Layout>
  );
}

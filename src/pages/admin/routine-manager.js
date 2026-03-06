import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import AdminLayout from '@site/src/components/AdminLayout';
import { getRoutine, saveRoutine, getSettings, saveSettings } from '@site/src/auth/db';
import styles from './routine-manager.module.css';

export default function AdminRoutine() {
  const [routine, setRoutine] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ subject: '', room: '', teacher: '', type: 'lecture' });
  const [saved, setSaved] = useState(false);

  // Time slot editing
  const [editingTime, setEditingTime] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);
  const [newTime, setNewTime] = useState('');

  // Settings
  const [settings, setSettings] = useState({ countryCode: 'BD' });

  useEffect(() => {
    const r = getRoutine();
    setRoutine(r);
    setTimeSlots(r?.timeSlots || []);
    setSettings(getSettings());
  }, []);

  if (!routine) return <Layout title="Routine — Admin"><AdminLayout title="🗓️ Manage Routine"><p>Loading...</p></AdminLayout></Layout>;

  // ---- Cell editing ----
  const handleCellClick = (day, idx) => {
    const slot = routine.schedule[day]?.[idx];
    setEditing({ day, slotIdx: idx });
    setForm(slot ? { subject: slot.subject, room: slot.room, teacher: slot.teacher, type: slot.type } : { subject: '', room: '', teacher: '', type: 'lecture' });
  };

  const handleSave = () => {
    const updated = { ...routine, schedule: { ...routine.schedule } };
    if (!updated.schedule[editing.day]) updated.schedule[editing.day] = [];
    while (updated.schedule[editing.day].length <= editing.slotIdx) updated.schedule[editing.day].push(null);
    if (form.subject.trim()) {
      updated.schedule[editing.day][editing.slotIdx] = { time: routine.timeSlots[editing.slotIdx], subject: form.subject, room: form.room, teacher: form.teacher, type: form.type };
    } else {
      updated.schedule[editing.day][editing.slotIdx] = null;
    }
    setRoutine(updated);
    setEditing(null);
  };

  const handleClear = () => {
    const updated = { ...routine, schedule: { ...routine.schedule } };
    if (updated.schedule[editing.day]) updated.schedule[editing.day][editing.slotIdx] = null;
    setRoutine(updated);
    setEditing(null);
  };

  // ---- Time Slots ----
  const addTimeSlot = () => {
    if (!newTime.trim() || timeSlots.includes(newTime.trim())) return;
    const updated = [...timeSlots, newTime.trim()];
    setTimeSlots(updated);
    setRoutine(prev => ({ ...prev, timeSlots: updated }));
    setNewTime('');
  };

  const removeTimeSlot = (time) => {
    const updated = timeSlots.filter(t => t !== time);
    setTimeSlots(updated);
    setRoutine(prev => ({ ...prev, timeSlots: updated }));
  };


  // ---- Publish everything ----
  const handlePublish = () => {
    saveRoutine(routine);
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Layout title="Manage Routine — Admin">
      <AdminLayout title="🗓️ Manage Weekly Routine">
        <div className={styles.toolbar}>
          <p className={styles.hint}>Click any cell to edit. Click "Publish" to save all changes.</p>
          <div className={styles.toolbarBtns}>
            <button className={styles.timeBtn} onClick={() => setEditingTime(!editingTime)}>
              🕐 {editingTime ? 'Hide' : 'Edit'} Time Slots
            </button>
            <button className={styles.publishBtn} onClick={handlePublish}>
              {saved ? '✅ Saved!' : '💾 Publish All'}
            </button>
          </div>
        </div>

        {/* Time Slot Editor */}
        {editingTime && (
          <div className={styles.timeEditor}>
            <h4 className={styles.timeEditorTitle}>🕐 Time Slots</h4>
            <div className={styles.timeSlotList}>
              {timeSlots.map(t => (
                <div key={t} className={styles.timeSlotChip}>
                  <span>{t}</span>
                  <button className={styles.chipRemove} onClick={() => removeTimeSlot(t)}>✕</button>
                </div>
              ))}
            </div>
            <div className={styles.timeSlotAdd}>
              <input type="text" value={newTime} onChange={e => setNewTime(e.target.value)} placeholder="e.g. 5:00" className={styles.timeInput} />
              <button className={styles.timeAddBtn} onClick={addTimeSlot}>+ Add</button>
            </div>
          </div>
        )}

        {/* Schedule Table */}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Time</th>
                {routine.days.map(day => <th key={day} className={styles.th}>{day.slice(0, 3)}</th>)}
              </tr>
            </thead>
            <tbody>
              {routine.timeSlots.map((time, rowIdx) => (
                <tr key={time}>
                  <td className={styles.timeCell}>{time}</td>
                  {routine.days.map(day => {
                    const slot = routine.schedule[day]?.[rowIdx];
                    return (
                      <td key={day} className={`${styles.cell} ${slot ? styles[slot.type] : ''}`} onClick={() => handleCellClick(day, rowIdx)}>
                        {slot ? (
                          <div className={styles.slotContent}>
                            <span className={styles.slotSubject}>{slot.subject}</span>
                            <span className={styles.slotRoom}>{slot.room}</span>
                          </div>
                        ) : (
                          <span className={styles.emptySlot}>+</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Edit Cell Modal */}
        {editing && (
          <div className={styles.editOverlay} onClick={() => setEditing(null)}>
            <div className={styles.editModal} onClick={e => e.stopPropagation()}>
              <h3 className={styles.modalTitle}>Edit: {editing.day} — {routine.timeSlots[editing.slotIdx]}</h3>
              <div className={styles.formGrid}>
                <div className={styles.field}><label>Subject</label><input type="text" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Leave empty to clear" /></div>
                <div className={styles.field}><label>Room</label><input type="text" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} /></div>
                <div className={styles.field}><label>Teacher</label><input type="text" value={form.teacher} onChange={e => setForm({ ...form, teacher: e.target.value })} /></div>
                <div className={styles.field}><label>Type</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="lecture">Lecture</option><option value="lab">Lab</option></select></div>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.clearBtn} onClick={handleClear}>Clear</button>
                <button className={styles.cancelBtn} onClick={() => setEditing(null)}>Cancel</button>
                <button className={styles.saveBtn} onClick={handleSave}>Save</button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </Layout>
  );
}

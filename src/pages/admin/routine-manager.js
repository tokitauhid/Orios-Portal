import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import AdminLayout from '@site/src/components/AdminLayout';
import { getRoutine, saveRoutine, getSubjects, saveSubjects } from '@site/src/auth/db';
import styles from './routine-manager.module.css';

// Helper to format time (e.g. "1:00" -> "1:00 PM")
const formatTime = (timeStr) => {
  try {
    if (!timeStr.includes(':')) return timeStr;
    const [hourStr, minStr] = timeStr.split(':');
    let hour = parseInt(hourStr, 10);
    let isPM = false;
    if (hour >= 12) isPM = true;
    else if (hour >= 1 && hour <= 7) isPM = true;
    const suffix = isPM ? 'PM' : 'AM';
    if (hour === 0) hour = 12;
    else if (hour > 12) hour -= 12;
    return `${hour}:${minStr || '00'} ${suffix}`;
  } catch { return timeStr; }
};

export default function AdminRoutine() {
  const [routine, setRoutine] = useState(null);
  const [subjects, setSubjects] = useState([]);

  // Routine editing state
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ subject: '', room: '', teacher: '', type: 'lecture' });
  const [saved, setSaved] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);
  const [newTime, setNewTime] = useState('');
  
  // Days editing
  const [days, setDays] = useState([]);
  const [newDay, setNewDay] = useState('');

  // Subject management state
  const [newSubject, setNewSubject] = useState('');
  const [subError, setSubError] = useState('');
  const [subSuccess, setSubSuccess] = useState('');

  useEffect(() => {
    async function init() {
      const r = await getRoutine();
      setRoutine(r);
      setTimeSlots(r?.timeSlots || []);
      setDays(r?.days || []);
      setSubjects(await getSubjects());
    }
    init();
  }, []);

  if (!routine) return <Layout title="Routine & Subjects — Admin"><AdminLayout title="🗓️ Manage Routine & Subjects"><p>Loading...</p></AdminLayout></Layout>;

  // ---- Cell editing ----
  const handleCellClick = (day, idx) => {
    const slot = routine.schedule[day]?.[idx];
    setEditing({ day, slotIdx: idx });
    setForm(slot ? { subject: slot.subject, room: slot.room, teacher: slot.teacher, type: slot.type } : { subject: '', room: '', teacher: '', type: 'lecture' });
  };

  const handleSaveCell = () => {
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

  const handleClearCell = () => {
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

  // ---- Days ----
  const addDay = () => {
    const day = newDay.trim();
    if (!day || days.includes(day)) return;
    const updated = [...days, day];
    setDays(updated);
    setRoutine(prev => ({ ...prev, days: updated, schedule: { ...prev.schedule, [day]: [] } }));
    setNewDay('');
  };

  const removeDay = (day) => {
    const updated = days.filter(d => d !== day);
    setDays(updated);
    const updatedSchedule = { ...routine.schedule };
    delete updatedSchedule[day];
    setRoutine(prev => ({ ...prev, days: updated, schedule: updatedSchedule }));
  };

  const moveDay = (idx, direction) => {
    if (idx + direction < 0 || idx + direction >= days.length) return;
    const updated = [...days];
    const temp = updated[idx];
    updated[idx] = updated[idx + direction];
    updated[idx + direction] = temp;
    setDays(updated);
    setRoutine(prev => ({ ...prev, days: updated }));
  };

  // ---- Subjects ----
  const handleAddSubject = async (e) => {
    e.preventDefault();
    const name = newSubject.trim();
    if (!name) return;
    if (subjects.includes(name)) { setSubError('Subject already exists.'); return; }
    setSubError('');
    const updated = [...subjects, name];
    await saveSubjects(updated);
    setSubjects(updated);
    setNewSubject('');
    setSubSuccess(`"${name}" added!`);
    setTimeout(() => setSubSuccess(''), 2000);
  };

  const handleRemoveSubject = async (name) => {
    const updated = subjects.filter(s => s !== name);
    await saveSubjects(updated);
    setSubjects(updated);
    setSubSuccess(`"${name}" removed.`);
    setTimeout(() => setSubSuccess(''), 2000);
  };

  // ---- Publish everything ----
  const handlePublish = async () => {
    await saveRoutine(routine);
    await saveSubjects(subjects);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Layout title="Manage Routine & Subjects — Admin">
      <AdminLayout title="🗓️ Manage Routine & Subjects">
        
        {/* ---- SUBJECTS SECTION ---- */}
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>📚 Manage Subjects</h2>
            <p className={styles.hint}>Subjects appear as filter options across Notes, Assignments, Lab Reports, and admin forms.</p>
          </div>
          
          <form onSubmit={handleAddSubject} className={styles.addForm}>
            <input type="text" value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="New subject name..." className={styles.input} required />
            <button type="submit" className={styles.addBtn}>➕ Add Subject</button>
          </form>

          {subError && <div className={styles.error}>{subError}</div>}
          {subSuccess && <div className={styles.success}>{subSuccess}</div>}

          <div className={styles.subjectList}>
            {subjects.map((sub, i) => (
              <div key={sub} className={styles.subjectCard} style={{ animationDelay: `${i * 30}ms` }}>
                <span className={styles.subjectName}>📖 {sub}</span>
                <button className={styles.removeSubBtn} onClick={() => handleRemoveSubject(sub)}>✕</button>
              </div>
            ))}
          </div>
        </section>

        {/* ---- ROUTINE SECTION ---- */}
        <section className={styles.sectionCard}>
          <div className={styles.toolbar}>
            <h2 className={styles.sectionTitle}>🗓️ Weekly Routine</h2>
            <div className={styles.toolbarBtns}>
              <button className={styles.timeBtn} onClick={() => setEditingTime(!editingTime)}>
                {editingTime ? 'Hide Structure Planner' : 'Edit Row/Cols Setup'}
              </button>
              <button className={styles.publishBtn} onClick={handlePublish}>
                {saved ? '✅ Saved!' : '💾 Publish All'}
              </button>
            </div>
          </div>
          <p className={styles.hint} style={{ marginBottom: '20px' }}>Click any cell in the table below to edit a subject. Click "Publish All" to save changes.</p>

          {/* Table Structure Editor (Days & Times) */}
          {editingTime && (
            <div className={styles.structureEditor}>
              {/* Columns Editor */}
              <div className={styles.timeEditor}>
                <h4 className={styles.timeEditorTitle}>🕐 Time Slots (Columns)</h4>
                <div className={styles.timeSlotList}>
                  {timeSlots.map(t => (
                    <div key={t} className={styles.timeSlotChip}>
                      <span>{formatTime(t)}</span>
                      <button className={styles.chipRemove} onClick={() => removeTimeSlot(t)}>✕</button>
                    </div>
                  ))}
                </div>
                <div className={styles.timeSlotAdd}>
                  <input type="text" value={newTime} onChange={e => setNewTime(e.target.value)} placeholder="e.g. 13:00" className={styles.input} style={{ width: '120px' }} />
                  <button className={styles.addBtn} style={{ padding: '8px 14px' }} onClick={addTimeSlot}>+ Add Slot</button>
                </div>
              </div>

              {/* Rows Editor */}
              <div className={styles.timeEditor} style={{ marginTop: '16px' }}>
                <h4 className={styles.timeEditorTitle}>📅 Days (Rows)</h4>
                <div className={styles.timeSlotList}>
                  {days.map((d, i) => (
                    <div key={d} className={styles.timeSlotChip}>
                      <button className={styles.chipMove} onClick={() => moveDay(i, -1)} disabled={i===0}>←</button>
                      <span>{d}</span>
                      <button className={styles.chipMove} onClick={() => moveDay(i, 1)} disabled={i===days.length-1}>→</button>
                      <button className={styles.chipRemove} style={{ marginLeft: '4px' }} onClick={() => removeDay(d)}>✕</button>
                    </div>
                  ))}
                </div>
                <div className={styles.timeSlotAdd}>
                  <input type="text" value={newDay} onChange={e => setNewDay(e.target.value)} placeholder="e.g. Monday" className={styles.input} style={{ width: '150px' }} />
                  <button className={styles.addBtn} style={{ padding: '8px 14px' }} onClick={addDay}>+ Add Day</button>
                </div>
              </div>
            </div>
          )}

          {/* Schedule Table (Transposed) */}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.dayHeaderCell}>Day</th>
                  {routine.timeSlots.map(time => (
                    <th key={time} className={styles.timeHeader}>{formatTime(time)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {routine.days.map((day) => (
                  <tr key={day}>
                    <td className={styles.dayCell}>{day.slice(0, 3)}</td>
                    {routine.timeSlots.map((time, colIdx) => {
                      const slot = routine.schedule[day]?.[colIdx];
                      return (
                        <td key={time} className={`${styles.cell} ${slot ? styles[slot.type] : ''}`} onClick={() => handleCellClick(day, colIdx)}>
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
        </section>

        {/* Edit Cell Modal */}
        {editing && (
          <div className={styles.editOverlay} onClick={() => setEditing(null)}>
            <div className={styles.editModal} onClick={e => e.stopPropagation()}>
              <h3 className={styles.modalTitle}>Edit: {editing.day} — {formatTime(routine.timeSlots[editing.slotIdx])}</h3>
              <div className={styles.formGrid}>
                <div className={styles.field}><label>Subject</label>
                  <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}>
                    <option value="">(Clear)</option>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className={styles.field}><label>Room</label><input type="text" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} /></div>
                <div className={styles.field}><label>Teacher</label><input type="text" value={form.teacher} onChange={e => setForm({ ...form, teacher: e.target.value })} /></div>
                <div className={styles.field}><label>Type</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="lecture">Lecture</option><option value="lab">Lab</option></select></div>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.clearBtn} onClick={handleClearCell}>Clear Cell</button>
                <div style={{ flex: 1 }}></div>
                <button className={styles.cancelBtn} onClick={() => setEditing(null)}>Cancel</button>
                <button className={styles.addBtn} onClick={handleSaveCell}>Save Cell</button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </Layout>
  );
}

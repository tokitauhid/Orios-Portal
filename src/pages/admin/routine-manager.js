import React, { useState, useEffect, useRef } from 'react';
import Layout from '@theme/Layout';
import AdminLayout from '@site/src/components/AdminLayout';
import { getRoutine, saveRoutine, getSubjects, saveSubjects, getAll, addItem, updateItem, deleteItem } from '@site/src/auth/db';
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

// ── Inline editable chip ──────────────────────────────────────────────────────
function EditableChip({ value, onSave, onRemove, children, className }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  const startEdit = () => { setDraft(value); setEditing(true); };
  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    setEditing(false);
  };
  const cancel = () => setEditing(false);

  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  if (editing) {
    return (
      <div className={`${styles.timeSlotChip} ${styles.chipEditing}`}>
        <input
          ref={inputRef}
          className={styles.chipInput}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
          onBlur={commit}
        />
        <button className={styles.chipSave} onMouseDown={e => { e.preventDefault(); commit(); }}>✓</button>
      </div>
    );
  }

  return (
    <div className={`${styles.timeSlotChip} ${className || ''}`}>
      {children}
      <button className={styles.chipEdit} title="Edit" onClick={startEdit}>✏️</button>
      <button className={styles.chipRemove} onClick={onRemove}>✕</button>
    </div>
  );
}

export default function AdminRoutine() {
  const [routine, setRoutine] = useState(null);
  const [subjects, setSubjects] = useState([]);

  // Routine editing state
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ subject: '', room: '', teacher: '', type: 'lecture' });
  const [saved, setSaved] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
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

  if (!routine) return <Layout title="Routine &amp; Subjects — Admin"><AdminLayout title="🗓️ Manage Routine &amp; Subjects"><p>Loading...</p></AdminLayout></Layout>;

  // ── Cell editing ────────────────────────────────────────────────────────────
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

  // ── Time Slots ──────────────────────────────────────────────────────────────
  const addTimeSlot = () => {
    if (!newTime.trim() || timeSlots.includes(newTime.trim())) return;
    const updated = [...timeSlots, newTime.trim()];
    setTimeSlots(updated);
    setRoutine(prev => ({ ...prev, timeSlots: updated }));
    setNewTime('');
  };

  const removeTimeSlot = (time) => {
    const idx = timeSlots.indexOf(time);
    const updated = timeSlots.filter(t => t !== time);
    setTimeSlots(updated);
    // Also strip the column from all schedule days
    const updatedSchedule = {};
    Object.entries(routine.schedule).forEach(([day, slots]) => {
      updatedSchedule[day] = (slots || []).filter((_, i) => i !== idx);
    });
    setRoutine(prev => ({ ...prev, timeSlots: updated, schedule: updatedSchedule }));
  };

  const renameTimeSlot = (oldTime, newTimeValue) => {
    if (!newTimeValue || timeSlots.includes(newTimeValue)) return;
    const updated = timeSlots.map(t => t === oldTime ? newTimeValue : t);
    setTimeSlots(updated);
    // Update the stored time inside every schedule slot that used this time value
    const updatedSchedule = {};
    Object.entries(routine.schedule).forEach(([day, slots]) => {
      updatedSchedule[day] = (slots || []).map(slot => {
        if (slot && slot.time === oldTime) return { ...slot, time: newTimeValue };
        return slot;
      });
    });
    setRoutine(prev => ({ ...prev, timeSlots: updated, schedule: updatedSchedule }));
  };

  // ── Days ────────────────────────────────────────────────────────────────────
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

  const renameDay = (oldDay, newDayValue) => {
    if (!newDayValue || days.includes(newDayValue)) return;
    const updated = days.map(d => d === oldDay ? newDayValue : d);
    setDays(updated);
    const updatedSchedule = {};
    Object.entries(routine.schedule).forEach(([d, slots]) => {
      updatedSchedule[d === oldDay ? newDayValue : d] = slots;
    });
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

  // ── Subjects ────────────────────────────────────────────────────────────────
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
    setTimeout(() => setSubSuccess(''), 2500);
  };

  const handleRemoveSubject = async (name) => {
    const updated = subjects.filter(s => s !== name);
    await saveSubjects(updated);
    setSubjects(updated);
    setSubSuccess(`"${name}" removed.`);
    setTimeout(() => setSubSuccess(''), 2500);
  };

  // Rename subject: updates the subjects list AND cascades to all collections + routine cells
  const handleRenameSubject = async (oldName, newName) => {
    if (!newName || subjects.includes(newName)) {
      setSubError(subjects.includes(newName) ? 'That subject name already exists.' : 'Name cannot be empty.');
      setTimeout(() => setSubError(''), 3000);
      return;
    }
    // 1. Update subjects list
    const updatedSubjects = subjects.map(s => s === oldName ? newName : s);
    await saveSubjects(updatedSubjects);
    setSubjects(updatedSubjects);

    // 2. Cascade rename in routine schedule cells (local state — will be saved via Publish)
    const updatedSchedule = {};
    Object.entries(routine.schedule).forEach(([day, slots]) => {
      updatedSchedule[day] = (slots || []).map(slot => {
        if (slot && slot.subject === oldName) return { ...slot, subject: newName };
        return slot;
      });
    });
    setRoutine(prev => ({ ...prev, schedule: updatedSchedule }));

    // 3. Cascade rename in notes, assignments, lab-reports via the API
    try {
      for (const col of ['notes', 'assignments', 'labReports']) {
        const items = await getAll(col);
        for (const item of items) {
          if (item.subject === oldName) {
            await updateItem(col, item.id, { subject: newName });
          }
        }
      }
      setSubSuccess(`"${oldName}" renamed to "${newName}" and updated across all collections.`);
    } catch {
      setSubSuccess(`"${oldName}" renamed to "${newName}" in subjects & routine. Other collections may need a manual refresh.`);
    }
    setTimeout(() => setSubSuccess(''), 4000);
  };

  // ── Publish ─────────────────────────────────────────────────────────────────
  const handlePublish = async () => {
    await saveRoutine(routine);
    await saveSubjects(subjects);
    setSaved(true);
    setSaveMsg('✅ All changes published!');
    setTimeout(() => { setSaved(false); setSaveMsg(''); }, 2500);
  };

  return (
    <Layout title="Manage Routine &amp; Subjects — Admin">
      <AdminLayout title="🗓️ Manage Routine &amp; Subjects">

        {/* ---- SUBJECTS SECTION ---- */}
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>📚 Manage Subjects</h2>
            <p className={styles.hint}>Subjects appear as filter options across Notes, Assignments, Lab Reports, and admin forms. Click ✏️ to rename a subject.</p>
          </div>

          <form onSubmit={handleAddSubject} className={styles.addForm}>
            <input type="text" value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="New subject name..." className={styles.input} required />
            <button type="submit" className={styles.addBtn}>➕ Add Subject</button>
          </form>

          {subError && <div className={styles.error}>{subError}</div>}
          {subSuccess && <div className={styles.success}>{subSuccess}</div>}

          <div className={styles.subjectList}>
            {subjects.map((sub, i) => (
              <SubjectChip
                key={sub}
                name={sub}
                delay={i * 30}
                onRename={(newName) => handleRenameSubject(sub, newName)}
                onRemove={() => handleRemoveSubject(sub)}
                styles={styles}
              />
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
                {saved ? saveMsg : '💾 Publish All'}
              </button>
            </div>
          </div>
          <p className={styles.hint} style={{ marginBottom: '20px' }}>Click any cell to edit a subject slot. Click "Publish All" to persist all changes.</p>

          {/* Table Structure Editor (Days & Times) */}
          {editingTime && (
            <div className={styles.structureEditor}>
              {/* Columns Editor — Time Slots */}
              <div className={styles.timeEditor}>
                <h4 className={styles.timeEditorTitle}>🕐 Time Slots (Columns) — click ✏️ to rename</h4>
                <div className={styles.timeSlotList}>
                  {timeSlots.map(t => (
                    <EditableChip
                      key={t}
                      value={t}
                      onSave={(newVal) => renameTimeSlot(t, newVal)}
                      onRemove={() => removeTimeSlot(t)}
                    >
                      <span>{formatTime(t)}</span>
                    </EditableChip>
                  ))}
                </div>
                <div className={styles.timeSlotAdd}>
                  <input type="text" value={newTime} onChange={e => setNewTime(e.target.value)} placeholder="e.g. 13:00" className={styles.input} style={{ width: '120px' }} onKeyDown={e => e.key === 'Enter' && addTimeSlot()} />
                  <button className={styles.addBtn} style={{ padding: '8px 14px' }} onClick={addTimeSlot}>+ Add Slot</button>
                </div>
              </div>

              {/* Rows Editor — Days */}
              <div className={styles.timeEditor} style={{ marginTop: '16px' }}>
                <h4 className={styles.timeEditorTitle}>📅 Days (Rows) — click ✏️ to rename</h4>
                <div className={styles.timeSlotList}>
                  {days.map((d, i) => (
                    <EditableChip
                      key={d}
                      value={d}
                      onSave={(newVal) => renameDay(d, newVal)}
                      onRemove={() => removeDay(d)}
                    >
                      <button className={styles.chipMove} onClick={() => moveDay(i, -1)} disabled={i === 0}>←</button>
                      <span>{d}</span>
                      <button className={styles.chipMove} onClick={() => moveDay(i, 1)} disabled={i === days.length - 1}>→</button>
                    </EditableChip>
                  ))}
                </div>
                <div className={styles.timeSlotAdd}>
                  <input type="text" value={newDay} onChange={e => setNewDay(e.target.value)} placeholder="e.g. Monday" className={styles.input} style={{ width: '150px' }} onKeyDown={e => e.key === 'Enter' && addDay()} />
                  <button className={styles.addBtn} style={{ padding: '8px 14px' }} onClick={addDay}>+ Add Day</button>
                </div>
              </div>
            </div>
          )}

          {/* Schedule Table */}
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
                <div className={`${styles.field} ${styles.fieldWide}`}><label>Subject</label>
                  <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}>
                    <option value="">(Clear)</option>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className={styles.field}><label>Room</label><input type="text" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} placeholder="e.g. 301" /></div>
                <div className={styles.field}><label>Teacher</label><input type="text" value={form.teacher} onChange={e => setForm({ ...form, teacher: e.target.value })} placeholder="Teacher name" /></div>
                <div className={styles.field}><label>Type</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="lecture">Lecture</option><option value="lab">Lab</option></select></div>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.clearBtn} onClick={handleClearCell}>Clear Cell</button>
                <div style={{ flex: 1 }} />
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

// ── Subject chip with inline rename ──────────────────────────────────────────
function SubjectChip({ name, delay, onRename, onRemove, styles }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef(null);

  const startEdit = () => { setDraft(name); setEditing(true); };
  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name) onRename(trimmed);
    setEditing(false);
  };
  const cancel = () => setEditing(false);

  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  if (editing) {
    return (
      <div className={`${styles.subjectCard} ${styles.subjectCardEditing}`} style={{ animationDelay: `${delay}ms` }}>
        <input
          ref={inputRef}
          className={styles.subjectEditInput}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
          onBlur={commit}
        />
        <button className={`${styles.removeSubBtn} ${styles.saveSubBtn}`} onMouseDown={e => { e.preventDefault(); commit(); }} title="Save">✓</button>
        <button className={styles.removeSubBtn} onMouseDown={e => { e.preventDefault(); cancel(); }} title="Cancel">✕</button>
      </div>
    );
  }

  return (
    <div className={styles.subjectCard} style={{ animationDelay: `${delay}ms` }}>
      <span className={styles.subjectName}>📖 {name}</span>
      <button className={styles.editSubBtn} onClick={startEdit} title="Rename subject">✏️</button>
      <button className={styles.removeSubBtn} onClick={onRemove}>✕</button>
    </div>
  );
}

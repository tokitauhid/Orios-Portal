import React, { useState, useEffect } from 'react';
import styles from './styles.module.css';

/**
 * AdminForm — Reusable modal form for CRUD operations.
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {function} props.onClose - Close handler
 * @param {function} props.onSubmit - Submit handler (receives form data)
 * @param {string} props.title - Modal title
 * @param {Array} props.fields - Array of field configs: { name, label, type, options, required, placeholder }
 * @param {object} props.initialData - Pre-fill data for editing
 */
export default function AdminForm({ isOpen, onClose, onSubmit, title, fields = [], initialData = null }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({ ...initialData });
      } else {
        const defaults = {};
        fields.forEach(f => { defaults[f.name] = f.defaultValue || ''; });
        setFormData(defaults);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (name, value) => {
    const arr = value.split(',').map(v => v.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, [name]: arr }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            {fields.map(field => (
              <div key={field.name} className={`${styles.fieldGroup} ${field.fullWidth ? styles.fullWidth : ''}`}>
                <label className={styles.label}>{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    className={styles.input}
                    value={formData[field.name] || ''}
                    onChange={e => handleChange(field.name, e.target.value)}
                    required={field.required}
                  >
                    <option value="">Select...</option>
                    {(field.options || []).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    className={`${styles.input} ${styles.textarea}`}
                    value={formData[field.name] || ''}
                    onChange={e => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    rows={3}
                  />
                ) : field.type === 'tags' ? (
                  <input
                    type="text"
                    className={styles.input}
                    value={Array.isArray(formData[field.name]) ? formData[field.name].join(', ') : formData[field.name] || ''}
                    onChange={e => handleArrayChange(field.name, e.target.value)}
                    placeholder={field.placeholder || 'tag1, tag2, tag3'}
                  />
                ) : (
                  <input
                    type={field.type || 'text'}
                    className={styles.input}
                    value={formData[field.name] || ''}
                    onChange={e => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                )}
              </div>
            ))}
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Saving...' : (initialData ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

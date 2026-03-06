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
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        
        const dateString = `${yyyy}-${mm}-${dd}`;
        const dateTimeString = `${dateString}T${hh}:${min}`;

        fields.forEach(f => { 
          if (f.defaultValue) {
             defaults[f.name] = f.defaultValue;
          } else if (f.type === 'date') {
             defaults[f.name] = dateString;
          } else if (f.type === 'datetime-local') {
             defaults[f.name] = dateTimeString;
          } else {
             defaults[f.name] = '';
          }
        });
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
                ) : field.type === 'file' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <input
                      type="file"
                      className={styles.input}
                      onChange={e => {
                        const file = e.target.files[0];
                        if (!file) return;

                        // LocalStorage limit safe-guard (increased to 50MB per user request)
                        if (file.size > 50 * 1024 * 1024) {
                          alert('File is too large! Max allowed size is 50MB.');
                          e.target.value = '';
                          return;
                        }

                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const base64 = event.target.result;
                          const kb = file.size / 1024;
                          const sizeStr = kb > 1024 ? (kb / 1024).toFixed(1) + ' MB' : kb.toFixed(1) + ' KB';
                          
                          let ext = file.name.split('.').pop().toLowerCase();
                          let fileType = 'other';
                          let icon = '📁';
                          if (['pdf'].includes(ext)) { fileType = 'pdf'; icon = '📄'; }
                          else if (['zip', 'rar'].includes(ext)) { fileType = 'zip'; icon = '📦'; }
                          else if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) { fileType = 'image'; icon = '🖼️'; }
                          else if (['doc', 'docx'].includes(ext)) { fileType = 'doc'; icon = '📄'; }

                          setFormData(prev => ({
                            ...prev,
                            [field.name]: base64,
                            name: prev.name || file.name,
                            title: prev.title || file.name.split('.')[0],
                            size: prev.size || sizeStr,
                            type: prev.type || fileType,
                            format: prev.format || ext.toUpperCase(),
                            icon: prev.icon || icon,
                            // If there is a 'url' field and it's empty, use the base64 as the URL
                            url: prev.url ? prev.url : base64
                          }));
                        };
                        reader.readAsDataURL(file);
                      }}
                      required={field.required && !formData[field.name]}
                    />
                    {formData[field.name] && <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold' }}>✅ File attached properly</span>}
                  </div>
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

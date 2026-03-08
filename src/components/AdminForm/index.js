import React, { useState, useEffect } from 'react';
import { useToast } from '@site/src/components/Toast';
import styles from './styles.module.css';

/**
 * AdminForm — Reusable modal form for CRUD operations.
 * Uses toast notifications instead of browser alerts.
 */
export default function AdminForm({ isOpen, onClose, onSubmit, title, fields = [], initialData = null }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

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
      showToast('Saved successfully!', 'success');
      onClose();
    } catch (err) {
      showToast(err.message || 'Something went wrong', 'error', 6000);
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

                        if (file.size > 25 * 1024 * 1024) {
                          showToast('File is too large! Max allowed size is 25MB for KV Storage.', 'warning', 5000);
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

                          const titleWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                          const autoTags = titleWithoutExt.split(/[\s-_]+/).filter(t => t.length > 2).map(t => t.toLowerCase());

                          setFormData(prev => {
                            const updates = {
                              ...prev,
                              [field.name]: base64,
                              name: prev.name || file.name,
                              title: prev.title || titleWithoutExt,
                              size: prev.size || sizeStr,
                              type: prev.type || fileType,
                              format: prev.format || ext.toUpperCase(),
                              icon: prev.icon || icon,
                              url: prev.url ? prev.url : base64
                            };

                            // Auto-populate tags if a tags field exists and is empty
                            if (fields.some(f => f.name === 'tags') && (!updates.tags || updates.tags.length === 0)) {
                              updates.tags = autoTags;
                            }

                            return updates;
                          });
                        };
                        reader.readAsDataURL(file);
                      }}
                      required={field.required && !formData[field.name]}
                    />
                    {formData[field.name] && <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold' }}>✅ File attached properly</span>}
                  </div>
                ) : field.type === 'select-with-custom' ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <select
                      className={styles.input}
                      style={{ flex: '1 1 150px' }}
                      value={field.options.includes(formData[field.name]) ? formData[field.name] : (formData[field.name] ? 'custom' : '')}
                      onChange={e => {
                        if (e.target.value !== 'custom') {
                          handleChange(field.name, e.target.value);
                        } else {
                          handleChange(field.name, ''); // Clear to allow typing custom
                        }
                      }}
                      required={field.required && !formData[field.name]}
                    >
                      <option value="">Select...</option>
                      {(field.options || []).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                      <option value="custom">Other (Custom)</option>
                    </select>
                    {(!field.options.includes(formData[field.name]) && formData[field.name] !== undefined) && (
                      <input
                        type="text"
                        className={styles.input}
                        style={{ flex: '1 1 150px' }}
                        value={formData[field.name] || ''}
                        onChange={e => handleChange(field.name, e.target.value)}
                        placeholder="Type custom value..."
                        required={field.required}
                      />
                    )}
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

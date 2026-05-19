import React, { useState, useEffect, useRef } from "react";
import Layout from "@theme/Layout";
import { useHistory } from "@docusaurus/router";
import { getCurrentUser, isAdmin, signOut } from "@site/src/auth";
import { getAll, addItem, updateItem, deleteItem } from "@site/src/auth";
import { useToast } from "@site/src/components/Toast";
import styles from "./styles.module.css";

/* ============================================================================
   ADMIN LAYOUT
   ============================================================================ */
const navItems = [
  { label: "📊 Dashboard", to: "/admin" },
  { label: "📢 Notices", to: "/admin/notices" },
  { label: "📅 Events", to: "/admin/events" },
  { label: "📋 Assignments", to: "/admin/assignments" },
  { label: "🔬 Lab Reports", to: "/admin/lab-reports" },
  { label: "📝 Notes", to: "/admin/notes-manager" },
  { label: "👨‍🏫 Teachers", to: "/admin/teachers-manager" },
  { label: "📁 Files", to: "/admin/files-manager" },
  { label: "🗓️ Routine", to: "/admin/routine-manager" },
  { label: "👥 Admins", to: "/admin/admins" },
];

export function AdminLayout({ children, title }) {
  const [user, setUser] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const history = useHistory();

  useEffect(() => {
    async function checkAuth() {
      const storedAuth = localStorage.getItem("orios_admin_verified");
      const currentUser = getCurrentUser();

      if (!currentUser || !storedAuth) {
        setLoading(false);
        history.push("/admin/login");
        return;
      }

      setUser(currentUser);
      const adminCheck = await isAdmin(currentUser.email);
      if (!adminCheck) {
        history.push("/admin/login");
      } else {
        setAuthorized(true);
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  const handleLogout = () => {
    signOut();
    history.push("/admin/login");
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <p>Verifying access...</p>
      </div>
    );
  }

  if (!authorized) return null;

  const currentPath = typeof window !== "undefined" ? window.location.pathname : "";

  return (
    <div className={styles.adminRoot}>
      <div className={styles.bgMesh}></div>
      <header className={styles.mobileHeader}>
        <div className={styles.mobileBrand}>
          <span className={styles.sidebarLogo}>⚙️</span>
          <span className={styles.mobileTitle}>Orios Admin</span>
        </div>
        <button className={styles.menuBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? "✕" : "☰"}
        </button>
      </header>

      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarLogo}>⚙️</span>
          <span className={styles.sidebarTitle}>Admin Panel</span>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navLabel}>Menu</div>
          {navItems.map((item) => {
            const isActive = currentPath === item.to || currentPath === item.to + "/";
            return (
              <a key={item.to} href={item.to} className={`${styles.navItem} ${isActive ? styles.navActive : ""}`} onClick={() => setSidebarOpen(false)}>
                <span className={styles.navIcon}>{item.label.split(" ")[0]}</span>
                <span className={styles.navText}>{item.label.split(" ").slice(1).join(" ")}</span>
              </a>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.avatarPlaceholder}>{user?.email?.[0]?.toUpperCase() || "?"}</div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user?.displayName || "Admin"}</span>
              <span className={styles.userEmail}>{user?.email}</span>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}><span>🚪</span> Logout</button>
        </div>
      </aside>

      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

      <main className={styles.main}>
        {title && (
          <header className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>{title}</h1>
            <div className={styles.headerGlow}></div>
          </header>
        )}
        <section className={styles.contentArea}>{children}</section>
      </main>
    </div>
  );
}

/* ============================================================================
   DATA TABLE
   ============================================================================ */
export function DataTable({ columns, data, onEdit, onDelete, searchKeys = [] }) {
  const [query, setQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const q = query.toLowerCase().trim();
  const filtered = q
    ? data.filter((row) =>
        searchKeys.some((key) => {
          const val = row[key];
          if (Array.isArray(val)) return val.some((v) => String(v).toLowerCase().includes(q));
          return String(val || "").toLowerCase().includes(q);
        }),
      )
    : data;

  const handleDelete = (row) => {
    if (confirmDelete === row.id) {
      onDelete(row);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(row.id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const gridTemplateColumns = `repeat(${columns.length}, 1fr) 100px`;

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <div className={styles.tableMeta}>
          <h2 className={styles.tableTitle}>Records</h2>
          <span className={styles.countBadge}>{filtered.length} items</span>
        </div>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input type="text" placeholder="Search all columns..." value={query} onChange={(e) => setQuery(e.target.value)} className={styles.searchInput} />
          {query && <button className={styles.clearSearch} onClick={() => setQuery("")}>×</button>}
        </div>
      </div>
      <div className={styles.tableWrap}>
        <div className={styles.table}>
          <div className={styles.thead} style={{ gridTemplateColumns }}>
            {columns.map((col) => <div key={col.key} className={styles.th}>{col.label}</div>)}
            <div className={styles.th} style={{ textAlign: "right" }}>Actions</div>
          </div>
          <div className={styles.tbody}>
            {filtered.length === 0 ? (
              <div className={styles.empty}><p>No items found matching "{query}"</p></div>
            ) : (
              filtered.map((row) => (
                <div key={row.id} className={styles.row} style={{ gridTemplateColumns }}>
                  {columns.map((col) => (
                    <div key={col.key} className={styles.td} data-label={col.label}>
                      {col.render ? col.render(row) : Array.isArray(row[col.key]) ? (
                        <div className={styles.tagWrap}>
                          {row[col.key].map((t) => <span key={t} className={styles.tag}>{t}</span>)}
                        </div>
                      ) : (
                        <span className={styles.cellText}>{String(row[col.key] || "—")}</span>
                      )}
                    </div>
                  ))}
                  <div className={styles.td} data-label="Actions">
                    <div className={styles.actions}>
                      <button className={styles.actionBtn} onClick={() => onEdit(row)} title="Edit"><span>✏️</span></button>
                      <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(row)} title={confirmDelete === row.id ? "Confirm?" : "Delete"}>
                        {confirmDelete === row.id ? <span>⚠️</span> : <span>🗑️</span>}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   ADMIN FORM
   ============================================================================ */
export function AdminForm({ isOpen, onClose, onSubmit, title, fields = [], initialData = null }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const fileInputRefs = useRef({});
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({ ...initialData });
      } else {
        const defaults = {};
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const hh = String(now.getHours()).padStart(2, "0");
        const min = String(now.getMinutes()).padStart(2, "0");

        const dateString = `${yyyy}-${mm}-${dd}`;
        const dateTimeString = `${dateString}T${hh}:${min}`;

        fields.forEach((f) => {
          if (f.defaultValue) defaults[f.name] = f.defaultValue;
          else if (f.type === "date") defaults[f.name] = dateString;
          else if (f.type === "datetime-local") defaults[f.name] = dateTimeString;
          else defaults[f.name] = "";
        });
        setFormData(defaults);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (name, value) => setFormData((prev) => ({ ...prev, [name]: value }));
  const handleArrayChange = (name, value) => {
    const arr = value.split(",").map((v) => v.trim()).filter(Boolean);
    setFormData((prev) => ({ ...prev, [name]: arr }));
  };

  const processSelectedFile = (field, file) => {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      showToast("File is too large! Max allowed size is 25MB.", "warning", 5000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      const kb = file.size / 1024;
      const sizeStr = kb > 1024 ? (kb / 1024).toFixed(1) + " MB" : kb.toFixed(1) + " KB";
      const ext = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "";
      let fileType = "other";
      let icon = "📁";
      if (["pdf"].includes(ext)) { fileType = "pdf"; icon = "📄"; }
      else if (["zip", "rar"].includes(ext)) { fileType = "zip"; icon = "📦"; }
      else if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext)) { fileType = "image"; icon = "🖼️"; }
      else if (["doc", "docx"].includes(ext)) { fileType = "doc"; icon = "📄"; }
      const titleWithoutExt = ext ? file.name.substring(0, file.name.lastIndexOf(".")) : file.name;
      const autoTags = titleWithoutExt.split(/[\s-_]+/).filter((t) => t.length > 2).map((t) => t.toLowerCase());

      setFormData((prev) => {
        const updates = {
          ...prev,
          [field.name]: base64,
          name: prev.name || file.name,
          title: prev.title || titleWithoutExt,
          size: prev.size || sizeStr,
          type: prev.type || fileType,
          format: prev.format || ext.toUpperCase(),
          icon: prev.icon || icon,
          url: prev.url ? prev.url : base64,
        };
        if (fields.some((f) => f.name === "tags") && (!updates.tags || updates.tags.length === 0)) updates.tags = autoTags;
        return updates;
      });
    };
    reader.readAsDataURL(file);
  };

  const openFilePicker = async (field) => {
    const picker = window.showOpenFilePicker;
    if (typeof picker === "function") {
      try {
        const [handle] = await picker({ multiple: false, excludeAcceptAllOption: false, types: [] });
        if (!handle) return;
        processSelectedFile(field, await handle.getFile());
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    }

    fileInputRefs.current[field.name]?.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      showToast("Saved successfully!", "success");
      onClose();
    } catch (err) {
      showToast(err.message || "Something went wrong", "error", 6000);
    }
    setLoading(false);
  };

  return (
    <div className={`${styles.formOverlay} ${isOpen ? styles.formOpen : ""}`} onClick={onClose}>
      <div className={`${styles.formDrawer} ${isOpen ? styles.formOpen : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.drawerHeader}>
          <h2 className={styles.drawerTitle}>{title}</h2>
          <button className={styles.closeBtn} onClick={onClose} title="Close (ESC)">×</button>
        </div>
        <div className={styles.drawerContent}>
          <form className={styles.form} onSubmit={handleSubmit} id="admin-form">
            <div className={styles.formGrid}>
              {fields.map((field) => (
                <div key={field.name} className={`${styles.fieldGroup} ${field.fullWidth ? styles.fullWidth : ""}`}>
                  <label htmlFor={field.name} className={styles.label}>{field.label} {field.required && <span className={styles.required}>*</span>}</label>
                  {field.type === "select" ? (
                    <select className={styles.input} value={formData[field.name] || ""} onChange={(e) => handleChange(field.name, e.target.value)} required={field.required}>
                      <option value="">Select...</option>
                      {(field.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea className={`${styles.input} ${styles.textarea}`} value={formData[field.name] || ""} onChange={(e) => handleChange(field.name, e.target.value)} placeholder={field.placeholder} required={field.required} rows={4} />
                  ) : field.type === "tags" ? (
                    <input type="text" className={styles.input} value={Array.isArray(formData[field.name]) ? formData[field.name].join(", ") : formData[field.name] || ""} onChange={(e) => handleArrayChange(field.name, e.target.value)} placeholder={field.placeholder || "tag1, tag2, tag3"} />
                  ) : field.type === "file" ? (
                    <div className={styles.fileWrap}>
                      <button type="button" className={styles.input} onClick={() => openFilePicker(field)}>
                        Choose File
                      </button>
                      <input
                        ref={(node) => { fileInputRefs.current[field.name] = node; }}
                        type="file"
                        accept="*/*"
                        className={styles.input}
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          processSelectedFile(field, file);
                          e.target.value = "";
                        }}
                        required={field.required && !formData[field.name]}
                      />
                      {formData[field.name] && <span className={styles.fileSuccess}>✅ File attached properly</span>}
                    </div>
                  ) : field.type === "select-with-custom" ? (
                    <div className={styles.customSelectWrap}>
                      <select className={styles.input} style={{ flex: "1 1 150px" }} value={field.options.includes(formData[field.name]) ? formData[field.name] : formData[field.name] ? "custom" : ""} onChange={(e) => {
                          if (e.target.value !== "custom") handleChange(field.name, e.target.value);
                          else handleChange(field.name, "");
                        }} required={field.required && !formData[field.name]}>
                        <option value="">Select...</option>
                        {(field.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        <option value="custom">Other (Custom)</option>
                      </select>
                      {!field.options.includes(formData[field.name]) && formData[field.name] !== undefined && (
                        <input type="text" className={styles.input} style={{ flex: "1 1 150px" }} value={formData[field.name] || ""} onChange={(e) => handleChange(field.name, e.target.value)} placeholder="Type custom value..." required={field.required} />
                      )}
                    </div>
                  ) : (
                    <input type={field.type || "text"} className={styles.input} value={formData[field.name] || ""} onChange={(e) => handleChange(field.name, e.target.value)} placeholder={field.placeholder} required={field.required} />
                  )}
                </div>
              ))}
            </div>
          </form>
        </div>
        <div className={styles.drawerFooter}>
          <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" form="admin-form" className={styles.submitBtn} disabled={loading}>{loading ? "Saving..." : initialData ? "Update Item" : "Create Item"}</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   ADMIN CRUD
   ============================================================================ */
export function AdminCrud({ title, icon, collection, fields, columns, searchKeys, addLabel = "Add Item", onSubmitModifier }) {
  const [data, setData] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setData(await getAll(collection));
  };
  useEffect(() => {
    load();
  }, [collection]);

  const handleSubmit = async (formData) => {
    let finalData = { ...formData };
    if (onSubmitModifier) finalData = onSubmitModifier(finalData);

    if (editing) await updateItem(collection, editing.id, finalData);
    else await addItem(collection, finalData);
    
    setEditing(null);
    await load();
  };

  const handleEdit = (row) => {
    setEditing(row);
    setFormOpen(true);
  };
  
  const handleDelete = async (row) => {
    await deleteItem(collection, row.id);
    await load();
  };

  return (
    <Layout title={`${title} — Admin`}>
      <AdminLayout title={`${icon} ${title}`}>
        <button className={styles.addBtn} onClick={() => { setEditing(null); setFormOpen(true); }}>
          ➕ {addLabel}
        </button>
        <DataTable columns={columns} data={data} onEdit={handleEdit} onDelete={handleDelete} searchKeys={searchKeys} />
        <AdminForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title={editing ? `Edit ${addLabel.replace("Add ", "")}` : addLabel} fields={fields} initialData={editing} />
      </AdminLayout>
    </Layout>
  );
}

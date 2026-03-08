import React, { useState, useEffect } from 'react';
import { useHistory } from '@docusaurus/router';
import { getCurrentUser, isAdmin, signOut } from '@site/src/auth/auth';
import styles from './styles.module.css';

const navItems = [
  { label: '📊 Dashboard', to: '/admin' },
  { label: '📢 Notices', to: '/admin/notices' },
  { label: '📅 Events', to: '/admin/events' },
  { label: '📋 Assignments', to: '/admin/assignments' },
  { label: '🔬 Lab Reports', to: '/admin/lab-reports' },
  { label: '📝 Notes', to: '/admin/notes-manager' },
  { label: '👨‍🏫 Teachers', to: '/admin/teachers-manager' },
  { label: '📁 Files', to: '/admin/files-manager' },
  { label: '🗓️ Routine & Subjects', to: '/admin/routine-manager' },
  { label: '👥 Admins', to: '/admin/admins' },
];

export default function AdminLayout({ children, title }) {
  const [user, setUser] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const history = useHistory();

  useEffect(() => {
    async function checkAuth() {
      const storedAuth = localStorage.getItem('orios_admin_verified');
      const currentUser = getCurrentUser();

      if (!currentUser || !storedAuth) {
        setLoading(false);
        history.push('/admin/login');
        return;
      }

      setUser(currentUser);
      const adminCheck = await isAdmin(currentUser.email);
      if (!adminCheck) {
        history.push('/admin/login');
      } else {
        setAuthorized(true);
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  const handleLogout = () => {
    signOut();
    history.push('/admin/login');
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

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  return (
    <div className={styles.layout}>
      <div className={styles.mobileHeader}>
        <button className={styles.menuBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? '✕' : '☰'}
        </button>
        <span className={styles.mobileTitle}>⚙️ Admin</span>
      </div>

      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarLogo}>⚙️</span>
          <span className={styles.sidebarTitle}>Admin Panel</span>
        </div>

        <nav className={styles.nav}>
          {navItems.map(item => (
            <a
              key={item.to}
              href={item.to}
              className={`${styles.navItem} ${currentPath === item.to || currentPath === item.to + '/' ? styles.navActive : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.avatarPlaceholder}>{user?.email?.[0]?.toUpperCase() || '?'}</div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user?.displayName || 'Admin'}</span>
              <span className={styles.userEmail}>{user?.email}</span>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>🚪 Logout</button>
        </div>
      </aside>

      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

      <main className={styles.main}>
        {title && (
          <header className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>{title}</h1>
          </header>
        )}
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}

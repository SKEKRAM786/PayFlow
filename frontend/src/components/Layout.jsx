import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from '../services/api';
import {
  LayoutDashboard,
  TrendingUp,
  CreditCard,
  ArrowLeftRight,
  BookOpen,
  RotateCcw,
  Users,
  FileCheck2,
  ShieldCheck,
  Moon,
  Sun,
  LogOut,
  Menu,
  X,
  Bell,
  Check,
  Trash2,
  ChevronDown
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      loadNotifications();
      // Setup SSE real-time connection with polling fallback
      const token = localStorage.getItem('payflow_token');
      let eventSource = null;

      try {
        // SSE connection
        eventSource = new EventSource(`http://localhost:8080/api/notifications/stream?token=${token}`);
        eventSource.addEventListener('NOTIFICATION', (event) => {
          try {
            const newNotif = JSON.parse(event.data);
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);
          } catch (e) {
            console.error('Failed to parse SSE notification', e);
          }
        });
      } catch (err) {
        console.warn('SSE stream error, using interval polling fallback', err);
      }

      // Interval fallback for unread badge
      const interval = setInterval(() => {
        getUnreadNotificationCount()
          .then(res => setUnreadCount(res.unreadCount || 0))
          .catch(() => {});
      }, 30000);

      return () => {
        if (eventSource) eventSource.close();
        clearInterval(interval);
      };
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        getNotifications(0, 10).catch(() => ({ content: [] })),
        getUnreadNotificationCount().catch(() => ({ unreadCount: 0 }))
      ]);
      setNotifications(listRes.content || []);
      setUnreadCount(countRes.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleDeleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['ADMIN', 'OPERATIONS', 'CUSTOMER'] },
    { name: 'Analytics', path: '/analytics', icon: TrendingUp, roles: ['ADMIN', 'OPERATIONS'] },
    { name: 'Payments', path: '/payments', icon: CreditCard, roles: ['ADMIN', 'OPERATIONS', 'CUSTOMER'] },
    { name: 'Ledger', path: '/ledger', icon: BookOpen, roles: ['ADMIN', 'OPERATIONS', 'CUSTOMER'] },
    { name: 'Refunds', path: '/refunds', icon: RotateCcw, roles: ['ADMIN', 'OPERATIONS'] },
    { name: 'Customers', path: '/customers', icon: Users, roles: ['ADMIN', 'OPERATIONS', 'CUSTOMER'] },
    { name: 'Reconciliation', path: '/reconciliation', icon: FileCheck2, roles: ['ADMIN', 'OPERATIONS'] },
    { name: 'Audit Logs', path: '/audit-logs', icon: ShieldCheck, roles: ['ADMIN'] },
    { name: 'User Directory', path: '/users', icon: Users, roles: ['ADMIN'] },
  ];

  const allowedNav = navItems.filter(item => !user || item.roles.includes(user.role));

  return (
    <div className="app-layout">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="modal-backdrop" 
          style={{ zIndex: 35 }} 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="brand-logo" onClick={() => setSidebarOpen(false)}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 800
            }}>
              PF
            </div>
            <span>PayFlow</span>
            <span className="brand-badge">SaaS</span>
          </Link>
          <button 
            className="menu-toggle" 
            style={{ display: sidebarOpen ? 'block' : 'none' }}
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Core Operations</div>
          {allowedNav.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
              <div className="user-avatar">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.825rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user?.fullName || 'User'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {user?.role || 'Guest'}
                </div>
              </div>
            </div>
            <button 
              className="btn-close" 
              onClick={handleLogout} 
              title="Sign Out"
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <LogOut size={16} />
            </button>
          </div>

          <div style={{
            paddingTop: '0.6rem',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.72rem',
            color: 'var(--text-dim)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>Built by <strong>Sk Ekram</strong></span>
            <a
              href="https://www.linkedin.com/in/skekram/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
            >
              <span>LinkedIn</span> ↗
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Top Navigation Bar */}
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </button>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Environment: <strong style={{ color: 'var(--success)' }}>Simulated Live Engine</strong>
            </div>
          </div>

          <div className="topbar-right">
            {/* Theme Toggle Button */}
            <button 
              className="theme-toggle-btn" 
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notifications Dropdown */}
            <div style={{ position: 'relative' }}>
              <button 
                className="theme-toggle-btn"
                onClick={() => setNotificationsOpen(prev => !prev)}
                title="Notifications"
                style={{ position: 'relative' }}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    background: 'var(--danger)',
                    color: 'white',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div 
                  className="card" 
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '110%',
                    width: 340,
                    padding: '1rem',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 50
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '0.9rem' }}>Notifications</strong>
                      {unreadCount > 0 && <span className="badge badge-info">{unreadCount} unread</span>}
                    </div>
                    {unreadCount > 0 && (
                      <button 
                        className="btn btn-sm btn-outline" 
                        style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                        onClick={handleMarkAllAsRead}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {notifications.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          style={{
                            padding: '0.6rem',
                            background: n.isRead ? 'transparent' : 'var(--bg-card-hover)',
                            borderLeft: n.isRead ? 'none' : '3px solid var(--primary)',
                            borderRadius: '0.25rem',
                            fontSize: '0.8rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <strong style={{ color: n.isRead ? 'var(--text-muted)' : 'var(--text-main)' }}>{n.title}</strong>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              {!n.isRead && (
                                <button 
                                  className="btn-close" 
                                  style={{ fontSize: '0.8rem' }} 
                                  onClick={(e) => handleMarkAsRead(n.id, e)}
                                  title="Mark as read"
                                >
                                  <Check size={12} />
                                </button>
                              )}
                              <button 
                                className="btn-close" 
                                style={{ fontSize: '0.8rem', color: 'var(--danger)' }} 
                                onClick={(e) => handleDeleteNotification(n.id, e)}
                                title="Delete"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.75rem' }}>{n.message}</p>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '0.25rem', display: 'block' }}>
                            {new Date(n.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            <div className="user-profile-menu">
              <button 
                className="theme-toggle-btn" 
                style={{ padding: '0.35rem 0.65rem', gap: '0.5rem' }}
                onClick={() => setProfileOpen(prev => !prev)}
              >
                <div className="user-avatar" style={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user?.fullName?.split(' ')[0]}</span>
                <ChevronDown size={14} />
              </button>

              {profileOpen && (
                <div 
                  className="card"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '110%',
                    width: 220,
                    padding: '0.75rem',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 50
                  }}
                >
                  <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user?.fullName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                    <div style={{ marginTop: '0.25rem' }}>
                      <span className="badge badge-info">{user?.role}</span>
                    </div>
                  </div>
                  <button 
                    className="btn btn-sm btn-outline" 
                    style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger)' }}
                    onClick={handleLogout}
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content View */}
        <main className="content-container">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

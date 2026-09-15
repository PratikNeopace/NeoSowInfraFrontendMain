import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/logo.svg';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = localStorage.getItem('userEmail') || 'User';
  const userName = email.split('@')[0];
  const formattedUserName = userName.charAt(0).toUpperCase() + userName.slice(1);
  const roles = JSON.parse(localStorage.getItem('userRoles') || '[]');
  const isAdmin = roles.includes('ROLE_ADMIN') || roles.includes('ROLE_SUPER_ADMIN');

  const [logoError, setLogoError] = useState(false);

  const [notifications, setNotifications] = useState(() => {
    return JSON.parse(localStorage.getItem('admin_notifications') || '[]');
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = (e) => {
    e.stopPropagation();
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('admin_notifications', JSON.stringify(updated));
  };

  const clearAllNotifications = (e) => {
    e.stopPropagation();
    setNotifications([]);
    localStorage.setItem('admin_notifications', JSON.stringify([]));
  };

  const deleteNotification = (id, e) => {
    e.stopPropagation();
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    localStorage.setItem('admin_notifications', JSON.stringify(updated));
  };

  const handleBellClick = () => {
    const latestNotis = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
    setNotifications(latestNotis);
  };

  useEffect(() => {
    const handleStorageChange = () => {
      setNotifications(JSON.parse(localStorage.getItem('admin_notifications') || '[]'));
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.clear();
      navigate('/login');
    }
  };

  // Static or current dynamic date matching screenshot format
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom py-3" style={{ fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
      <div className="container-fluid px-lg-5 px-3">
        {/* Brand Logo with automatic image detection & SVG fallback */}
        <Link className="navbar-brand d-flex align-items-center text-decoration-none" to="/">
          {!logoError ? (
            <img 
              src={logo} 
              alt="NEO SOW INFRA" 
              style={{ height: '56px', objectFit: 'contain' }} 
              onError={() => setLogoError(true)} 
            />
          ) : (
            <div className="d-flex align-items-center">
              <svg width="52" height="52" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="me-2">
                <path d="M50 10C27.9 10 10 27.9 10 50C10 72.1 27.9 90 50 90C61 90 71 85.5 78.3 78.3L64.2 64.2C59.2 69.2 52.2 72.2 44.4 72.2C27.9 72.2 14.4 58.7 14.4 42.2C14.4 25.7 27.9 12.2 44.4 12.2C54.4 12.2 63.3 17.2 68.7 24.8L82.9 10.6C74.6 3.9 64.1 0 52.8 0L50 10Z" fill="#153325" />
                <path d="M50 25L75 50L50 75L25 50L50 25Z" stroke="#c5a059" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M50 20V80" stroke="#c5a059" strokeWidth="6" strokeLinecap="round" />
              </svg>
              <div className="d-flex flex-column" style={{ fontFamily: 'Georgia, serif' }}>
                <span style={{ color: '#153325', fontWeight: '900', fontSize: '20px', letterSpacing: '0.05em', lineHeight: '1' }}>NEO SOW</span>
                <span style={{ color: '#c5a059', fontWeight: 'bold', fontSize: '12px', letterSpacing: '0.25em', marginTop: '1px', lineHeight: '1' }}>I N F R A</span>
              </div>
            </div>
          )}
        </Link>

        <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavUser">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNavUser">
          <ul className="navbar-nav mx-auto align-items-center mt-3 mt-lg-0">
            <li className="nav-item">
              <Link 
                className={`nav-link px-3 fw-semibold ${location.pathname === '/' ? 'active-nav' : 'text-secondary'}`} 
                to="/"
                style={{ transition: 'color 0.2s', paddingBottom: location.pathname === '/' ? '8px' : '6px' }}
              >
                Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`nav-link px-3 fw-semibold ${location.pathname.startsWith('/quotations') && !location.pathname.includes('customer') ? 'active-nav' : 'text-secondary'}`} 
                to="/quotations"
                style={{ transition: 'color 0.2s', paddingBottom: location.pathname.startsWith('/quotations') && !location.pathname.includes('customer') ? '8px' : '6px' }}
              >
                Quotations
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`nav-link px-3 fw-semibold ${location.pathname.includes('customer-details') ? 'active-nav' : 'text-secondary'}`} 
                to="/customer-details"
                style={{ transition: 'color 0.2s', paddingBottom: location.pathname.includes('customer-details') ? '8px' : '6px' }}
              >
                Customers
              </Link>
            </li>
            {isAdmin && (
              <li className="nav-item">
                <Link 
                  className={`nav-link px-3 fw-semibold ${location.pathname.startsWith('/admin') ? 'active-nav' : 'text-secondary'}`} 
                  to="/admin"
                  style={{ transition: 'color 0.2s', paddingBottom: location.pathname.startsWith('/admin') ? '8px' : '6px' }}
                >
                  Admin Panel
                </Link>
              </li>
            )}
            <li className="nav-item">
              <Link 
                className={`nav-link px-3 fw-semibold ${location.pathname === '/profile' ? 'active-nav' : 'text-secondary'}`} 
                to="/profile"
                style={{ transition: 'color 0.2s', paddingBottom: location.pathname === '/profile' ? '8px' : '6px' }}
              >
                Profile
              </Link>
            </li>
          </ul>

          <div className="d-flex align-items-center justify-content-center gap-3 mt-3 mt-lg-0">
            {/* Current Date Display */}
            {isAdmin ? (
              <div className="dropdown">
                <button className="btn btn-light btn-sm rounded-pill px-3 py-2 border d-flex align-items-center text-secondary font-monospace" style={{ fontSize: '13px' }}>
                  {currentDate} <i className="fas fa-chevron-down ms-2 small"></i>
                </button>
              </div>
            ) : (
              <div className="btn btn-light btn-sm rounded-pill px-3 py-2 border d-flex align-items-center text-secondary font-monospace" style={{ fontSize: '13px', cursor: 'default' }}>
                {currentDate}
              </div>
            )}

            {/* Notification Bell with Dropdown (Admin only) */}
            {isAdmin && (
              <div className="dropdown">
                <button 
                  className="btn btn-light btn-sm rounded-circle p-2 border position-relative" 
                  style={{ width: '38px', height: '38px' }} 
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  onClick={handleBellClick}
                >
                  <i className="fas fa-bell text-secondary fs-6"></i>
                  {unreadCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '9px', padding: '3px 6px' }}>
                      {unreadCount}
                    </span>
                  )}
                </button>
                <div className="dropdown-menu dropdown-menu-end p-0 shadow-lg border-0" style={{ width: '320px', borderRadius: '12px', fontSize: '13px' }}>
                  <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light" style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                    <span className="fw-bold text-dark">Notifications</span>
                  </div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div className="text-center py-5 text-secondary">
                        <i className="far fa-bell-slash mb-2 text-muted" style={{ fontSize: '24px' }}></i>
                        <p className="mb-0">No notifications yet.</p>
                      </div>
                    ) : (
                      notifications.map(noti => (
                        <div key={noti.id} className={`p-3 border-bottom d-flex justify-content-between align-items-start ${noti.read ? 'bg-white' : 'bg-light-subtle'}`} style={{ transition: 'background-color 0.2s' }}>
                          <div style={{ flex: '1', paddingRight: '8px' }}>
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <span className={`badge rounded-pill ${noti.read ? 'bg-secondary' : 'bg-primary'}`} style={{ fontSize: '9px' }}>
                                {noti.read ? 'Read' : 'New'}
                              </span>
                              <span className="text-muted small font-monospace" style={{ fontSize: '10px' }}>{noti.date} @ {noti.time}</span>
                            </div>
                            <p className="mb-0 text-dark fw-semibold" style={{ fontSize: '12px', lineHeight: '1.4' }}>{noti.message}</p>
                            {noti.amount > 0 && (
                              <span className="text-success fw-bold font-monospace d-block mt-1" style={{ fontSize: '11px' }}>
                                ₹{noti.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                          <div className="d-flex gap-2 align-items-center pt-1">
                            {!noti.read && (
                              <button 
                                className="btn btn-link p-0 text-primary border-0 bg-transparent" 
                                title="Mark Read"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updated = notifications.map(n => n.id === noti.id ? { ...n, read: true } : n);
                                  setNotifications(updated);
                                  localStorage.setItem('admin_notifications', JSON.stringify(updated));
                                }}
                              >
                                <i className="fas fa-check-circle" style={{ fontSize: '14px' }}></i>
                              </button>
                            )}
                            <button 
                              className="btn btn-link p-0 text-danger border-0 bg-transparent" 
                              title="Delete"
                              onClick={(e) => deleteNotification(noti.id, e)}
                            >
                              <i className="fas fa-trash" style={{ fontSize: '13px' }}></i>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="p-2 bg-light border-top d-flex justify-content-between align-items-center" style={{ borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                      <button className="btn btn-link p-0 text-primary text-decoration-none fw-semibold w-50 text-center border-end" style={{ fontSize: '12px' }} onClick={markAllAsRead}>
                        Mark all read
                      </button>
                      <button className="btn btn-link p-0 text-danger text-decoration-none fw-semibold w-50 text-center" style={{ fontSize: '12px' }} onClick={clearAllNotifications}>
                        Clear all
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Settings Icon (Admin only) */}
            {isAdmin && (
              <button className="btn btn-light btn-sm rounded-circle p-2 border" style={{ width: '38px', height: '38px' }} onClick={() => alert('Settings menu is under development.')}>
                <i className="fas fa-cog text-secondary fs-6"></i>
              </button>
            )}

            {/* Profile Dropdown */}
            <div className="dropdown">
              <button 
                className="btn btn-white btn-sm d-flex align-items-center gap-2 border-0 px-2" 
                type="button" 
                id="profileDropdown" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
              >
                <img 
                  src={`https://ui-avatars.com/api/?name=${userName}&background=174D3A&color=fff&rounded=true&size=32`} 
                  alt="Profile" 
                  style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                />
                <span className="fw-semibold text-dark d-none d-md-inline" style={{ fontSize: '14px' }}>Jr. {formattedUserName}</span>
                <i className="fas fa-chevron-down text-secondary small"></i>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2" aria-labelledby="profileDropdown">
                <li>
                  <button className="dropdown-item py-2 text-dark" onClick={() => navigate('/profile')}>
                    <i className="fas fa-user me-2 text-secondary" style={{ fontSize: '13px' }}></i> My Profile
                  </button>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item py-2 text-danger" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt me-2" style={{ fontSize: '13px' }}></i> Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

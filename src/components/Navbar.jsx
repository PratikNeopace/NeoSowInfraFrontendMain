import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = localStorage.getItem('userEmail') || 'User';
  const userName = email.split('@')[0];
  const formattedUserName = userName.charAt(0).toUpperCase() + userName.slice(1);
  const roles = JSON.parse(localStorage.getItem('userRoles') || '[]');
  const isAdmin = roles.includes('ROLE_ADMIN') || roles.includes('ROLE_SUPER_ADMIN');

  const [logoError, setLogoError] = useState(false);

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
              src="/src/assets/logo.svg" 
              alt="NEO SOW INFRA" 
              style={{ height: '38px', objectFit: 'contain' }} 
              onError={() => setLogoError(true)} 
            />
          ) : (
            <div className="d-flex align-items-center">
              <svg width="34" height="34" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="me-2">
                <path d="M50 10C27.9 10 10 27.9 10 50C10 72.1 27.9 90 50 90C61 90 71 85.5 78.3 78.3L64.2 64.2C59.2 69.2 52.2 72.2 44.4 72.2C27.9 72.2 14.4 58.7 14.4 42.2C14.4 25.7 27.9 12.2 44.4 12.2C54.4 12.2 63.3 17.2 68.7 24.8L82.9 10.6C74.6 3.9 64.1 0 52.8 0L50 10Z" fill="#153325" />
                <path d="M50 25L75 50L50 75L25 50L50 25Z" stroke="#c5a059" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M50 20V80" stroke="#c5a059" strokeWidth="6" strokeLinecap="round" />
              </svg>
              <div className="d-flex flex-column" style={{ fontFamily: 'Georgia, serif' }}>
                <span style={{ color: '#153325', fontWeight: '900', fontSize: '15px', letterSpacing: '0.05em', lineHeight: '1' }}>NEO SOW</span>
                <span style={{ color: '#c5a059', fontWeight: 'bold', fontSize: '9px', letterSpacing: '0.25em', marginTop: '1px', lineHeight: '1' }}>I N F R A</span>
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
                className={`nav-link px-3 fw-semibold ${location.pathname === '/' ? 'text-primary border-bottom border-primary border-2' : 'text-secondary'}`} 
                to="/"
                style={{ transition: 'color 0.2s', paddingBottom: location.pathname === '/' ? '8px' : '6px' }}
              >
                Dashboard
              </Link>
            </li>
            {!isAdmin && (
              <li className="nav-item">
                <Link 
                  className={`nav-link px-3 fw-semibold ${location.pathname.startsWith('/quotations') && !location.pathname.includes('customer') ? 'text-primary border-bottom border-primary border-2' : 'text-secondary'}`} 
                  to="/quotations"
                  style={{ transition: 'color 0.2s', paddingBottom: location.pathname.startsWith('/quotations') && !location.pathname.includes('customer') ? '8px' : '6px' }}
                >
                  Quotations
                </Link>
              </li>
            )}
            <li className="nav-item">
              <Link 
                className={`nav-link px-3 fw-semibold ${location.pathname.includes('customer-details') ? 'text-primary border-bottom border-primary border-2' : 'text-secondary'}`} 
                to="/customer-details"
                style={{ transition: 'color 0.2s', paddingBottom: location.pathname.includes('customer-details') ? '8px' : '6px' }}
              >
                Customers
              </Link>
            </li>
            {isAdmin && (
              <li className="nav-item">
                <Link 
                  className={`nav-link px-3 fw-semibold ${location.pathname.startsWith('/admin') ? 'text-primary border-bottom border-primary border-2' : 'text-secondary'}`} 
                  to="/admin"
                  style={{ transition: 'color 0.2s', paddingBottom: location.pathname.startsWith('/admin') ? '8px' : '6px' }}
                >
                  Admin Panel
                </Link>
              </li>
            )}
            <li className="nav-item">
              <Link 
                className={`nav-link px-3 fw-semibold ${location.pathname === '/profile' ? 'text-primary border-bottom border-primary border-2' : 'text-secondary'}`} 
                to="/profile"
                style={{ transition: 'color 0.2s', paddingBottom: location.pathname === '/profile' ? '8px' : '6px' }}
              >
                Profile
              </Link>
            </li>
          </ul>

          <div className="d-flex align-items-center justify-content-center gap-3 mt-3 mt-lg-0">
            {/* Current Date Display */}
            <div className="dropdown">
              <button className="btn btn-light btn-sm rounded-pill px-3 py-2 border d-flex align-items-center text-secondary font-monospace" style={{ fontSize: '13px' }}>
                {currentDate} <i className="fas fa-chevron-down ms-2 small"></i>
              </button>
            </div>

            {/* Notification Bell */}
            <button className="btn btn-light btn-sm rounded-circle p-2 border position-relative" style={{ width: '38px', height: '38px' }} onClick={() => alert('No new notifications.')}>
              <i className="far fa-bell text-secondary fs-6"></i>
              <span className="position-absolute top-2 start-2 translate-middle p-1 bg-danger border border-light rounded-circle"></span>
            </button>

            {/* Settings Icon */}
            <button className="btn btn-light btn-sm rounded-circle p-2 border" style={{ width: '38px', height: '38px' }} onClick={() => alert('Settings menu is under development.')}>
              <i className="fas fa-cog text-secondary fs-6"></i>
            </button>

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
                  src={`https://ui-avatars.com/api/?name=${userName}&background=2563eb&color=fff&rounded=true&size=32`} 
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

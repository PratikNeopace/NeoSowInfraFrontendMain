import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = localStorage.getItem('userEmail');
  const roles = JSON.parse(localStorage.getItem('userRoles') || '[]');
  const isAdmin = roles.includes('ROLE_ADMIN') || roles.includes('ROLE_SUPER_ADMIN');

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.clear();
      navigate('/login');
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm py-2">
      <div className="container-fluid px-4">
        <Link className="navbar-brand text-primary fw-bold fs-4" to="/">🏠 Portal</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item">
              <Link 
                className={`nav-link fw-semibold px-3 ${location.pathname === '/' ? 'text-primary' : 'text-dark'}`} 
                to="/"
              >
                Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`nav-link fw-semibold px-3 ${location.pathname.startsWith('/quotations') ? 'text-primary' : 'text-dark'}`} 
                to="/quotations"
              >
                Quotations
              </Link>
            </li>
            {isAdmin && (
              <li className="nav-item">
                <Link 
                  className={`nav-link fw-semibold px-3 ${location.pathname.startsWith('/admin') ? 'text-primary' : 'text-dark'}`} 
                  to="/admin"
                >
                  Admin Panel
                </Link>
              </li>
            )}
            <li className="nav-item ms-3">
              <button className="btn btn-primary btn-sm px-4 logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

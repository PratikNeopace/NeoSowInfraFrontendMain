import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../services/api';

export default function Home() {
  const email = localStorage.getItem('userEmail') || 'User';
  const loginTime = localStorage.getItem('loginTime') || '-';
  const userName = email.split('@')[0];
  const roles = JSON.parse(localStorage.getItem('userRoles') || '[]');

  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const isSuperAdmin = roles.includes('ROLE_SUPER_ADMIN');
  const isAdmin = roles.includes('ROLE_ADMIN');
  const isUser = roles.includes('ROLE_USER') || (!isSuperAdmin && !isAdmin);

  let highestRole = 'USER';
  if (isSuperAdmin) {
    highestRole = 'SUPER_ADMIN';
  } else if (isAdmin) {
    highestRole = 'ADMIN';
  }

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoadingStats(true);
      try {
        let endpoint = '/dashboard/user';
        if (highestRole === 'SUPER_ADMIN') {
          endpoint = '/dashboard/super-admin';
        } else if (highestRole === 'ADMIN') {
          endpoint = '/dashboard/admin';
        }
        const res = await API.get(endpoint);
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchDashboardStats();
  }, [highestRole]);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <Navbar />

      <div className="container py-5">
        {/* Welcome Card */}
        <div className="card border-0 shadow-lg p-4 mb-4" style={{ borderRadius: '12px' }}>
          <div className="card-body">
            <h1 className="fw-bold text-primary mb-3">
              Welcome, {userName.charAt(0).toUpperCase() + userName.slice(1)}!
            </h1>
            <p className="text-secondary mb-4">
              You have successfully logged in. This is your personal dashboard where you can manage estimations,
              view customer records, and review statistics in real-time.
            </p>
            <div className="p-3 border-start border-primary border-4 bg-light rounded">
              <p className="mb-2 text-dark"><span className="fw-bold text-primary">Email:</span> {email}</p>
              <p className="mb-2 text-dark"><span className="fw-bold text-primary">Login Time:</span> {loginTime}</p>
              <p className="mb-0 text-dark">
                <span className="fw-bold text-primary">Role:</span>{' '}
                <span className="badge bg-info text-capitalize me-2">
                  {highestRole.toLowerCase().replace('_', ' ')}
                </span>
                <span className="badge bg-success">Active Session</span>
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Analytics Block */}
        <div className="mb-4">
          <h3 className="text-white fw-bold mb-3"><i className="fas fa-chart-line me-2"></i> Dashboard Analytics</h3>
          {loadingStats ? (
            <div className="text-center py-4 text-white">
              <span className="spinner-border" role="status"></span>
              <p className="mt-2 small">Loading dashboard statistics...</p>
            </div>
          ) : stats ? (
            <div className="row g-3">
              {highestRole === 'SUPER_ADMIN' && (
                <>
                  <div className="col-md-4 col-sm-6">
                    <div className="card border-0 shadow-sm p-3 text-center" style={{ borderRadius: '10px' }}>
                      <div className="fs-1 text-primary">💼</div>
                      <h5 className="fw-bold text-secondary mt-2">Total Admins</h5>
                      <p className="fs-3 fw-bold text-dark mb-0">{stats.totalAdmins}</p>
                    </div>
                  </div>
                  <div className="col-md-4 col-sm-6">
                    <div className="card border-0 shadow-sm p-3 text-center" style={{ borderRadius: '10px' }}>
                      <div className="fs-1 text-info">👥</div>
                      <h5 className="fw-bold text-secondary mt-2">Total Users</h5>
                      <p className="fs-3 fw-bold text-dark mb-0">{stats.totalUsers}</p>
                    </div>
                  </div>
                  <div className="col-md-4 col-sm-6">
                    <div className="card border-0 shadow-sm p-3 text-center" style={{ borderRadius: '10px' }}>
                      <div className="fs-1 text-warning">⚠️</div>
                      <h5 className="fw-bold text-secondary mt-2">Pending Approvals</h5>
                      <p className="fs-3 fw-bold text-danger mb-0">{stats.totalPendingApprovals}</p>
                    </div>
                  </div>
                </>
              )}

              {(highestRole === 'ADMIN' || highestRole === 'SUPER_ADMIN') && (
                <div className="col-md-4 col-sm-6">
                  <div className="card border-0 shadow-sm p-3 text-center" style={{ borderRadius: '10px' }}>
                    <div className="fs-1 text-primary">👥</div>
                    <h5 className="fw-bold text-secondary mt-2">Total Customers</h5>
                    <p className="fs-3 fw-bold text-dark mb-0">{stats.totalCustomers}</p>
                  </div>
                </div>
              )}

              {highestRole === 'USER' && (
                <div className="col-md-4 col-sm-6">
                  <div className="card border-0 shadow-sm p-3 text-center" style={{ borderRadius: '10px' }}>
                    <div className="fs-1 text-primary">👥</div>
                    <h5 className="fw-bold text-secondary mt-2">My Customers</h5>
                    <p className="fs-3 fw-bold text-dark mb-0">{stats.totalCustomers}</p>
                  </div>
                </div>
              )}

              {highestRole === 'USER' ? (
                <div className="col-md-4 col-sm-6">
                  <div className="card border-0 shadow-sm p-3 text-center" style={{ borderRadius: '10px' }}>
                    <div className="fs-1 text-warning">📄</div>
                    <h5 className="fw-bold text-secondary mt-2">My Quotations</h5>
                    <p className="fs-3 fw-bold text-dark mb-0">{stats.totalQuotations}</p>
                  </div>
                </div>
              ) : (
                <div className="col-md-4 col-sm-6">
                  <div className="card border-0 shadow-sm p-3 text-center" style={{ borderRadius: '10px' }}>
                    <div className="fs-1 text-warning">📄</div>
                    <h5 className="fw-bold text-secondary mt-2">Total Quotations</h5>
                    <p className="fs-3 fw-bold text-dark mb-0">{stats.totalQuotations}</p>
                  </div>
                </div>
              )}

              {highestRole === 'ADMIN' && (
                <div className="col-md-4 col-sm-6">
                  <div className="card border-0 shadow-sm p-3 text-center" style={{ borderRadius: '10px' }}>
                    <div className="fs-1 text-info">🔒</div>
                    <h5 className="fw-bold text-secondary mt-2">My Users</h5>
                    <p className="fs-3 fw-bold text-dark mb-0">{stats.totalUsers}</p>
                  </div>
                </div>
              )}

              <div className="col-md-4 col-sm-6">
                <div className="card border-0 shadow-sm p-3 text-center" style={{ borderRadius: '10px' }}>
                  <div className="fs-1 text-success">💰</div>
                  <h5 className="fw-bold text-secondary mt-2">Total Revenue</h5>
                  <p className="fs-3 fw-bold text-dark mb-0">₹{stats.totalQuotationAmount ? stats.totalQuotationAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="alert alert-warning text-center small">No stats available.</div>
          )}
        </div>

        {/* Feature Grid */}
        <div className="row g-4 mt-2">
          {/* Create Quotation Card */}
          <div className="col-md-4">
            <Link to="/quotations" className="text-decoration-none">
              <div className="card border-0 shadow p-4 text-center h-100 feature-card bg-white" style={{ borderRadius: '10px', transition: 'all 0.3s ease' }}>
                <div className="fs-1 mb-2">📄</div>
                <h4 className="fw-bold text-primary">Quotation Portal</h4>
                <p className="text-secondary small mb-0">Start a new quotation or manage saved estimations.</p>
              </div>
            </Link>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow p-4 text-center h-100 bg-white" style={{ borderRadius: '10px' }}>
              <div className="fs-1 mb-2">🔒</div>
              <h4 className="fw-bold text-primary">Security Settings</h4>
              <p className="text-secondary small mb-0">Manage password configurations and review access history.</p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow p-4 text-center h-100 bg-white" style={{ borderRadius: '10px' }}>
              <div className="fs-1 mb-2">📊</div>
              <h4 className="fw-bold text-primary">User Analytics</h4>
              <p className="text-secondary small mb-0">Inspect personal stats and check active quotas.</p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow p-4 text-center h-100 bg-white" style={{ borderRadius: '10px' }}>
              <div className="fs-1 mb-2">⚙️</div>
              <h4 className="fw-bold text-primary">Preferences</h4>
              <p className="text-secondary small mb-0">Configure language, UI theme modes, and units defaults.</p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow p-4 text-center h-100 bg-white" style={{ borderRadius: '10px' }}>
              <div className="fs-1 mb-2">💬</div>
              <h4 className="fw-bold text-primary">Help &amp; Support</h4>
              <p className="text-secondary small mb-0">Read FAQs or open support tickets with administrators.</p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow p-4 text-center h-100 bg-white" style={{ borderRadius: '10px' }}>
              <div className="fs-1 mb-2">🔔</div>
              <h4 className="fw-bold text-primary">Notifications</h4>
              <p className="text-secondary small mb-0">Stay updated on recent approvals and updates.</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center py-4 text-white-50 mt-5">
        <p className="mb-0">&copy; 2026 User Portal. All rights reserved.</p>
      </footer>
    </div>
  );
}

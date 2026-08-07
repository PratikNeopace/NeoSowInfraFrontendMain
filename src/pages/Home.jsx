import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../services/api';

export default function Home() {
  const navigate = useNavigate();
  const email = localStorage.getItem('userEmail') || 'User';
  const loginTime = localStorage.getItem('loginTime') || '-';
  const userName = email.split('@')[0];
  const formattedUserName = userName.charAt(0).toUpperCase() + userName.slice(1);
  const roles = JSON.parse(localStorage.getItem('userRoles') || '[]');

  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [recentQuotes, setRecentQuotes] = useState([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);

  const isSuperAdmin = roles.includes('ROLE_SUPER_ADMIN');
  const isAdmin = roles.includes('ROLE_ADMIN');
  const isUser = roles.includes('ROLE_USER') || (!isSuperAdmin && !isAdmin);

  let highestRole = 'USER';
  if (isSuperAdmin) {
    highestRole = 'SUPER_ADMIN';
  } else if (isAdmin) {
    highestRole = 'ADMIN';
  }

  // Determine Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

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

  // Load Recent Quotations for all roles
  useEffect(() => {
    const fetchRecentQuotations = async () => {
      setLoadingQuotes(true);
      try {
        const custRes = await API.get('/customers', {
          params: { page: 0, size: 20 }
        });
        const customersList = custRes.data.content || [];
        
        let allQuotes = [];
        for (const cust of customersList) {
          try {
            const quoteRes = await API.get(`/quotations/customer/${cust.id}`, {
              params: { page: 0, size: 10 }
            });
            const quotesList = quoteRes.data.content || [];
            const quotesWithCustomer = quotesList.map(q => ({
              ...q,
              customerId: cust.id,
              customerName: cust.name,
              projectUnit: q.projectUnit || cust.project?.workType || 'Architectural Design'
            }));
            allQuotes.push(...quotesWithCustomer);
          } catch (err) {
            console.error(`Failed to fetch quotations for customer ${cust.id}`, err);
          }
        }
        
        // Sort by date descending
        allQuotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRecentQuotes(allQuotes);
      } catch (err) {
        console.error("Failed to load recent quotations", err);
      } finally {
        setLoadingQuotes(false);
      }
    };
    fetchRecentQuotations();
  }, []);

  const handleDeleteQuotation = async (customerId, quoteId) => {
    if (window.confirm('Are you sure you want to delete this quotation estimation sheet?')) {
      try {
        await API.delete(`/quotations/${quoteId}`);
        alert('Quotation deleted successfully.');
        setRecentQuotes(prev => prev.filter(q => q.id !== quoteId));
        // Refresh stats
        const res = await API.get('/dashboard/user');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to delete quotation', err);
      }
    }
  };

  // Fallback/Mock data if actual database has no entries yet
  const displayQuotes = recentQuotes.length > 0 ? recentQuotes.slice(0, 4) : [
    { id: 'QT-2401', projectUnit: 'Skyline Penthouse', customerName: 'Rohan Mehra', totalAmount: 124500, status: 'SENT' },
    { id: 'QT-2398', projectUnit: 'Modern Villa A2', customerName: 'Sara Khan', totalAmount: 89200, status: 'APPROVED' },
    { id: 'QT-2395', projectUnit: 'Office Fit-out', customerName: 'TechCorp Inc.', totalAmount: 89200, status: 'DRAFT' },
    { id: 'QT-2394', projectUnit: 'Office Fit-out', customerName: 'TechCorp Inc.', totalAmount: 89200, status: 'DRAFT' },
  ];

  const getStatusBadge = (status) => {
    const s = (status || 'DRAFT').toUpperCase();
    if (s === 'APPROVED') {
      return <span className="badge rounded-pill bg-success-subtle text-success px-3 py-1 fw-bold" style={{ fontSize: '11px' }}>Approved</span>;
    } else if (s === 'SENT' || s === 'ONGOING') {
      return <span className="badge rounded-pill bg-primary-subtle text-primary px-3 py-1 fw-bold" style={{ fontSize: '11px' }}>Sent</span>;
    }
    return <span className="badge rounded-pill bg-secondary-subtle text-secondary px-3 py-1 fw-bold" style={{ fontSize: '11px' }}>Draft</span>;
  };



  // Premium, Architectural Pipeline Dashboard View for Regular User
  return (
    <div style={{
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    }}>
      <Navbar />

      <div className="container-fluid py-4 px-lg-5 px-3">
        {/* Header Block */}
        <div className="row align-items-center mb-4">
          <div className="col-md-6 mb-3 mb-md-0">
            <h1 className="fw-bold text-dark mb-1" style={{ letterSpacing: '-0.02em', fontSize: '32px' }}>
              {getGreeting()}, {formattedUserName}
            </h1>
            <p className="text-secondary mb-0" style={{ fontSize: '15px' }}>
              Overview of your architectural pipeline today.
            </p>
          </div>
          <div className="col-md-6 text-md-end d-flex gap-2 justify-content-md-end align-items-center">
            <button 
              className="btn btn-outline-secondary btn-sm px-3 py-2 fw-semibold d-flex align-items-center gap-2 border bg-white text-dark"
              style={{ borderRadius: '8px', fontSize: '14px' }}
              onClick={() => alert('Import configuration feature is under development.')}
            >
              <i className="fas fa-file-import text-muted"></i> Import
            </button>
            
            <Link 
              to="/customer-details" 
              className="btn btn-primary btn-sm px-4 py-2 fw-semibold d-flex align-items-center gap-2"
              style={{ borderRadius: '8px', fontSize: '14px', backgroundColor: '#2563eb', border: 'none' }}
            >
              <i className="fas fa-plus"></i> New Quotation
            </Link>

            <button 
              className="btn btn-light btn-sm p-2 border" 
              style={{ borderRadius: '8px', width: '38px', height: '38px' }}
              onClick={() => alert('Quick Actions is under development.')}
            >
              <i className="fas fa-ellipsis-h text-secondary"></i>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="row g-3 mb-4">
          {/* Total Quotations */}
          <div className="col-lg-3 col-sm-6">
            <div className="card border-0 shadow-sm p-3 bg-white" style={{ borderRadius: '12px' }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-secondary fw-bold text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>Total Quotations</span>
              </div>
              <div className="d-flex align-items-baseline gap-2">
                <span className="fs-3 fw-bold text-dark">{stats?.totalQuotations || 2}</span>
                <span className="badge rounded-pill bg-primary-subtle text-primary py-1 px-2" style={{ fontSize: '10px' }}>+12%</span>
              </div>
            </div>
          </div>

          {/* Approved */}
          <div className="col-lg-3 col-sm-6">
            <div className="card border-0 shadow-sm p-3 bg-white" style={{ borderRadius: '12px' }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-secondary fw-bold text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>Approved</span>
              </div>
              <div className="d-flex align-items-baseline gap-2">
                <span className="fs-3 fw-bold text-dark">
                  {stats?.totalQuotations ? Math.max(1, Math.round(stats.totalQuotations * 0.5)) : 1}
                </span>
                <span className="badge rounded-pill bg-success-subtle text-success py-1 px-2" style={{ fontSize: '10px' }}>85% rate</span>
              </div>
            </div>
          </div>

          {/* Est. Revenue */}
          <div className="col-lg-3 col-sm-6">
            <div className="card border-0 shadow-sm p-3 bg-white" style={{ borderRadius: '12px' }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-secondary fw-bold text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>Est. Revenue</span>
              </div>
              <div className="d-flex align-items-baseline gap-2">
                <span className="fs-3 fw-bold text-dark">
                  ₹{stats?.totalQuotationAmount ? stats.totalQuotationAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '8,929.71'}
                </span>
                <span className="badge rounded-pill bg-primary-subtle text-primary py-1 px-2" style={{ fontSize: '10px' }}>+$42k</span>
              </div>
            </div>
          </div>

          {/* Active Clients */}
          <div className="col-lg-3 col-sm-6">
            <div className="card border-0 shadow-sm p-3 bg-white" style={{ borderRadius: '12px' }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-secondary fw-bold text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>Active Clients</span>
              </div>
              <div className="d-flex align-items-baseline gap-2">
                <span className="fs-3 fw-bold text-dark">{stats?.totalCustomers || 1}</span>
                <span className="badge rounded-pill bg-primary-subtle text-primary py-1 px-2" style={{ fontSize: '10px' }}>+2 new</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Middle Grid */}
        <div className="row g-4 mb-4">
          {/* Recent Quotations Table */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm p-4 bg-white h-100" style={{ borderRadius: '12px' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold text-dark mb-0" style={{ fontSize: '18px' }}>Recent Quotations</h4>
                <Link to="/quotations" className="text-decoration-none fw-semibold" style={{ fontSize: '13px', color: '#2563eb' }}>View all</Link>
              </div>

              {loadingQuotes ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status"></div>
                  <p className="mt-2 text-muted small">Loading quotations...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-borderless align-middle mb-0">
                    <thead>
                      <tr className="border-bottom" style={{ borderColor: '#f1f5f9' }}>
                        <th className="text-secondary fw-bold text-uppercase ps-0" style={{ fontSize: '11px', paddingBottom: '12px' }}>Project</th>
                        <th className="text-secondary fw-bold text-uppercase" style={{ fontSize: '11px', paddingBottom: '12px' }}>Client</th>
                        <th className="text-secondary fw-bold text-uppercase text-end" style={{ fontSize: '11px', paddingBottom: '12px' }}>Amount</th>
                        <th className="text-secondary fw-bold text-uppercase text-center" style={{ fontSize: '11px', paddingBottom: '12px', width: '120px' }}>Status</th>
                        <th className="text-secondary fw-bold text-uppercase text-end pe-0" style={{ fontSize: '11px', paddingBottom: '12px', width: '100px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayQuotes.map((q, idx) => (
                        <tr key={q.id || idx} className="border-bottom" style={{ borderColor: '#f8fafc' }}>
                          <td className="ps-0 py-3">
                            <span className="fw-bold text-dark d-block" style={{ fontSize: '14px' }}>{q.projectUnit}</span>
                            <span className="text-secondary font-monospace" style={{ fontSize: '11px' }}>#{q.id || `QT-00${idx}`}</span>
                          </td>
                          <td className="py-3 text-secondary" style={{ fontSize: '14px' }}>{q.customerName}</td>
                          <td className="py-3 text-end fw-bold text-dark" style={{ fontSize: '14px' }}>
                            ₹{q.totalAmount ? q.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : q.subtotal ? q.subtotal.toLocaleString() : '89,200'}
                          </td>
                          <td className="py-3 text-center">{getStatusBadge(q.status)}</td>
                          <td className="py-3 text-end pe-0">
                            <div className="d-flex justify-content-end gap-2">
                              <button 
                                className="btn btn-link p-1 text-secondary" 
                                style={{ fontSize: '14px' }}
                                onClick={() => navigate(q.id ? `/quotation/${q.id}` : '#')}
                              >
                                <i className="far fa-eye"></i>
                              </button>
                              <button 
                                className="btn btn-link p-1 text-secondary" 
                                style={{ fontSize: '14px' }}
                                onClick={() => navigate(q.customerId ? `/customer/${q.customerId}/create-quotation?reviseId=${q.id}` : '#')}
                              >
                                <i className="far fa-edit"></i>
                              </button>
                              <button 
                                className="btn btn-link p-1 text-danger" 
                                style={{ fontSize: '14px' }}
                                onClick={() => handleDeleteQuotation(q.customerId, q.id)}
                              >
                                <i className="far fa-trash-alt"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Today's Focus Section */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm p-4 bg-white h-100" style={{ borderRadius: '12px' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold text-dark mb-0" style={{ fontSize: '18px' }}>Today's Focus</h4>
                <button className="btn btn-link p-0 text-primary" style={{ fontSize: '16px' }} onClick={() => alert('Focus item creation is under development.')}>
                  <i className="far fa-plus-square"></i>
                </button>
              </div>

              <div className="d-flex flex-column gap-3 mb-4 mt-2">
                {[
                  { title: 'Follow up: Patel Residence', sub: 'Review tile feedback', color: '#2563eb' },
                  { title: 'Prepare BOQ: Villa Project', sub: 'Due by 5:00 PM', color: '#3b82f6' },
                  { title: 'Site Visit: Lofts', sub: 'Today at 3:00 PM', color: '#f59e0b' }
                ].map((item, index) => (
                  <div key={index} className="d-flex gap-3 align-items-start">
                    <span className="p-1 rounded-circle mt-2" style={{ backgroundColor: item.color, width: '8px', height: '8px' }}></span>
                    <div>
                      <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '14px' }}>{item.title}</h6>
                      <p className="text-secondary mb-0" style={{ fontSize: '12px' }}>{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                className="btn btn-primary-subtle text-primary fw-bold w-100 py-2 border-0 mt-auto" 
                style={{ borderRadius: '8px', fontSize: '13px', backgroundColor: '#eff6ff' }}
                onClick={() => alert('Calendar view is under development.')}
              >
                Open Calendar
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Block Grid */}
        <div className="row g-4">
          {/* Revenue Trend Visual Bar Chart */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: '12px' }}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold text-dark mb-0" style={{ fontSize: '18px' }}>Revenue Trend</h4>
                <button className="btn btn-light btn-sm rounded border px-3 text-secondary font-monospace" style={{ fontSize: '12px' }}>
                  Last 6 Months <i className="fas fa-chevron-down ms-2 small"></i>
                </button>
              </div>

              <div className="d-flex align-items-end justify-content-between px-2" style={{ height: '180px' }}>
                {[
                  { month: 'JAN', height: '40%' },
                  { month: 'FEB', height: '60%' },
                  { month: 'MAR', height: '95%', active: true },
                  { month: 'APR', height: '65%' },
                  { month: 'MAY', height: '80%' },
                  { month: 'JUN', height: '50%' }
                ].map((bar, i) => (
                  <div key={i} className="d-flex flex-column align-items-center flex-grow-1" style={{ height: '100%' }}>
                    <div className="w-50 rounded-top" style={{ 
                      height: bar.height, 
                      backgroundColor: bar.active ? '#2563eb' : '#dbeafe', 
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }} title={`${bar.month}: ${bar.height}`} />
                    <span className="text-secondary font-monospace mt-2" style={{ fontSize: '10px', fontWeight: 'bold' }}>{bar.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Tools Grid */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: '12px' }}>
              <h4 className="fw-bold text-dark mb-4" style={{ fontSize: '18px' }}>Quick Tools</h4>
              
              <div className="row g-3">
                {[
                  { name: 'New Customer', icon: 'fa-user-plus', path: '/customer-details' },
                  { name: 'Add Project', icon: 'fa-project-diagram', path: '/customer-details' },
                  { name: 'Gen. BOQ', icon: 'fa-file-invoice-dollar', path: '/quotations' },
                  { name: 'Drawings', icon: 'fa-pencil-ruler', path: '/' },
                  { name: 'Reports', icon: 'fa-chart-bar', path: '/' },
                  { name: 'Customize', icon: 'fa-sliders-h', path: '/' }
                ].map((tool, idx) => (
                  <div key={idx} className="col-4">
                    <button 
                      onClick={() => navigate(tool.path)}
                      className="btn btn-outline-light border-0 shadow-sm bg-white p-3 text-center w-100 h-100 d-flex flex-column align-items-center justify-content-center hover-tool" 
                      style={{ borderRadius: '12px', transition: 'all 0.2s', minHeight: '90px' }}
                    >
                      <i className={`fas ${tool.icon} text-primary mb-2`} style={{ fontSize: '18px' }}></i>
                      <span className="text-secondary fw-semibold d-block text-nowrap" style={{ fontSize: '12px' }}>{tool.name}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center py-4 text-muted mt-5">
        <p className="mb-0" style={{ fontSize: '12px' }}>&copy; 2026 User Portal. All rights reserved.</p>
      </footer>

      {/* Inline styles for custom premium hover micro-animations */}
      <style>{`
        .hover-tool:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 15px rgba(0, 0, 0, 0.08) !important;
          background-color: #fafbfc !important;
        }
      `}</style>
    </div>
  );
}

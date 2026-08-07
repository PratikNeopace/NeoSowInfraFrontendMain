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

  // Today's Focus states
  const [focusItems, setFocusItems] = useState([
    { title: 'Follow up: Patel Residence', sub: 'Review tile feedback', color: '#2563eb' },
    { title: 'Prepare BOQ: Villa Project', sub: 'Due by 5:00 PM', color: '#3b82f6' },
    { title: 'Site Visit: Lofts', sub: 'Today at 3:00 PM', color: '#f59e0b' }
  ]);
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [newFocusTitle, setNewFocusTitle] = useState('');
  const [newFocusSub, setNewFocusSub] = useState('');
  const [newFocusColor, setNewFocusColor] = useState('#2563eb');

  const handleAddFocusItem = (e) => {
    e.preventDefault();
    if (!newFocusTitle.trim()) return;
    setFocusItems(prev => [
      ...prev,
      {
        title: newFocusTitle.trim(),
        sub: newFocusSub.trim() || 'No details provided',
        color: newFocusColor
      }
    ]);
    setNewFocusTitle('');
    setNewFocusSub('');
    setNewFocusColor('#2563eb');
    setShowFocusModal(false);
  };

  // Calendar states
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date(2026, 7, 7)); // Default: Aug 7, 2026
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date(2026, 7, 7));

  const isSameDay = (date1, date2) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const handlePrevMonth = () => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const generateCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthTotalDays - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthTotalDays - i)
      });
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i)
      });
    }
    const totalCells = 42;
    const nextMonthDaysNeeded = totalCells - days.length;
    for (let i = 1; i <= nextMonthDaysNeeded; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i)
      });
    }
    return days;
  };

  const getFocusItemsForDay = (date) => {
    if (isSameDay(date, new Date(2026, 7, 7))) {
      return focusItems;
    }
    return [];
  };

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
  const displayQuotes = recentQuotes.slice(0, 4);

  const getStatusBadge = (status) => {
    const s = (status || 'DRAFT').toUpperCase();
    if (s === 'APPROVED') {
      return <span className="badge rounded-pill bg-success-subtle text-success px-3 py-1 fw-bold" style={{ fontSize: '11px' }}>Approved</span>;
    } else if (s === 'SENT' || s === 'ONGOING') {
      return <span className="badge rounded-pill bg-primary-subtle text-primary px-3 py-1 fw-bold" style={{ fontSize: '11px' }}>Sent</span>;
    }
    return <span className="badge rounded-pill bg-secondary-subtle text-secondary px-3 py-1 fw-bold" style={{ fontSize: '11px' }}>Draft</span>;
  };



  // Get dynamic revenue trend for the last 6 months
  const getMonthlyRevenueData = () => {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const result = [];
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      result.push({
        monthName: months[d.getMonth()],
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        revenue: 0
      });
    }

    recentQuotes.forEach(q => {
      if (!q.createdAt) return;
      const qDate = new Date(q.createdAt);
      const qMonth = qDate.getMonth();
      const qYear = qDate.getFullYear();
      const amount = q.totalAmount || q.subtotal || 0;

      const match = result.find(r => r.monthIndex === qMonth && r.year === qYear);
      if (match) {
        match.revenue += amount;
      }
    });

    const maxRevenue = Math.max(...result.map(r => r.revenue), 1);

    return result.map((r, i) => {
      const percentage = r.revenue > 0 ? Math.round((r.revenue / maxRevenue) * 85) + 10 : 5;
      return {
        month: r.monthName,
        revenue: r.revenue,
        height: `${percentage}%`,
        active: i === 5
      };
    });
  };

  const revenueTrend = getMonthlyRevenueData();
  const totalTrendRevenue = revenueTrend.reduce((sum, item) => sum + item.revenue, 0);

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
          <div className="col-lg-4 col-md-6">
            <div className="card border-0 shadow-sm p-3 bg-white" style={{ borderRadius: '12px' }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-secondary fw-bold text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>Total Quotations</span>
              </div>
              <div className="d-flex align-items-baseline gap-2">
                <span className="fs-3 fw-bold text-dark">{stats?.totalQuotations ?? 0}</span>
                <span className="badge rounded-pill bg-primary-subtle text-primary py-1 px-2" style={{ fontSize: '10px' }}>+12%</span>
              </div>
            </div>
          </div>

          {/* Total Customers */}
          <div className="col-lg-4 col-md-6">
            <div className="card border-0 shadow-sm p-3 bg-white" style={{ borderRadius: '12px' }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-secondary fw-bold text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>Total Customers</span>
              </div>
              <div className="d-flex align-items-baseline gap-2">
                <span className="fs-3 fw-bold text-dark">{stats?.totalCustomers ?? 0}</span>
                <span className="badge rounded-pill bg-primary-subtle text-primary py-1 px-2" style={{ fontSize: '10px' }}>+2 new</span>
              </div>
            </div>
          </div>

          {/* Est. Revenue */}
          <div className="col-lg-4 col-md-12">
            <div className="card border-0 shadow-sm p-3 bg-white" style={{ borderRadius: '12px' }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-secondary fw-bold text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>Est. Revenue</span>
              </div>
              <div className="d-flex align-items-baseline gap-2">
                <span className="fs-3 fw-bold text-dark">
                  ₹{stats?.totalQuotationAmount ? stats.totalQuotationAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                </span>
                <span className="badge rounded-pill bg-primary-subtle text-primary py-1 px-2" style={{ fontSize: '10px' }}>+$42k</span>
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
              ) : displayQuotes.length === 0 ? (
                <div className="text-center py-5 text-secondary">
                  <i className="far fa-folder-open mb-2" style={{ fontSize: '24px' }}></i>
                  <p className="mb-0" style={{ fontSize: '14px' }}>No recent quotations found.</p>
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
                <button className="btn btn-link p-0 text-primary" style={{ fontSize: '16px' }} onClick={() => setShowFocusModal(true)}>
                  <i className="far fa-plus-square"></i>
                </button>
              </div>

              <div className="d-flex flex-column gap-3 mb-4 mt-2">
                {focusItems.map((item, index) => (
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
                onClick={() => setShowCalendarModal(true)}
              >
                Open Calendar
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Block Grid */}
        <div className="row g-4">
          {/* Revenue Trend Visual Bar Chart */}
          <div className="col-12">
            <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: '12px' }}>
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <h4 className="fw-bold text-dark mb-0" style={{ fontSize: '18px' }}>Revenue Trend</h4>
                  <small className="text-muted" style={{ fontSize: '12px' }}>
                    Total: ₹{totalTrendRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (last 6 months)
                  </small>
                </div>
                <button className="btn btn-light btn-sm rounded border px-3 text-secondary font-monospace" style={{ fontSize: '12px' }}>
                  Last 6 Months <i className="fas fa-chevron-down ms-2 small"></i>
                </button>
              </div>

              <div className="mx-auto w-100" style={{ maxWidth: '640px' }}>
                <div className="d-flex align-items-end justify-content-between px-2" style={{ height: '180px', position: 'relative' }}>
                  {/* Subtle Grid Lines */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 25, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
                    <div style={{ borderBottom: '1px dashed #e2e8f0', width: '100%', height: 0 }} />
                    <div style={{ borderBottom: '1px dashed #e2e8f0', width: '100%', height: 0 }} />
                    <div style={{ borderBottom: '1px dashed #e2e8f0', width: '100%', height: 0 }} />
                    <div style={{ borderBottom: '1px dashed #e2e8f0', width: '100%', height: 0 }} />
                  </div>

                  {revenueTrend.map((bar, i) => (
                    <div key={i} className="d-flex flex-column align-items-center justify-content-end" style={{ height: '100%', zIndex: 1, width: '60px' }}>
                      <div className="rounded-top" style={{ 
                        height: bar.height, 
                        width: '28px',
                        backgroundColor: bar.active ? '#2563eb' : '#dbeafe', 
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }} title={`${bar.month}: ₹${bar.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                      <span className="text-secondary font-monospace mt-2" style={{ fontSize: '10px', fontWeight: 'bold' }}>{bar.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showFocusModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050
        }}>
          <div className="card border-0 shadow-lg p-4 bg-white" style={{ borderRadius: '16px', width: '90%', maxWidth: '450px' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-dark mb-0" style={{ fontSize: '18px' }}>Add Focus Item</h5>
              <button className="btn-close" onClick={() => setShowFocusModal(false)}></button>
            </div>
            
            <form onSubmit={handleAddFocusItem}>
              <div className="mb-3">
                <label className="form-label fw-semibold text-secondary" style={{ fontSize: '13px' }}>Focus Title</label>
                <input 
                  type="text" 
                  className="form-control" 
                  style={{ borderRadius: '8px', fontSize: '14px', padding: '10px' }} 
                  placeholder="e.g. Site Visit: Lofts" 
                  value={newFocusTitle}
                  onChange={(e) => setNewFocusTitle(e.target.value)}
                  required 
                  autoFocus
                />
              </div>
              
              <div className="mb-3">
                <label className="form-label fw-semibold text-secondary" style={{ fontSize: '13px' }}>Description / Time</label>
                <input 
                  type="text" 
                  className="form-control" 
                  style={{ borderRadius: '8px', fontSize: '14px', padding: '10px' }} 
                  placeholder="e.g. Today at 3:00 PM or Review details" 
                  value={newFocusSub}
                  onChange={(e) => setNewFocusSub(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold text-secondary d-block mb-2" style={{ fontSize: '13px' }}>Category Color</label>
                <div className="d-flex gap-2">
                  {[
                    { value: '#2563eb', name: 'Blue (Task)' },
                    { value: '#3b82f6', name: 'Light Blue (Prep)' },
                    { value: '#f59e0b', name: 'Orange (Site Visit)' },
                    { value: '#10b981', name: 'Green (Completed)' },
                    { value: '#ef4444', name: 'Red (Urgent)' }
                  ].map((colorObj) => (
                    <button
                      key={colorObj.value}
                      type="button"
                      onClick={() => setNewFocusColor(colorObj.value)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: colorObj.value,
                        border: newFocusColor === colorObj.value ? '3px solid #cbd5e1' : 'none',
                        outline: 'none',
                        cursor: 'pointer',
                        transition: 'transform 0.1s'
                      }}
                      title={colorObj.name}
                      className={newFocusColor === colorObj.value ? 'scale-110' : ''}
                    />
                  ))}
                </div>
              </div>

              <div className="d-flex gap-2 justify-content-end">
                <button 
                  type="button" 
                  className="btn btn-light px-3 py-2 fw-semibold" 
                  style={{ borderRadius: '8px', fontSize: '13px' }} 
                  onClick={() => setShowFocusModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary px-4 py-2 fw-semibold" 
                  style={{ borderRadius: '8px', fontSize: '13px', backgroundColor: '#2563eb', border: 'none' }}
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCalendarModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050
        }}>
          <div className="card border-0 shadow-lg p-4 bg-white" style={{ borderRadius: '16px', width: '90%', maxWidth: '480px' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-dark mb-0" style={{ fontSize: '18px' }}>Project Calendar</h5>
              <button className="btn-close" onClick={() => setShowCalendarModal(false)}></button>
            </div>

            {/* Calendar Controls */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <button className="btn btn-sm btn-light rounded border px-2 py-1" onClick={handlePrevMonth}>
                <i className="fas fa-chevron-left text-secondary"></i>
              </button>
              <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '16px' }}>
                {calendarDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </h6>
              <button className="btn btn-sm btn-light rounded border px-2 py-1" onClick={handleNextMonth}>
                <i className="fas fa-chevron-right text-secondary"></i>
              </button>
            </div>

            {/* Weekdays Labels */}
            <div className="row g-0 text-center mb-2" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
                <div key={idx} className="col text-secondary fw-semibold" style={{ fontSize: '12px' }}>{d}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="row g-0 text-center mb-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {generateCalendarDays().map((dayObj, idx) => {
                const isSelected = isSameDay(dayObj.date, selectedCalendarDate);
                const isToday = isSameDay(dayObj.date, new Date(2026, 7, 7)); // Today's date from metadata
                const dayFocusItems = getFocusItemsForDay(dayObj.date);

                return (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedCalendarDate(dayObj.date)}
                    style={{
                      padding: '6px 0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#2563eb' : 'transparent',
                      color: isSelected 
                        ? '#fff' 
                        : dayObj.isCurrentMonth 
                          ? '#1e293b' 
                          : '#cbd5e1',
                      border: isToday && !isSelected ? '1px solid #2563eb' : 'none',
                      transition: 'all 0.15s ease',
                      position: 'relative'
                    }}
                    className="hover-day"
                  >
                    <span style={{ fontSize: '13px', fontWeight: isToday ? 'bold' : 'normal' }}>
                      {dayObj.day}
                    </span>
                    {/* Focus dots */}
                    <div className="d-flex gap-1 justify-content-center mt-1" style={{ height: '4px' }}>
                      {dayFocusItems.map((item, dotIdx) => (
                        <span 
                          key={dotIdx} 
                          className="rounded-circle" 
                          style={{ 
                            backgroundColor: isSelected ? '#fff' : item.color, 
                            width: '4px', 
                            height: '4px' 
                          }} 
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Date Focus Items */}
            <div className="mt-2 pt-3 border-top">
              <h6 className="fw-bold text-dark mb-2" style={{ fontSize: '13px' }}>
                Focus for {selectedCalendarDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </h6>
              {getFocusItemsForDay(selectedCalendarDate).length === 0 ? (
                <p className="text-secondary mb-0 small text-center py-3">No focus items scheduled.</p>
              ) : (
                <div className="d-flex flex-column gap-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  {getFocusItemsForDay(selectedCalendarDate).map((item, itemIdx) => (
                    <div key={itemIdx} className="d-flex gap-2 align-items-center bg-light p-2 rounded" style={{ fontSize: '13px' }}>
                      <span className="rounded-circle" style={{ backgroundColor: item.color, width: '8px', height: '8px', flexShrink: 0 }} />
                      <div>
                        <span className="fw-bold text-dark d-block" style={{ fontSize: '13px' }}>{item.title}</span>
                        <span className="text-muted" style={{ fontSize: '11px' }}>{item.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../services/api';

const formatCreatorName = (email) => {
  if (!email) return 'Unknown';
  if (!email.includes('@')) return email;
  const localPart = email.split('@')[0];
  return localPart
    .split(/[\._-]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const parseToLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  let s = dateStr.toString().trim();
  if (!s.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(s)) {
    s += 'Z';
  }
  return new Date(s);
};

export default function QuotationList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [quotesByCustomer, setQuotesByCustomer] = useState({});
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [filterTab, setFilterTab] = useState('ALL'); // ALL, DRAFT, SENT, APPROVED
  
  // Toggling states for details expansion
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [expandedQuotes, setExpandedQuotes] = useState({});

  const roles = JSON.parse(localStorage.getItem('userRoles') || '[]');
  const isAdmin = roles.includes('ROLE_ADMIN') || roles.includes('ROLE_SUPER_ADMIN');

  const fetchCustomers = async (query = '') => {
    setLoading(true);
    try {
      const res = await API.get('/customers', {
        params: { search: query, page: 0, size: 100 }
      });
      setCustomers(res.data.content || []);
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Fetch quotations for all customers in the background
  useEffect(() => {
    if (customers.length > 0) {
      const loadAllQuotes = async () => {
        setLoadingQuotes(true);
        const quotesData = {};
        for (const cust of customers) {
          try {
            const res = await API.get(`/quotations/customer/${cust.id}`, {
              params: { page: 0, size: 50 }
            });
            quotesData[cust.id] = res.data.content || [];
          } catch (err) {
            console.error('Failed to load quotes for customer: ' + cust.id, err);
          }
        }
        setQuotesByCustomer(quotesData);
        setLoadingQuotes(false);
      };
      loadAllQuotes();
    }
  }, [customers]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    fetchCustomers(e.target.value);
  };

  const handleDeleteCustomer = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete customer "${name}"? This will delete all their project details and quotations.`)) {
      try {
        await API.delete(`/customers/${id}`);
        alert('Customer deleted successfully.');
        fetchCustomers(search);
      } catch (err) {
        console.error('Failed to delete customer', err);
        alert('Error deleting customer. Please verify permissions.');
      }
    }
  };

  const handleDeleteQuotation = async (customerId, quoteId) => {
    if (window.confirm('Are you sure you want to delete this quotation estimation sheet?')) {
      try {
        await API.delete(`/quotations/${quoteId}`);
        alert('Quotation deleted successfully.');
        // Reload quotations for this customer
        const res = await API.get(`/quotations/customer/${customerId}`, {
          params: { page: 0, size: 50 }
        });
        setQuotesByCustomer(prev => ({
          ...prev,
          [customerId]: res.data.content || []
        }));
      } catch (err) {
        console.error('Failed to delete quotation', err);
      }
    }
  };

  const handleDownloadPdf = async (quoteId) => {
    try {
      const response = await API.get(`/quotations/${quoteId}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `quotation_${quoteId}.pdf`;
      link.click();
    } catch (err) {
      console.error('Failed to download PDF', err);
      alert('Error rendering PDF template on server.');
    }
  };

  const handleStatusChange = async (customerId, quoteId, newStatus) => {
    try {
      await API.put(`/quotations/${quoteId}/status`, null, {
        params: { status: newStatus }
      });
      setQuotesByCustomer(prev => {
        const customerQuotes = prev[customerId] || [];
        const updatedQuotes = customerQuotes.map(q => {
          if (q.id === quoteId) {
            return { ...q, status: newStatus };
          }
          return q;
        });
        return {
          ...prev,
          [customerId]: updatedQuotes
        };
      });
    } catch (err) {
      console.error('Failed to update quotation status', err);
    }
  };

  const toggleExpandCustomer = (customerId) => {
    if (expandedCustomer === customerId) {
      setExpandedCustomer(null);
    } else {
      setExpandedCustomer(customerId);
    }
  };

  const toggleExpandQuote = (quoteId) => {
    setExpandedQuotes(prev => ({
      ...prev,
      [quoteId]: !prev[quoteId]
    }));
  };

  // Helper to get derived status of customer
  const getCustomerStatus = (customerId) => {
    const quotes = quotesByCustomer[customerId] || [];
    if (quotes.length === 0) return 'DRAFT';
    const sorted = [...quotes].sort((a, b) => parseToLocalDate(b.createdAt) - parseToLocalDate(a.createdAt));
    return (sorted[0].status || 'DRAFT').toUpperCase();
  };

  // Helper to get derived amount
  const getCustomerAmount = (cust) => {
    const quotes = quotesByCustomer[cust.id] || [];
    if (quotes.length === 0) {
      return cust.project?.budget ? cust.project.budget : 150000;
    }
    const sorted = [...quotes].sort((a, b) => parseToLocalDate(b.createdAt) - parseToLocalDate(a.createdAt));
    return sorted[0].totalAmount || sorted[0].subtotal || 150000;
  };

  // Helper to get derived quote project unit/type
  const getCustomerQuoteType = (cust) => {
    const quotes = quotesByCustomer[cust.id] || [];
    if (quotes.length === 0) {
      return cust.project?.workType || 'Lump Sum Quote';
    }
    const sorted = [...quotes].sort((a, b) => parseToLocalDate(b.createdAt) - parseToLocalDate(a.createdAt));
    return sorted[0].projectUnit || cust.project?.workType || 'Lump Sum Quote';
  };

  const getLatestQuoteId = (customerId) => {
    const quotes = quotesByCustomer[customerId] || [];
    if (quotes.length === 0) return null;
    const sorted = [...quotes].sort((a, b) => parseToLocalDate(b.createdAt) - parseToLocalDate(a.createdAt));
    return sorted[0].id;
  };

  // Filter tab counting
  const draftsCount = customers.filter(c => {
    const status = getCustomerStatus(c.id);
    return status === 'DRAFT' || status === 'ENQUIRY';
  }).length;
  const sentCount = customers.filter(c => {
    const status = getCustomerStatus(c.id);
    return status === 'SENT' || status === 'ONGOING';
  }).length;
  const approvedCount = customers.filter(c => {
    const status = getCustomerStatus(c.id);
    return status === 'APPROVED' || status === 'COMPLETED';
  }).length;

  const filteredCustomers = customers.filter(cust => {
    const status = getCustomerStatus(cust.id);
    if (filterTab === 'DRAFT') return status === 'DRAFT' || status === 'ENQUIRY';
    if (filterTab === 'SENT') return status === 'SENT' || status === 'ONGOING';
    if (filterTab === 'APPROVED') return status === 'APPROVED' || status === 'COMPLETED';
    return true;
  });

  const getStatusBadge = (status) => {
    const s = (status || 'DRAFT').toUpperCase();
    if (s === 'APPROVED' || s === 'COMPLETED') {
      return <span className="badge rounded-pill bg-success-subtle text-success px-3 py-1 fw-bold ms-2" style={{ fontSize: '10px' }}>Approved</span>;
    } else if (s === 'SENT' || s === 'ONGOING') {
      return <span className="badge rounded-pill bg-primary-subtle text-primary px-3 py-1 fw-bold ms-2" style={{ fontSize: '10px' }}>Sent</span>;
    }
    return <span className="badge rounded-pill bg-warning-subtle text-warning px-3 py-1 fw-bold ms-2" style={{ fontSize: '10px' }}>Draft</span>;
  };

  const getStatusSelectStyle = (status) => {
    const norm = (status || 'ENQUIRY').toUpperCase();
    if (norm === 'ONGOING' || norm === 'SENT') {
      return { color: '#0d6efd', backgroundColor: '#eef2ff', borderColor: '#cbd5e1', fontWeight: '600' };
    } else if (norm === 'COMPLETED' || norm === 'APPROVED') {
      return { color: '#198754', backgroundColor: '#f0fdf4', borderColor: '#cbd5e1', fontWeight: '600' };
    } else {
      return { color: '#fd7e14', backgroundColor: '#fff7ed', borderColor: '#cbd5e1', fontWeight: '600' };
    }
  };

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
              Quotation Management
            </h1>
            <p className="text-secondary mb-0" style={{ fontSize: '15px' }}>
              Overview of your Quotation today.
            </p>
          </div>
          <div className="col-md-6 text-md-end d-flex gap-2 justify-content-md-end align-items-center">
            <button 
              className="btn btn-outline-secondary btn-sm px-3 py-2 fw-semibold d-flex align-items-center gap-2 border bg-white text-dark"
              style={{ borderRadius: '8px', fontSize: '14px' }}
              onClick={() => alert('Import configuration is under development.')}
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

        {/* Search and Filters Block */}
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4 bg-white p-3 rounded shadow-sm border border-light">
          <div className="position-relative flex-grow-1" style={{ maxWidth: '400px' }}>
            <span className="position-absolute top-50 start-0 translate-middle-y ps-3 text-secondary">
              <i className="fas fa-search"></i>
            </span>
            <input 
              type="text" 
              className="form-control rounded-pill ps-5 border"
              placeholder="Search Client Quotation..." 
              value={search}
              onChange={handleSearchChange}
              style={{ fontSize: '14px', height: '42px' }}
            />
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button 
              onClick={() => setFilterTab('ALL')}
              className={`btn btn-sm px-3 py-2 rounded-pill fw-semibold ${filterTab === 'ALL' ? 'btn-primary-subtle text-primary border border-primary' : 'btn-light border-0 text-secondary'}`}
              style={{ fontSize: '13px', backgroundColor: filterTab === 'ALL' ? '#eff6ff' : '' }}
            >
              All Quotations
            </button>
            <button 
              onClick={() => setFilterTab('DRAFT')}
              className={`btn btn-sm px-3 py-2 rounded-pill fw-semibold ${filterTab === 'DRAFT' ? 'btn-primary-subtle text-primary border border-primary' : 'btn-light border-0 text-secondary'}`}
              style={{ fontSize: '13px', backgroundColor: filterTab === 'DRAFT' ? '#eff6ff' : '' }}
            >
              Drafts ({draftsCount})
            </button>
            <button 
              onClick={() => setFilterTab('SENT')}
              className={`btn btn-sm px-3 py-2 rounded-pill fw-semibold ${filterTab === 'SENT' ? 'btn-primary-subtle text-primary border border-primary' : 'btn-light border-0 text-secondary'}`}
              style={{ fontSize: '13px', backgroundColor: filterTab === 'SENT' ? '#eff6ff' : '' }}
            >
              Sent ({sentCount})
            </button>
            <button 
              onClick={() => setFilterTab('APPROVED')}
              className={`btn btn-sm px-3 py-2 rounded-pill fw-semibold ${filterTab === 'APPROVED' ? 'btn-primary-subtle text-primary border border-primary' : 'btn-light border-0 text-secondary'}`}
              style={{ fontSize: '13px', backgroundColor: filterTab === 'APPROVED' ? '#eff6ff' : '' }}
            >
              Approved ({approvedCount})
            </button>

            <button 
              className="btn btn-light btn-sm p-2 border ms-2"
              style={{ borderRadius: '8px', width: '38px', height: '38px' }}
              onClick={() => alert('Filter options is under development.')}
            >
              <i className="fas fa-sliders-h text-secondary"></i>
            </button>
          </div>
        </div>

        {/* Client Cards List */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted small">Loading customer records...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-5 bg-white rounded border p-5">
            <div className="fs-1 mb-2">📄</div>
            <p className="text-secondary mb-0">No customer records match your filter criteria.</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {filteredCustomers.map((cust) => {
              const status = getCustomerStatus(cust.id);
              const amount = getCustomerAmount(cust);
              const quoteType = getCustomerQuoteType(cust);
              const latestQuoteId = getLatestQuoteId(cust.id);
              const isExpanded = expandedCustomer === cust.id;
              const quotes = quotesByCustomer[cust.id] || [];

              return (
                <div 
                  key={cust.id} 
                  className="card border-0 shadow-sm bg-white overflow-hidden client-card" 
                  style={{ 
                    borderRadius: '12px', 
                    transition: 'all 0.2s',
                    borderBottom: '3px solid #2563eb' 
                  }}
                >
                  <div className="card-body p-4">
                    {/* Top Main Row */}
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-4 mb-2">
                      {/* Left Info Block */}
                      <div className="d-flex align-items-center gap-3 flex-grow-1" style={{ minWidth: '300px' }}>
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center bg-primary-subtle" 
                          style={{ width: '48px', height: '48px', minWidth: '48px', color: '#2563eb' }}
                        >
                          <i className="fas fa-drafting-compass fs-5"></i>
                        </div>
                        <div>
                          <div className="d-flex align-items-center flex-wrap">
                            <h4 className="fw-bold text-dark mb-0 me-2" style={{ fontSize: '18px' }}>{cust.name}</h4>
                            {getStatusBadge(status)}
                          </div>
                          <div className="d-flex align-items-center flex-wrap gap-2 mt-1 text-secondary" style={{ fontSize: '13px' }}>
                            <span><i className="fas fa-phone text-muted me-1"></i> {cust.phone}</span>
                            <span className="text-muted">•</span>
                            <span>{cust.project?.workType || 'Project'} ({cust.project?.carpetArea ? cust.project.carpetArea.toLocaleString() : '0'} {cust.project?.areaUnit || 'SQFT'})</span>
                          </div>
                          <div className="mt-1 text-secondary small">
                            <i className="far fa-user me-1"></i> Account Manager: {formatCreatorName(cust.createdBy)}
                          </div>
                        </div>
                      </div>

                      {/* Middle Project Details */} 
                      <div className="d-flex align-items-center gap-5 flex-wrap flex-grow-1 justify-content-lg-center" style={{ minWidth: '250px' }}>
                        <div>
                          <span className="text-uppercase text-secondary d-block fw-bold" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Project Type</span>
                          <span className="fw-bold text-dark" style={{ fontSize: '14px' }}>
                            {cust.project?.workType || 'Farm House'} ({cust.project?.carpetArea ? cust.project.carpetArea.toLocaleString() : '20,000'} {cust.project?.areaUnit || 'SQFT'})
                          </span>
                        </div>
                        <div>
                          <span className="text-uppercase text-secondary d-block fw-bold" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Budget</span>
                          <span className="fw-bold text-dark" style={{ fontSize: '14px' }}>
                            ₹{cust.project?.budget ? (cust.project.budget * 1000).toLocaleString() : '20,000.00'}
                          </span>
                        </div>
                      </div>

                      {/* Right Collapsed actions (only show when NOT expanded) */}
                      {!isExpanded && (
                        <div className="d-flex align-items-center gap-3 justify-content-end ms-auto" style={{ minWidth: '220px' }}>
                          <button 
                            className="btn btn-outline-primary btn-sm px-3 py-2 fw-semibold bg-white d-flex align-items-center gap-2" 
                            style={{ borderRadius: '8px', fontSize: '13px' }}
                            onClick={() => toggleExpandCustomer(cust.id)}
                          >
                            <i className="far fa-eye"></i> View Quote
                          </button>

                          <Link 
                            to={`/customer/${cust.id}/create-quotation`} 
                            className="btn btn-primary btn-sm px-3 py-2 fw-semibold d-flex align-items-center gap-2"
                            style={{ borderRadius: '8px', fontSize: '13px', backgroundColor: '#2563eb', border: 'none' }}
                          >
                            <i className="fas fa-plus"></i> Add Quote
                          </Link>

                          <Link 
                            to={`/customer-details?editId=${cust.id}`}
                            className="btn btn-light btn-sm p-2 border" 
                            style={{ borderRadius: '8px', width: '38px', height: '38px' }}
                            title="Edit Client"
                          >
                            <i className="far fa-edit text-secondary"></i>
                          </Link>

                          <div className="dropdown">
                            <button 
                              className="btn btn-light btn-sm p-2 border" 
                              style={{ borderRadius: '8px', width: '38px', height: '38px' }}
                              type="button"
                              data-bs-toggle="dropdown"
                            >
                              <i className="fas fa-ellipsis-v text-secondary"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end border-0 shadow">
                              {isAdmin && (
                                <li>
                                  <button className="dropdown-item py-2 text-danger" onClick={() => handleDeleteCustomer(cust.id, cust.name)}>
                                    <i className="far fa-trash-alt me-2"></i> Delete Client
                                  </button>
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Inline Quotation Details Expansion Section */}
                    {isExpanded && (
                      <div className="mt-4 pt-3 border-top" style={{ borderColor: '#f1f5f9' }}>
                        {/* Sub Header */}
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2" style={{ fontSize: '16px' }}>
                            <i className="far fa-file-alt text-primary"></i> QUOTATION LIST
                          </h5>
                          <div className="d-flex align-items-center gap-2">
                            <button 
                              className="btn btn-outline-secondary btn-sm px-3 py-2 fw-semibold bg-white d-flex align-items-center gap-2" 
                              style={{ borderRadius: '8px', fontSize: '13px' }}
                              onClick={() => toggleExpandCustomer(cust.id)}
                            >
                              <i className="far fa-eye-slash"></i> Hide Quote
                            </button>

                            <Link 
                              to={`/customer/${cust.id}/create-quotation`}
                              className="btn btn-outline-primary btn-sm px-3 py-2 fw-semibold bg-white d-flex align-items-center gap-2"
                              style={{ borderRadius: '8px', fontSize: '13px' }}
                            >
                              <i className="fas fa-plus"></i> Add Quote
                            </Link>

                            <Link 
                              to={`/customer-details?editId=${cust.id}`}
                              className="btn btn-outline-warning btn-sm px-3 py-2 fw-semibold bg-white d-flex align-items-center gap-2"
                              style={{ borderRadius: '8px', fontSize: '13px' }}
                            >
                              <i className="far fa-edit"></i> Edit
                            </Link>

                            <div className="dropdown">
                              <button 
                                className="btn btn-light btn-sm p-2 border" 
                                style={{ borderRadius: '8px', width: '38px', height: '38px' }}
                                type="button"
                                data-bs-toggle="dropdown"
                              >
                                <i className="fas fa-ellipsis-v text-secondary"></i>
                              </button>
                              <ul className="dropdown-menu dropdown-menu-end border-0 shadow">
                                {isAdmin && (
                                  <li>
                                    <button className="dropdown-item py-2 text-danger" onClick={() => handleDeleteCustomer(cust.id, cust.name)}>
                                      <i className="far fa-trash-alt me-2"></i> Delete Client
                                    </button>
                                  </li>
                                )}
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* Quotes list table */}
                        {loadingQuotes ? (
                          <div className="text-center py-4">
                            <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                            <p className="mt-2 text-muted small">Loading quotations list...</p>
                          </div>
                        ) : quotes.length === 0 ? (
                          <div className="alert alert-light border text-center py-4 rounded mb-0">
                            <p className="text-muted mb-2 small">No quotation estimations saved for this client yet.</p>
                            <Link to={`/customer/${cust.id}/create-quotation`} className="btn btn-primary btn-sm fw-bold px-4">Create Quotation</Link>
                          </div>
                        ) : (
                          <div className="table-responsive bg-white rounded border">
                            <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                              <thead>
                                <tr className="table-light text-secondary border-bottom">
                                  <th className="ps-3 py-3 text-uppercase fw-bold" style={{ fontSize: '11px' }}>Date Created</th>
                                  <th className="py-3 text-uppercase fw-bold" style={{ fontSize: '11px' }}>Created By</th>
                                  <th className="py-3 text-uppercase fw-bold text-center" style={{ fontSize: '11px', width: '130px' }}>Status</th>
                                  <th className="py-3 text-uppercase fw-bold" style={{ fontSize: '11px' }}>Project Unit</th>
                                  <th className="py-3 text-uppercase fw-bold text-end" style={{ fontSize: '11px' }}>Subtotal</th>
                                  <th className="py-3 text-uppercase fw-bold text-end" style={{ fontSize: '11px' }}>Discount</th>
                                  <th className="py-3 text-uppercase fw-bold text-end" style={{ fontSize: '11px' }}>Total (inc. GST)</th>
                                  <th className="py-3 text-uppercase fw-bold text-center" style={{ fontSize: '11px', width: '180px' }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(() => {
                                  const rootQuotes = quotes.filter(q => !q.parentQuotationId);
                                  const getRevisions = (parentQuoteId) => {
                                    return quotes
                                      .filter(q => q.parentQuotationId === parentQuoteId)
                                      .sort((a, b) => parseToLocalDate(a.createdAt) - parseToLocalDate(b.createdAt));
                                  };

                                  return rootQuotes.map((q) => {
                                    const revisions = getRevisions(q.id);
                                    const isQuoteExpanded = !!expandedQuotes[q.id];

                                    return (
                                      <React.Fragment key={q.id}>
                                        <tr className="border-bottom" style={{ borderColor: '#f1f5f9' }}>
                                          <td className="ps-3 py-3 align-middle">
                                            {revisions.length > 0 && (
                                              <button 
                                                className="btn btn-xs btn-link p-0 me-2 text-decoration-none"
                                                onClick={() => toggleExpandQuote(q.id)}
                                                style={{ fontSize: '12px', color: '#64748b' }}
                                              >
                                                <i className={`fas ${isQuoteExpanded ? 'fa-minus-square' : 'fa-plus-square'}`}></i>
                                              </button>
                                            )}
                                            <span className="fw-semibold text-dark">{parseToLocalDate(q.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
                                            <div className="text-secondary small font-monospace">{parseToLocalDate(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            {revisions.length > 0 && (
                                              <span className="badge bg-secondary ms-2" style={{ fontSize: '9px' }}>
                                                {revisions.length} {revisions.length === 1 ? 'Rev' : 'Revs'}
                                              </span>
                                            )}
                                          </td>
                                          <td className="py-3 align-middle text-secondary">{formatCreatorName(q.createdBy)}</td>
                                          <td className="py-3 align-middle text-center">
                                            <select 
                                              className="form-select form-select-sm py-1"
                                              value={(q.status || 'ENQUIRY').toUpperCase()}
                                              onChange={(e) => handleStatusChange(cust.id, q.id, e.target.value)}
                                              style={{ ...getStatusSelectStyle(q.status), fontSize: '12px', padding: '4px 28px 4px 10px', borderRadius: '6px' }}
                                            >
                                              <option value="ENQUIRY">Enquiry</option>
                                              <option value="ONGOING">Ongoing</option>
                                              <option value="COMPLETED">Completed</option>
                                            </select>
                                          </td>
                                          <td className="py-3 align-middle text-dark fw-semibold">{q.projectUnit}</td>
                                          <td className="py-3 align-middle text-end text-dark">₹{q.subtotal ? q.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}</td>
                                          <td className="py-3 align-middle text-end text-danger">- ₹{q.discount ? q.discount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}</td>
                                          <td className="py-3 align-middle text-end fw-bold" style={{ color: '#2563eb' }}>₹{q.totalAmount ? q.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}</td>
                                          <td className="py-3 align-middle text-center">
                                            <div className="d-flex gap-2 justify-content-center">
                                              <button 
                                                className="btn btn-sm btn-light border p-2" 
                                                style={{ borderRadius: '6px' }}
                                                onClick={() => navigate(`/quotation/${q.id}`)}
                                                title="View Details"
                                              >
                                                <i className="far fa-eye text-secondary"></i>
                                              </button>
                                              <button 
                                                className="btn btn-sm btn-light border p-2" 
                                                style={{ borderRadius: '6px' }}
                                                onClick={() => handleDownloadPdf(q.id)}
                                                title="Download PDF"
                                              >
                                                <i className="far fa-file-pdf text-danger"></i>
                                              </button>
                                              <button 
                                                className="btn btn-sm btn-light border p-2" 
                                                style={{ borderRadius: '6px' }}
                                                onClick={() => navigate(`/customer/${cust.id}/create-quotation?reviseId=${q.id}`)}
                                                title="Revise / Edit"
                                              >
                                                <i className="far fa-edit text-primary"></i>
                                              </button>
                                              <button 
                                                className="btn btn-sm btn-light border p-2 text-danger" 
                                                style={{ borderRadius: '6px' }}
                                                onClick={() => handleDeleteQuotation(cust.id, q.id)}
                                                title="Delete"
                                              >
                                                <i className="far fa-trash-alt"></i>
                                              </button>
                                            </div>
                                          </td>
                                        </tr>

                                        {/* Nested Revisions Render */}
                                        {isQuoteExpanded && revisions.map((rev) => (
                                          <tr key={rev.id} className="bg-light-subtle border-bottom" style={{ borderColor: '#f1f5f9' }}>
                                            <td className="ps-5 py-2 align-middle text-secondary font-monospace" style={{ fontSize: '12px' }}>
                                              <i className="fas fa-level-up-alt fa-rotate-90 me-2 text-muted"></i>
                                              {parseToLocalDate(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} {parseToLocalDate(rev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="py-2 align-middle text-muted" style={{ fontSize: '12px' }}>{formatCreatorName(rev.createdBy)}</td>
                                            <td className="py-2 align-middle text-center">
                                              <select 
                                                className="form-select form-select-sm py-1 d-inline-block w-auto"
                                                value={(rev.status || 'ENQUIRY').toUpperCase()}
                                                onChange={(e) => handleStatusChange(cust.id, rev.id, e.target.value)}
                                                style={{ ...getStatusSelectStyle(rev.status), fontSize: '11px', padding: '2px 24px 2px 8px', borderRadius: '4px' }}
                                              >
                                                <option value="ENQUIRY">Enquiry</option>
                                                <option value="ONGOING">Ongoing</option>
                                                <option value="COMPLETED">Completed</option>
                                              </select>
                                            </td>
                                            <td className="py-2 align-middle text-muted" style={{ fontSize: '12px' }}>{rev.projectUnit}</td>
                                            <td className="py-2 align-middle text-end text-muted" style={{ fontSize: '12px' }}>₹{rev.subtotal ? rev.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}</td>
                                            <td className="py-2 align-middle text-end text-danger" style={{ fontSize: '12px' }}>- ₹{rev.discount ? rev.discount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}</td>
                                            <td className="py-2 align-middle text-end fw-semibold text-secondary" style={{ fontSize: '12px' }}>₹{rev.totalAmount ? rev.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}</td>
                                            <td className="py-2 align-middle text-center">
                                              <div className="d-flex gap-2 justify-content-center">
                                                <button 
                                                  className="btn btn-xs btn-light border p-1" 
                                                  onClick={() => navigate(`/quotation/${rev.id}`)}
                                                >
                                                  <i className="far fa-eye text-secondary"></i>
                                                </button>
                                                <button 
                                                  className="btn btn-xs btn-light border p-1" 
                                                  onClick={() => handleDownloadPdf(rev.id)}
                                                  title="Download PDF"
                                                >
                                                  <i className="far fa-file-pdf text-danger"></i>
                                                </button>
                                                <button 
                                                  className="btn btn-xs btn-light border p-1" 
                                                  onClick={() => navigate(`/customer/${cust.id}/create-quotation?reviseId=${rev.id}`)}
                                                  title="Revise / Edit"
                                                >
                                                  <i className="far fa-edit text-primary"></i>
                                                </button>
                                                <button 
                                                  className="btn btn-xs btn-light border p-1 text-danger" 
                                                  onClick={() => handleDeleteQuotation(cust.id, rev.id)}
                                                  title="Delete"
                                                >
                                                  <i className="far fa-trash-alt"></i>
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </React.Fragment>
                                    );
                                  });
                                })()}
                              </tbody>
                            </table>
                            {/* Table Footer */}
                            <div className="d-flex justify-content-between align-items-center p-3 bg-light-subtle border-top">
                              <span className="text-secondary" style={{ fontSize: '13px' }}>
                                Showing {quotes.filter(q => !q.parentQuotationId).length} of {quotes.length} quotations for project "{cust.project?.workType || 'Farm House'}"
                              </span>
                              
                              <nav>
                                <ul className="pagination pagination-sm mb-0">
                                  <li className="page-item disabled"><span className="page-link">&lt;</span></li>
                                  <li className="page-item active"><span className="page-link" style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}>1</span></li>
                                  <li className="page-item"><span className="page-link">2</span></li>
                                  <li className="page-item"><span className="page-link">3</span></li>
                                  <li className="page-item"><span className="page-link">&gt;</span></li>
                                </ul>
                              </nav>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Styles for custom client cards */}
      <style>{`
        .client-card:hover {
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.06) !important;
        }
      `}</style>
    </div>
  );
}

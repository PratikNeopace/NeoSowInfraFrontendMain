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

const getStatusSelectStyle = (status) => {
  const norm = (status || 'ENQUIRY').toUpperCase();
  if (norm === 'ONGOING') {
    return { color: '#0d6efd', borderColor: '#0d6efd', fontWeight: '600', minWidth: '120px' };
  } else if (norm === 'COMPLETED') {
    return { color: '#198754', borderColor: '#198754', fontWeight: '600', minWidth: '120px' };
  } else {
    return { color: '#fd7e14', borderColor: '#fd7e14', fontWeight: '600', minWidth: '120px' };
  }
};

export default function QuotationList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [quotesByCustomer, setQuotesByCustomer] = useState({});
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [expandedQuotes, setExpandedQuotes] = useState({});

  const toggleExpandQuote = (quoteId) => {
    setExpandedQuotes(prev => ({
      ...prev,
      [quoteId]: !prev[quoteId]
    }));
  };

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
      log.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    fetchCustomers(e.target.value);
  };

  const loadCustomerQuotations = async (customerId) => {
    try {
      const res = await API.get(`/quotations/customer/${customerId}`, {
        params: { page: 0, size: 50 }
      });
      setQuotesByCustomer(prev => ({
        ...prev,
        [customerId]: res.data.content || []
      }));
    } catch (err) {
      log.error('Failed to load quotations for customer: ' + customerId, err);
    }
  };

  const toggleExpandCustomer = (customerId) => {
    if (expandedCustomer === customerId) {
      setExpandedCustomer(null);
    } else {
      setExpandedCustomer(customerId);
      if (!quotesByCustomer[customerId]) {
        loadCustomerQuotations(customerId);
      }
    }
  };

  const handleDeleteCustomer = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete customer "${name}"? This will delete all their project details and quotations.`)) {
      try {
        await API.delete(`/customers/${id}`);
        alert('Customer deleted successfully.');
        fetchCustomers(search);
      } catch (err) {
        log.error('Failed to delete customer', err);
        alert('Error deleting customer. Please verify permissions.');
      }
    }
  };

  const handleDeleteQuotation = async (customerId, quoteId) => {
    if (window.confirm('Are you sure you want to delete this quotation estimation sheet?')) {
      try {
        await API.delete(`/quotations/${quoteId}`);
        alert('Quotation deleted successfully.');
        loadCustomerQuotations(customerId);
      } catch (err) {
        log.error('Failed to delete quotation', err);
      }
    }
  };

  const handleDownloadPdf = async (quoteId) => {
    try {
      // Direct HTTP download link hitting endpoint
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
      alert('Failed to update status. Please verify server connection.');
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <Navbar />

      <div className="container py-5">
        <div className="card border-0 shadow-lg p-4" style={{ borderRadius: '12px', background: 'white' }}>
          
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
            <h2 className="text-primary fw-bold mb-0">
              <i className="fas fa-file-invoice-dollar me-2"></i> Quotation Management
            </h2>
            <Link to="/customer-details" className="btn btn-primary fw-bold px-4 py-2" style={{ borderRadius: '8px' }}>
              <i className="fas fa-plus-circle me-1"></i> Create Customer
            </Link>
          </div>

          {/* Search bar */}
          <div className="mb-4">
            <input 
              type="text" 
              className="form-control py-2 px-3 border" 
              placeholder="Search by customer name or phone number..."
              value={search}
              onChange={handleSearchChange}
              style={{ borderRadius: '8px' }}
            />
          </div>

          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status"></span>
              <p className="mt-2 text-muted">Retrieving customer records...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <div className="fs-1">📄</div>
              <p className="mt-2 mb-0">No customer records found. Click "Create Customer" to start.</p>
            </div>
          ) : (
            <div className="row g-4">
              {customers.map((cust) => {
                const isExpanded = expandedCustomer === cust.id;
                const quotes = quotesByCustomer[cust.id] || [];

                return (
                  <div key={cust.id} className="col-12">
                    <div className="card border-2 shadow-sm" style={{ 
                      borderRadius: '10px', 
                      borderColor: isExpanded ? '#667eea' : '#e9ecef',
                      transition: 'all 0.3s ease'
                    }}>
                      <div className="card-body p-4">
                        <div className="d-flex justify-content-between align-items-start flex-wrap">
                          <div>
                            <h4 className="fw-bold text-primary mb-1">{cust.name}</h4>
                            <p className="text-muted small mb-2">
                              <i className="fas fa-phone me-1"></i> {cust.phone} {cust.address ? ` | 📍 ${cust.address}` : ''}
                            </p>
                            {cust.createdBy && (
                              <p className="text-secondary small mb-2" style={{ fontSize: '12px' }}>
                                <i className="fas fa-user me-1"></i> Created By: <span className="fw-semibold text-dark">{formatCreatorName(cust.createdBy)}</span>
                              </p>
                            )}
                            {cust.project && (
                              <span className="badge bg-secondary me-2">
                                {cust.project.workType} ({cust.project.carpetArea} {cust.project.areaUnit})
                              </span>
                            )}
                            {cust.project?.budget && (
                              <span className="badge bg-success">
                                Budget: ₹{Number(cust.project.budget).toLocaleString()}
                              </span>
                            )}
                          </div>
                          
                          <div className="d-flex gap-2 mt-2 mt-md-0">
                            <button 
                              className={`btn btn-sm ${isExpanded ? 'btn-primary' : 'btn-outline-primary'} fw-bold`} 
                              onClick={() => toggleExpandCustomer(cust.id)}
                            >
                              <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} me-1`}></i> 
                              {isExpanded ? 'Hide Quotations' : 'View Quotations'}
                            </button>
                            <Link to={`/customer/${cust.id}/create-quotation`} className="btn btn-sm btn-outline-success fw-bold">
                              <i className="fas fa-file-invoice me-1"></i> Add Quote
                            </Link>
                            <Link to={`/customer-details?editId=${cust.id}`} className="btn btn-sm btn-outline-warning fw-bold">
                              <i className="fas fa-edit"></i> Edit
                            </Link>
                            {isAdmin && (
                              <button 
                                className="btn btn-sm btn-outline-danger fw-bold" 
                                onClick={() => handleDeleteCustomer(cust.id, cust.name)}
                              >
                                <i className="fas fa-trash"></i> Delete
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Collapsible Quotations Section */}
                        {isExpanded && (
                          <div className="mt-4 border-top pt-3 bg-light p-3 rounded">
                            <h5 className="fw-bold text-secondary mb-3"><i className="fas fa-receipt me-1"></i> Quotation List</h5>
                            {quotes.length === 0 ? (
                              <p className="text-muted small mb-0">No quotation sheets saved for this customer yet. Click "Add Quote" to create one.</p>
                            ) : (
                              <div className="table-responsive">
                                <table className="table table-sm table-hover bg-white rounded border mb-0">
                                  <thead>
                                    <tr className="table-primary text-secondary">
                                      <th className="ps-3 py-2">Date Created</th>
                                      <th className="py-2">Created By</th>
                                      <th className="py-2 text-center" style={{ width: '130px' }}>Status</th>
                                      <th className="py-2">Project Unit</th>
                                      <th className="py-2 text-end">Subtotal</th>
                                      <th className="py-2 text-end">Discount</th>
                                      <th className="py-2 text-end">Total (inc. GST)</th>
                                      <th className="py-2 text-center" style={{ width: '250px' }}>Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(() => {
                                      const rootQuotes = quotes.filter(q => !q.parentQuotationId);
                                      const getRevisions = (parentQuoteId) => {
                                        return quotes
                                          .filter(q => q.parentQuotationId === parentQuoteId)
                                          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                                      };

                                      return rootQuotes.map((q) => {
                                        const revisions = getRevisions(q.id);
                                        const isQuoteExpanded = !!expandedQuotes[q.id];

                                        return (
                                          <React.Fragment key={q.id}>
                                            <tr>
                                              <td className="ps-3 py-2 align-middle small">
                                                {revisions.length > 0 && (
                                                  <button 
                                                    className="btn btn-xs btn-link p-0 me-2 text-decoration-none"
                                                    onClick={() => toggleExpandQuote(q.id)}
                                                    style={{ fontSize: '12px' }}
                                                  >
                                                    <i className={`fas ${isQuoteExpanded ? 'fa-minus-square' : 'fa-plus-square'}`}></i>
                                                  </button>
                                                )}
                                                {new Date(q.createdAt).toLocaleString()}
                                                {revisions.length > 0 && (
                                                  <span className="badge bg-secondary ms-2" style={{ fontSize: '9px' }}>
                                                    {revisions.length} {revisions.length === 1 ? 'Rev' : 'Revs'}
                                                  </span>
                                                )}
                                              </td>
                                              <td className="py-2 align-middle small">{formatCreatorName(q.createdBy)}</td>
                                              <td className="py-2 align-middle text-center">
                                                <select 
                                                  className="form-select form-select-sm py-0"
                                                  value={(q.status || 'ENQUIRY').toUpperCase()}
                                                  onChange={(e) => handleStatusChange(cust.id, q.id, e.target.value)}
                                                  style={{ ...getStatusSelectStyle(q.status), fontSize: '12px', padding: '2px 24px 2px 8px' }}
                                                >
                                                  <option value="ENQUIRY" style={{ color: '#fd7e14', fontWeight: 'normal' }}>Enquiry</option>
                                                  <option value="ONGOING" style={{ color: '#0d6efd', fontWeight: 'normal' }}>Ongoing</option>
                                                  <option value="COMPLETED" style={{ color: '#198754', fontWeight: 'normal' }}>Completed</option>
                                                </select>
                                              </td>
                                              <td className="py-2 align-middle small">{q.projectUnit}</td>
                                              <td className="py-2 align-middle text-end small">₹{q.subtotal.toFixed(2)}</td>
                                              <td className="py-2 align-middle text-end small text-danger">-₹{q.discount.toFixed(2)}</td>
                                              <td className="py-2 align-middle text-end fw-bold text-success">₹{q.totalAmount.toFixed(2)}</td>
                                              <td className="py-2 align-middle text-center">
                                                <button 
                                                  className="btn btn-xs btn-outline-secondary me-1 py-1" 
                                                  onClick={() => navigate(`/quotation/${q.id}`)}
                                                >
                                                  <i className="fas fa-eye"></i> View
                                                </button>
                                                <button 
                                                  className="btn btn-xs btn-outline-success me-1 py-1" 
                                                  onClick={() => handleDownloadPdf(q.id)}
                                                >
                                                  <i className="fas fa-file-pdf"></i> PDF
                                                </button>
                                                <button 
                                                  className="btn btn-xs btn-outline-primary me-1 py-1" 
                                                  onClick={() => navigate(`/customer/${cust.id}/create-quotation?reviseId=${q.id}`)}
                                                >
                                                  <i className="fas fa-edit"></i> Edit
                                                </button>
                                                <button 
                                                  className="btn btn-xs btn-outline-danger py-1" 
                                                  onClick={() => handleDeleteQuotation(cust.id, q.id)}
                                                >
                                                  <i className="fas fa-trash"></i> Delete
                                                </button>
                                              </td>
                                            </tr>
                                            {isQuoteExpanded && revisions.map((rev, revIdx) => (
                                              <tr key={rev.id} style={{ backgroundColor: '#f9f9f9' }}>
                                                <td className="ps-4 py-2 align-middle small text-muted">
                                                  <span className="text-secondary fw-semibold me-2">└── Rev {revIdx + 1}:</span>
                                                  {new Date(rev.createdAt).toLocaleString()}
                                                </td>
                                                <td className="py-2 align-middle small text-muted">{formatCreatorName(rev.createdBy)}</td>
                                                <td className="py-2 align-middle text-center">
                                                  <select 
                                                    className="form-select form-select-sm py-0"
                                                    value={(rev.status || 'ENQUIRY').toUpperCase()}
                                                    onChange={(e) => handleStatusChange(cust.id, rev.id, e.target.value)}
                                                    style={{ ...getStatusSelectStyle(rev.status), fontSize: '11px', padding: '2px 20px 2px 6px' }}
                                                  >
                                                    <option value="ENQUIRY" style={{ color: '#fd7e14', fontWeight: 'normal' }}>Enquiry</option>
                                                    <option value="ONGOING" style={{ color: '#0d6efd', fontWeight: 'normal' }}>Ongoing</option>
                                                    <option value="COMPLETED" style={{ color: '#198754', fontWeight: 'normal' }}>Completed</option>
                                                  </select>
                                                </td>
                                                <td className="py-2 align-middle small text-muted">{rev.projectUnit}</td>
                                                <td className="py-2 align-middle text-end small text-muted">₹{rev.subtotal.toFixed(2)}</td>
                                                <td className="py-2 align-middle text-end small text-danger">-₹{rev.discount.toFixed(2)}</td>
                                                <td className="py-2 align-middle text-end fw-semibold text-success small">₹{rev.totalAmount.toFixed(2)}</td>
                                                <td className="py-2 align-middle text-center">
                                                  <button 
                                                    className="btn btn-xs btn-outline-secondary me-1 py-0" 
                                                    style={{ fontSize: '10px', padding: '2px 6px' }}
                                                    onClick={() => navigate(`/quotation/${rev.id}`)}
                                                  >
                                                    <i className="fas fa-eye"></i> View
                                                  </button>
                                                  <button 
                                                    className="btn btn-xs btn-outline-success me-1 py-0" 
                                                    style={{ fontSize: '10px', padding: '2px 6px' }}
                                                    onClick={() => handleDownloadPdf(rev.id)}
                                                  >
                                                    <i className="fas fa-file-pdf"></i> PDF
                                                  </button>
                                                  <button 
                                                    className="btn btn-xs btn-outline-primary me-1 py-0" 
                                                    style={{ fontSize: '10px', padding: '2px 6px' }}
                                                    onClick={() => navigate(`/customer/${cust.id}/create-quotation?reviseId=${rev.id}`)}
                                                  >
                                                    <i className="fas fa-edit"></i> Edit
                                                  </button>
                                                  <button 
                                                    className="btn btn-xs btn-outline-danger py-0" 
                                                    style={{ fontSize: '10px', padding: '2px 6px' }}
                                                    onClick={() => handleDeleteQuotation(cust.id, rev.id)}
                                                  >
                                                    <i className="fas fa-trash"></i> Delete
                                                  </button>
                                                </td>
                                              </tr>
                                            ))}
                                          </React.Fragment>
                                        );
                                      });
                                    })()}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

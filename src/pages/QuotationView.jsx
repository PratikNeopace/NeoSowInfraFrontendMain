import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../services/api';

export default function QuotationView() {
  const { quoteId } = useParams();
  const navigate = useNavigate();
  
  const [quotation, setQuotation] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const [showWaModal, setShowWaModal] = useState(false);
  const [waSending, setWaSending] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState('');
  const [customPhone, setCustomPhone] = useState('');

  useEffect(() => {
    const fetchQuotationData = async () => {
      setLoading(true);
      try {
        const quoteRes = await API.get(`/quotations/${quoteId}`);
        setQuotation(quoteRes.data);

        const custRes = await API.get(`/customers/${quoteRes.data.customerId}`);
        setCustomer(custRes.data);
      } catch (err) {
        log.error('Failed to load quotation details', err);
        alert('Quotation sheet not found.');
        navigate('/quotations');
      } finally {
        setLoading(false);
      }
    };
    fetchQuotationData();
  }, [quoteId, navigate]);

  const handleOpenWaModal = () => {
    setSelectedPhone(customer.phone);
    setCustomPhone('');
    setShowWaModal(true);
  };

  const handleSendWhatsApp = async () => {
    let finalPhone = selectedPhone === 'custom' ? customPhone : selectedPhone;
    if (!finalPhone) {
      alert('Please select or enter a valid phone number.');
      return;
    }
    
    setWaSending(true);
    try {
      await API.post(`/quotations/${quoteId}/whatsapp?targetPhone=${encodeURIComponent(finalPhone)}`);
      alert('Quotation sent to WhatsApp successfully!');
      setShowWaModal(false);
    } catch (err) {
      console.error('Failed to send WhatsApp', err);
      alert(err.response?.data?.message || err.response?.data || 'Failed to send WhatsApp message.');
    } finally {
      setWaSending(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const response = await API.get(`/quotations/${quoteId}/pdf`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `quotation_${quoteId}.pdf`;
      link.click();
    } catch (err) {
      log.error('Failed to export PDF', err);
      alert('Error printing PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    }}> 
      <Navbar />

      <div className="container py-5 px-3 px-lg-5">
        <div className="card border-0 shadow-sm p-4 mx-auto bg-white" style={{ borderRadius: '16px', maxWidth: '900px' }}>
          
          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status"></span>
              <p className="mt-2 text-muted">Compiling estimation details...</p>
            </div>
          ) : quotation && customer ? (
            <div>
              {/* Toolbar */}
              <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                <Link 
                  to="/quotations" 
                  className="btn btn-outline-secondary btn-sm px-3 py-2 fw-semibold border bg-white text-dark d-flex align-items-center gap-2"
                  style={{ borderRadius: '8px', fontSize: '13px' }}
                >
                  <i className="fas fa-arrow-left"></i> Back to Quotations
                </Link>
                <button 
                  className="btn btn-primary btn-sm px-4 py-2 fw-semibold d-flex align-items-center gap-2" 
                  style={{ borderRadius: '8px', fontSize: '13px', backgroundColor: '#174D3A', border: 'none' }}
                  onClick={handleDownloadPdf} 
                  disabled={downloading}
                >
                  {downloading ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    <i className="fas fa-file-pdf"></i>
                  )}
                  Export PDF
                </button>
                <button 
                  className="btn btn-success btn-sm px-4 py-2 fw-semibold d-flex align-items-center gap-2 ms-2" 
                  style={{ borderRadius: '8px', fontSize: '13px', border: 'none', backgroundColor: '#25D366' }}
                  onClick={handleOpenWaModal} 
                >
                  <i className="fab fa-whatsapp"></i> Share WhatsApp
                </button>
              </div>

              {/* Printable Invoice Container */}
              <div className="p-4 bg-white border border-light shadow-sm rounded-3" style={{ fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                  <div>
                    <h2 className="fw-bold mb-0" style={{ color: '#153325', letterSpacing: '-0.02em' }}>PROFORMA INVOICE</h2>
                    <span className="text-secondary small">Professional Estimation Sheet</span>
                  </div>
                  <div className="text-end">
                    <h5 className="fw-bold mb-0" style={{ color: '#153325' }}>NEOSOW INFRA</h5>
                    <span className="text-muted small" style={{ fontSize: '11px' }}>support@neosowinfra.com</span>
                  </div>
                </div>

                {/* Client & Quote Summary */}
                <div className="row mb-4">
                  <div className="col-6">
                    <h6 className="fw-bold pb-1 mb-2" style={{ color: '#153325', borderBottom: '2px solid #c5a059', width: 'fit-content', paddingRight: '20px' }}>BILL TO:</h6>
                    <div className="fw-bold text-dark">{customer.name}</div>
                    <div className="text-secondary small">{customer.phone}</div>
                    <div className="text-secondary small">{customer.address || 'Address: N/A'}</div>
                  </div>
                  <div className="col-6 text-end">
                    <h6 className="fw-bold pb-1 mb-2 ms-auto" style={{ color: '#153325', borderBottom: '2px solid #c5a059', width: 'fit-content', paddingLeft: '20px' }}>DETAILS:</h6>
                    <div className="small text-secondary"><strong>Proforma Invoice ID:</strong> <span className="text-dark font-monospace">{quotation.id}</span></div>
                    <div className="small text-secondary"><strong>Date:</strong> <span className="text-dark">{new Date(quotation.createdAt).toLocaleString()}</span></div>
                    <div className="small text-secondary"><strong>Unit Setting:</strong> <span className="text-dark">{quotation.projectUnit}</span></div>
                    {customer.project && <div className="small text-secondary"><strong>Work Type:</strong> <span className="text-dark">{customer.project.workType}</span></div>}
                  </div>
                </div>

                {/* Items Table */}
                <table className="table table-bordered table-sm small align-middle mb-4">
                  <thead>
                    <tr className="text-center text-white" style={{ backgroundColor: '#153325' }}>
                      <th className="py-2">S.No</th>
                      <th className="py-2">Description</th>
                      <th className="py-2">Width</th>
                      <th className="py-2">Height</th>
                      <th className="py-2">Depth</th>
                      <th className="py-2">Unit</th>
                      <th className="py-2">Qty</th>
                      <th className="py-2">Nos</th>
                      <th className="py-2">Total Qty.</th>
                      <th className="py-2">Rate</th>
                      <th className="py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotation.items.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="text-center text-secondary">{idx + 1}</td>
                        <td>
                          <strong className="text-dark">{item.category}</strong>
                          {item.subcategory && <span className="text-secondary"> - {item.subcategory}</span>}
                          {item.description && <div className="text-muted" style={{ fontSize: '10px' }}>{item.description}</div>}
                        </td>
                        <td className="text-center text-dark">{item.width || '-'}</td>
                        <td className="text-center text-dark">{item.height || '-'}</td>
                        <td className="text-center text-dark">{item.depth || '-'}</td>
                        <td className="text-center text-secondary">{item.unit}</td>
                        <td className="text-center text-dark">{item.qty}</td>
                        <td className="text-center text-secondary">{item.noOfUnit ? item.noOfUnit : '1.00'}</td>
                        <td className="text-center fw-bold text-dark">{item.totalQty ? item.totalQty : item.qty}</td>
                        <td className="text-end text-dark">₹{Number(item.unitRate).toFixed(2)}</td>
                        <td className="text-end fw-bold text-dark">₹{Number(item.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Summary Calculations */}
                <div className="d-flex justify-content-end mb-4">
                  <table className="table table-sm border-0 mb-0" style={{ width: '320px' }}>
                    <tbody>
                      <tr className="border-0">
                        <td className="border-0 text-secondary">Subtotal:</td>
                        <td className="text-end border-0 fw-semibold text-dark">₹{quotation.subtotal.toFixed(2)}</td>
                      </tr>
                      {quotation.discount > 0 && (
                        <tr className="border-0 text-danger">
                          <td className="border-0">
                            {quotation.discountPercent != null && quotation.discountPercent > 0 
                              ? `Discount (${quotation.discountPercent}%):` 
                              : 'Discount:'}
                          </td>
                          <td className="text-end border-0 fw-semibold">-₹{quotation.discount.toFixed(2)}</td>
                        </tr>
                      )}
                      {quotation.includeGst && (
                        <tr className="border-top">
                          <td className="border-0 text-secondary">GST (18%):</td>
                          <td className="text-end border-0 fw-semibold text-dark">₹{quotation.gstAmount.toFixed(2)}</td>
                        </tr>
                      )}
                      <tr className="fw-bold border-top fs-6" style={{ backgroundColor: '#f8fafc', color: '#153325' }}>
                        <td className="py-2 px-2">GRAND TOTAL:</td>
                        <td className="text-end py-2 px-2" style={{ borderLeft: '3px solid #c5a059' }}>₹{quotation.totalAmount.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Footer Notes */}
                <div className="p-3 rounded-3" style={{ fontSize: '12px', backgroundColor: '#f8fafc', borderLeft: '4px solid #c5a059' }}>
                  <strong style={{ color: '#153325' }}>Terms &amp; Conditions:</strong> Valid for 30 days. Confirm via email. Thank you for your business!
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-4 text-danger small">Error loading quotation sheet.</div>
          )}

        </div>
      </div>

      {/* WhatsApp Share Modal */}
      {showWaModal && customer && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title fw-bold">
                  <i className="fab fa-whatsapp me-2"></i> Share via WhatsApp
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowWaModal(false)}></button>
              </div>
              <div className="modal-body p-4 bg-light">
                <p className="text-secondary small mb-3">Select the number to send the quotation PDF link to:</p>
                
                <div className="form-check mb-2">
                  <input className="form-check-input" type="radio" name="phoneOptions" id="phonePrimary" 
                    checked={selectedPhone === customer.phone}
                    onChange={() => setSelectedPhone(customer.phone)}
                  />
                  <label className="form-check-label fw-bold" htmlFor="phonePrimary">
                    {customer.name} (Primary) - {customer.phone}
                  </label>
                </div>

                {customer.familyMembers && customer.familyMembers.length > 0 && customer.familyMembers.map((fm, idx) => {
                  if (!fm.contact) return null;
                  return (
                    <div className="form-check mb-2" key={idx}>
                      <input className="form-check-input" type="radio" name="phoneOptions" id={`phoneFm${idx}`} 
                        checked={selectedPhone === fm.contact}
                        onChange={() => setSelectedPhone(fm.contact)}
                      />
                      <label className="form-check-label" htmlFor={`phoneFm${idx}`}>
                        {fm.name} ({fm.type}) - {fm.contact}
                      </label>
                    </div>
                  );
                })}

                <div className="form-check mb-2">
                  <input className="form-check-input" type="radio" name="phoneOptions" id="phoneCustom" 
                    checked={selectedPhone === 'custom'}
                    onChange={() => setSelectedPhone('custom')}
                  />
                  <label className="form-check-label" htmlFor="phoneCustom">
                    Other Number...
                  </label>
                </div>

                {selectedPhone === 'custom' && (
                  <div className="mt-2 ms-4">
                    <div className="input-group">
                      <span className="input-group-text bg-white text-muted fw-bold">+91</span>
                      <input 
                        type="tel" 
                        className="form-control"
                        placeholder="9876543210"
                        maxLength="10"
                        value={customPhone.replace(/^\+?91/, '')}
                        onChange={(e) => setCustomPhone(e.target.value)}
                      />
                    </div>
                  </div>
                )}

              </div>
              <div className="modal-footer bg-light border-top-0">
                <button type="button" className="btn btn-secondary fw-bold" onClick={() => setShowWaModal(false)}>Cancel</button>
                <button type="button" className="btn btn-success fw-bold px-4" onClick={handleSendWhatsApp} disabled={waSending}>
                  {waSending ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="fas fa-paper-plane me-2"></i>}
                  Send WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
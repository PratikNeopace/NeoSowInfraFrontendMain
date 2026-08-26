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
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

  useEffect(() => {
    const fetchQuotationData = async () => {
      setLoading(true);
      try {
        const quoteRes = await API.get(`/quotations/${quoteId}`);
        setQuotation(quoteRes.data);

        const custRes = await API.get(`/customers/${quoteRes.data.customerId}`);
        setCustomer(custRes.data);
      } catch (err) {
        console.error('Failed to load quotation details', err);
        alert('Quotation sheet not found.');
        navigate('/quotations');
      } finally {
        setLoading(false);
      }
    };
    fetchQuotationData();
  }, [quoteId, navigate]);

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
      console.error('Failed to export PDF', err);
      alert('Error printing PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const handleSendWhatsApp = async () => {
    setSendingWhatsApp(true);
    try {
      await API.post(`/quotations/${quoteId}/whatsapp`);
      alert('Quotation sent successfully to customer via WhatsApp!');
    } catch (err) {
      console.error('Failed to send quotation on WhatsApp', err);
      alert(err.response?.data?.message || 'Error sending quotation on WhatsApp.');
    } finally {
      setSendingWhatsApp(false);
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
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-success btn-sm px-4 py-2 fw-semibold d-flex align-items-center gap-2" 
                    style={{ borderRadius: '8px', fontSize: '13px', backgroundColor: '#25D366', border: 'none' }}
                    onClick={handleSendWhatsApp} 
                    disabled={sendingWhatsApp}
                  >
                    {sendingWhatsApp ? (
                      <span className="spinner-border spinner-border-sm"></span>
                    ) : (
                      <i className="fab fa-whatsapp"></i>
                    )}
                    Send WhatsApp
                  </button>
                  <button 
                    className="btn btn-primary btn-sm px-4 py-2 fw-semibold d-flex align-items-center gap-2" 
                    style={{ borderRadius: '8px', fontSize: '13px', backgroundColor: '#006A4E', border: 'none' }}
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
                </div>
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
                        <td className="text-center">{item.width}</td>
                        <td className="text-center">{item.height}</td>
                        <td className="text-center">{item.depth}</td>
                        <td className="text-center text-secondary">{item.unit}</td>
                        <td className="text-center">{item.qty}</td>
                        <td className="text-center">{item.nos}</td>
                        <td className="text-center fw-semibold">{item.totalQty}</td>
                        <td className="text-end font-monospace">{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="text-end font-monospace fw-semibold">{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Calculations Footer summary */}
                <div className="row justify-content-end">
                  <div className="col-lg-5 col-md-7 col-12">
                    <div className="card bg-light border-0 p-3" style={{ borderRadius: '12px' }}>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-secondary small">Subtotal Amount:</span>
                        <span className="font-monospace fw-semibold text-dark">Rs. {quotation.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      
                      {quotation.discount > 0 && (
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-danger small">Discount ({quotation.discountPercent}%):</span>
                          <span className="font-monospace fw-semibold text-danger">- Rs. {quotation.discount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      {quotation.includeGst && (
                        <div className="d-flex justify-content-between mb-2 border-bottom pb-2">
                          <span className="text-secondary small">GST Amount (18%):</span>
                          <span className="font-monospace fw-semibold text-dark">Rs. {quotation.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <span className="fw-bold text-dark" style={{ fontSize: '15px' }}>Grand Total:</span>
                        <span className="fw-bold text-success font-monospace" style={{ fontSize: '18px' }}>Rs. {quotation.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="text-center py-5 text-muted">No quotation detail loaded.</div>
          )}

        </div>
      </div>
    </div>
  );
}

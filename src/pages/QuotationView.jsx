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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <Navbar />

      <div className="container py-5">
        <div className="card border-0 shadow-lg p-4 mx-auto" style={{ borderRadius: '12px', maxWidth: '850px', background: 'white' }}>
          
          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status"></span>
              <p className="mt-2 text-muted">Compiling estimation details...</p>
            </div>
          ) : quotation && customer ? (
            <div>
              {/* Toolbar */}
              <div className="d-flex justify-content-between mb-4 border-bottom pb-2">
                <Link to="/quotations" className="btn btn-outline-secondary btn-sm fw-semibold">
                  <i className="fas fa-arrow-left me-1"></i> Back to Quotations
                </Link>
                <button className="btn btn-success btn-sm fw-bold px-3" onClick={handleDownloadPdf} disabled={downloading}>
                  {downloading ? (
                    <span className="spinner-border spinner-border-sm me-1"></span>
                  ) : (
                    <i className="fas fa-file-pdf me-1"></i>
                  )}
                  Export PDF
                </button>
              </div>

              {/* Printable Invoice Container */}
              <div className="p-4 border rounded" style={{ fontFamily: 'Arial, sans-serif' }}>
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                  <div>
                    <h2 className="text-primary fw-bold mb-0">PROFORMA INVOICE</h2>
                    <span className="text-muted small">Professional Estimation Sheet</span>
                  </div>
                  <div className="text-end">
                    <h5 className="fw-bold text-primary mb-0">NEOSOW INFRA</h5>
                    <span className="text-muted small" style={{ fontSize: '11px' }}>support@neosow.com</span>
                  </div>
                </div>

                {/* Client & Quote Summary */}
                <div className="row mb-4">
                  <div className="col-6">
                    <h6 className="text-primary fw-bold border-bottom pb-1 mb-2">BILL TO:</h6>
                    <div className="fw-bold">{customer.name}</div>
                    <div className="text-secondary small">{customer.phone}</div>
                    <div className="text-secondary small">{customer.address || 'Address: N/A'}</div>
                  </div>
                  <div className="col-6 text-end">
                    <h6 className="text-primary fw-bold border-bottom pb-1 mb-2">DETAILS:</h6>
                    <div className="small"><strong>Proforma Invoice ID:</strong> {quotation.id}</div>
                    <div className="small"><strong>Date:</strong> {new Date(quotation.createdAt).toLocaleString()}</div>
                    <div className="small"><strong>Unit Setting:</strong> {quotation.projectUnit}</div>
                    {customer.project && <div className="small"><strong>Work Type:</strong> {customer.project.workType}</div>}
                  </div>
                </div>

                {/* Items Table */}
                <table className="table table-bordered table-sm small align-middle mb-4">
                  <thead>
                    <tr className="table-primary text-center">
                      <th>S.No</th>
                      <th>Description</th>
                      <th>Width</th>
                      <th>Height</th>
                      <th>Depth</th>
                      <th>Unit</th>
                      <th>Qty</th>
                      <th>Nos</th>
                      <th>Total Qty.</th>
                      <th>Rate</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotation.items.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="text-center">{idx + 1}</td>
                        <td>
                          <strong>{item.category}</strong>
                          {item.subcategory && ` - ${item.subcategory}`}
                          {item.description && <div className="text-muted" style={{ fontSize: '10px' }}>{item.description}</div>}
                        </td>
                        <td className="text-center">{item.width || '-'}</td>
                        <td className="text-center">{item.height || '-'}</td>
                        <td className="text-center">{item.depth || '-'}</td>
                        <td className="text-center">{item.unit}</td>
                        <td className="text-center">{item.qty}</td>
                        <td className="text-center">{item.noOfUnit ? item.noOfUnit : '1.00'}</td>
                        <td className="text-center fw-bold">{item.totalQty ? item.totalQty : item.qty}</td>
                        <td className="text-end">₹{Number(item.unitRate).toFixed(2)}</td>
                        <td className="text-end fw-bold">₹{Number(item.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Summary Calculations */}
                <div className="d-flex justify-content-end mb-4">
                  <table className="table table-sm border-0 mb-0" style={{ width: '280px' }}>
                    <tbody>
                      <tr className="border-0">
                        <td className="border-0">Subtotal:</td>
                        <td className="text-end border-0">₹{quotation.subtotal.toFixed(2)}</td>
                      </tr>
                      {quotation.discount > 0 && (
                        <tr className="border-0 text-danger">
                          <td className="border-0">
                            {quotation.discountPercent != null && quotation.discountPercent > 0 
                              ? `Discount (${quotation.discountPercent}%):` 
                              : 'Discount:'}
                          </td>
                          <td className="text-end border-0">-₹{quotation.discount.toFixed(2)}</td>
                        </tr>
                      )}
                      {quotation.includeGst && (
                        <tr className="border-top">
                          <td className="border-0">GST (18%):</td>
                          <td className="text-end border-0">₹{quotation.gstAmount.toFixed(2)}</td>
                        </tr>
                      )}
                      <tr className="table-primary fw-bold text-primary border-top fs-6">
                        <td>GRAND TOTAL:</td>
                        <td className="text-end">₹{quotation.totalAmount.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Footer Notes */}
                <div className="bg-light p-3 rounded border-start border-primary border-4" style={{ fontSize: '11px' }}>
                  <strong>Terms &amp; Conditions:</strong> Valid for 30 days. Confirm via email. Thank you for your business!
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-4 text-danger small">Error loading quotation sheet.</div>
          )}

        </div>
      </div>
    </div>
  );
}

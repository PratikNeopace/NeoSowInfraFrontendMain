import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../services/api';

export default function CustomerDetails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('editId');

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [anniversaryDate, setAnniversaryDate] = useState('');
  
  // Project Details State
  const [workType, setWorkType] = useState('');
  const [customWorkType, setCustomWorkType] = useState('');
  const [showCustomWorkType, setShowCustomWorkType] = useState(false);
  const [carpetArea, setCarpetArea] = useState('');
  const [areaUnit, setAreaUnit] = useState('SQFT');
  const [builtUpArea, setBuiltUpArea] = useState('');
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');
  const [planFile, setPlanFile] = useState(null);
  const [planFileName, setPlanFileName] = useState('');

  // Family Members State
  const [familyMembers, setFamilyMembers] = useState([
    { type: 'Spouse', name: '', contact: '', email: '', birthdate: '', designApproval: false, financeApproval: false }
  ]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editId) {
      const fetchCustomerDetails = async () => {
        setLoading(true);
        try {
          const res = await API.get(`/customers/${editId}`);
          const data = res.data;
          
          setName(data.name || '');
          setPhone(data.phone || '');
          setAddress(data.address || '');
          setBirthDate(data.birthDate || '');
          setAnniversaryDate(data.anniversaryDate || '');
          
          if (data.project) {
            const proj = data.project;
            const standardTypes = ['Duplex', 'Row house', 'Farm house', 'Residency-Others', 'Hospital', 'Educational Institute', 'Commercial-Others'];
            if (standardTypes.includes(proj.workType)) {
              setWorkType(proj.workType);
              setShowCustomWorkType(false);
            } else {
              setWorkType('others');
              setCustomWorkType(proj.workType);
              setShowCustomWorkType(true);
            }
            setCarpetArea(proj.carpetArea || '');
            setAreaUnit(proj.areaUnit || 'SQFT');
            setBuiltUpArea(proj.builtUpArea || '');
            setBudget(proj.budget || '');
            setTimeline(proj.timeline || '');
          }

          if (data.familyMembers && data.familyMembers.length > 0) {
            setFamilyMembers(data.familyMembers.map(m => ({
              type: m.type || 'Spouse',
              name: m.name || '',
              contact: m.contact || '',
              email: m.email || '',
              birthdate: m.birthdate || '',
              designApproval: m.designApproval || false,
              financeApproval: m.financeApproval || false
            })));
          }
        } catch (err) {
          log.error('Failed to load customer details for edit', err);
        } finally {
          setLoading(false);
        }
      };
      fetchCustomerDetails();
    }
  }, [editId]);

  const handleWorkTypeChange = (e) => {
    const val = e.target.value;
    setWorkType(val);
    if (val === 'others') {
      setShowCustomWorkType(true);
    } else {
      setShowCustomWorkType(false);
      setCustomWorkType('');
    }
  };

  const addFamilyRow = () => {
    setFamilyMembers(prev => [
      ...prev,
      { type: 'Spouse', name: '', contact: '', email: '', birthdate: '', designApproval: false, financeApproval: false }
    ]);
  };

  const removeFamilyRow = (index) => {
    setFamilyMembers(prev => prev.filter((_, i) => i !== index));
  };

  const updateFamilyMember = (index, field, value) => {
    setFamilyMembers(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPlanFile(file);
      setPlanFileName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const typeOfWork = workType === 'others' ? customWorkType : workType;

    // Filter out family rows with empty names
    const filteredFamily = familyMembers.filter(m => m.name.trim() !== '');

    const payload = {
      name,
      phone,
      address,
      birthDate: birthDate || null,
      anniversaryDate: anniversaryDate || null,
      drawingPlanUrl: planFileName || null, // In production, upload file first to S3 and save URL
      familyMembers: filteredFamily,
      project: {
        workType: typeOfWork,
        carpetArea: carpetArea ? parseFloat(carpetArea) : null,
        areaUnit,
        builtUpArea: builtUpArea ? parseFloat(builtUpArea) : null,
        budget: budget ? parseFloat(budget) : null,
        timeline
      }
    };

    try {
      if (editId) {
        await API.put(`/customers/${editId}`, payload);
        alert('Customer details updated successfully!');
        navigate('/quotations');
      } else {
        const res = await API.post('/customers', payload);
        const newCustomerId = res.data.id;
        alert('Customer details saved successfully!');
        navigate(`/customer/${newCustomerId}/create-quotation`);
      }
    } catch (err) {
      log.error('Failed to save customer', err);
      alert('Error saving customer. Verify required fields are filled.');
    } finally {
      setLoading(false);
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
          
          <h2 className="text-primary fw-bold mb-4 border-bottom pb-2">
            <i className="fas fa-user-edit me-2"></i> {editId ? 'Edit Customer & Project Details' : 'Customer & Project Details'}
          </h2>

          {loading && editId ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status"></span>
              <p className="mt-2 text-muted">Retrieving customer data...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              
              {/* Personal Information */}
              <h5 className="mb-3 text-secondary fw-semibold">Personal Information</h5>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label fw-bold text-dark small">Full Name *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold text-dark small">Phone Number *</label>
                  <input 
                    type="tel" 
                    className="form-control" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    required 
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-bold text-dark small">Address</label>
                  <textarea 
                    className="form-control" 
                    rows="2" 
                    value={address} 
                    onChange={e => setAddress(e.target.value)}
                  ></textarea>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold text-dark small">Birth Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={birthDate} 
                    onChange={e => setBirthDate(e.target.value)} 
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold text-dark small">Anniversary Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={anniversaryDate} 
                    onChange={e => setAnniversaryDate(e.target.value)} 
                  />
                </div>

                {/* Family Members Grid */}
                <div className="col-12 mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label fw-bold text-dark small mb-0">Family Members &amp; Approvals</label>
                    <button type="button" className="btn btn-sm btn-outline-primary fw-bold" onClick={addFamilyRow}>
                      <i className="fas fa-plus me-1"></i> Add Member
                    </button>
                  </div>
                  <div className="table-responsive border rounded bg-light p-2">
                    <table className="table table-sm table-borderless mb-0 align-middle">
                      <thead>
                        <tr style={{ fontSize: '11px', borderBottom: '1px solid #dee2e6' }} className="text-secondary">
                          <th>Type</th>
                          <th>Name</th>
                          <th>Contact</th>
                          <th>Email</th>
                          <th style={{ width: '120px' }}>Birthdate</th>
                          <th className="text-center" style={{ width: '70px' }}>Design Appr.</th>
                          <th className="text-center" style={{ width: '70px' }}>Finance Appr.</th>
                          <th style={{ width: '40px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {familyMembers.map((member, index) => (
                          <tr key={index}>
                            <td>
                              <select 
                                className="form-select form-select-sm" 
                                value={member.type} 
                                onChange={e => updateFamilyMember(index, 'type', e.target.value)}
                              >
                                <option value="Spouse">Spouse</option>
                                <option value="Child">Child</option>
                                <option value="Parents">Parents</option>
                                <option value="Siblings">Siblings</option>
                                <option value="Others">Others</option>
                              </select>
                            </td>
                            <td>
                              <input 
                                type="text" 
                                className="form-control form-select-sm" 
                                placeholder="Name" 
                                value={member.name}
                                onChange={e => updateFamilyMember(index, 'name', e.target.value)}
                              />
                            </td>
                            <td>
                              <input 
                                type="tel" 
                                className="form-control form-select-sm" 
                                placeholder="Contact" 
                                value={member.contact}
                                onChange={e => updateFamilyMember(index, 'contact', e.target.value)}
                              />
                            </td>
                            <td>
                              <input 
                                type="email" 
                                className="form-control form-select-sm" 
                                placeholder="Email" 
                                value={member.email}
                                onChange={e => updateFamilyMember(index, 'email', e.target.value)}
                              />
                            </td>
                            <td>
                              <input 
                                type="date" 
                                className="form-control form-select-sm" 
                                value={member.birthdate}
                                onChange={e => updateFamilyMember(index, 'birthdate', e.target.value)}
                              />
                            </td>
                            <td className="text-center">
                              <input 
                                className="form-check-input" 
                                type="checkbox" 
                                checked={member.designApproval}
                                onChange={e => updateFamilyMember(index, 'designApproval', e.target.checked)}
                              />
                            </td>
                            <td className="text-center">
                              <input 
                                className="form-check-input" 
                                type="checkbox" 
                                checked={member.financeApproval}
                                onChange={e => updateFamilyMember(index, 'financeApproval', e.target.checked)}
                              />
                            </td>
                            <td>
                              <button 
                                type="button" 
                                className="btn btn-link btn-sm text-danger p-0" 
                                onClick={() => removeFamilyRow(index)}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Project Details */}
              <h5 className="mb-3 text-secondary fw-semibold mt-4">Project Details</h5>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold text-dark small">Type of Work *</label>
                  <select className="form-select" value={workType} onChange={handleWorkTypeChange} required>
                    <option value="">Choose Category...</option>
                    <optgroup label="Residency">
                      <option value="Duplex">Duplex</option>
                      <option value="Row house">Row house</option>
                      <option value="Farm house">Farm house</option>
                      <option value="Residency-Others">Others (Residency)</option>
                    </optgroup>
                    <optgroup label="Commercial">
                      <option value="Hospital">Hospital</option>
                      <option value="Educational Institute">Educational Institute</option>
                      <option value="Commercial-Others">Others (Commercial)</option>
                    </optgroup>
                    <option value="others">Other (Specify)</option>
                  </select>
                  {showCustomWorkType && (
                    <input 
                      type="text" 
                      className="form-control mt-2" 
                      placeholder="Specify Work Type"
                      value={customWorkType}
                      onChange={e => setCustomWorkType(e.target.value)}
                      required
                    />
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold text-dark small">Carpet Area</label>
                  <div className="input-group">
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="Area" 
                      value={carpetArea}
                      onChange={e => setCarpetArea(e.target.value)}
                    />
                    <select className="form-select" style={{ maxWidth: '100px' }} value={areaUnit} onChange={e => setAreaUnit(e.target.value)}>
                      <option value="SQFT">SQ.FT</option>
                      <option value="SQMT">SQ.MT</option>
                    </select>
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold text-dark small">Built-up Area</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={builtUpArea} 
                    onChange={e => setBuiltUpArea(e.target.value)} 
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold text-dark small">Client Budget (INR)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="₹" 
                    value={budget} 
                    onChange={e => setBudget(e.target.value)} 
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold text-dark small">Expected Timeline</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. 3 months, Dec 2026" 
                    value={timeline} 
                    onChange={e => setTimeline(e.target.value)} 
                  />
                </div>

                <div className="col-12 mt-3">
                  <label className="form-label fw-bold text-dark small">Upload Drawing / Plan</label>
                  <div 
                    className="border border-2 border-dashed rounded p-4 text-center bg-light" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => document.getElementById('fileInput').click()}
                  >
                    <i className="fas fa-cloud-upload-alt fa-2x text-secondary mb-2"></i>
                    <p className="mb-0 text-muted small">Click to upload or drag &amp; drop plan files</p>
                    <input 
                      type="file" 
                      id="fileInput" 
                      accept="image/*,application/pdf" 
                      style={{ display: 'none' }} 
                      onChange={handleFileSelect}
                    />
                    {planFileName && <p className="mt-2 text-primary small fw-semibold">Selected: {planFileName}</p>}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <button 
                type="submit" 
                className="btn btn-primary w-100 fw-bold py-3 mt-4" 
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  fontSize: '16px',
                  borderRadius: '6px'
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving details...
                  </>
                ) : editId ? (
                  <>Update Customer Details <i className="fas fa-save ms-2"></i></>
                ) : (
                  <>ADD QUOTATION <i className="fas fa-arrow-right ms-2"></i></>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

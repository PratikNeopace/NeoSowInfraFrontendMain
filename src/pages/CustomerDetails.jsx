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
  const [quotationType, setQuotationType] = useState('');
  const [planFile, setPlanFile] = useState(null);
  const [planFileName, setPlanFileName] = useState('');
  const [description, setDescription] = useState('');

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
          console.error('Failed to load customer details for edit', err);
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

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset the form data?")) {
      setName('');
      setPhone('');
      setAddress('');
      setBirthDate('');
      setAnniversaryDate('');
      setWorkType('');
      setCarpetArea('');
      setBuiltUpArea('');
      setBudget('');
      setTimeline('');
      setQuotationType('');
      setPlanFile(null);
      setPlanFileName('');
      setDescription('');
      setFamilyMembers([
        { type: 'Spouse', name: '', contact: '', email: '', birthdate: '', designApproval: false, financeApproval: false }
      ]);
    }
  };

  const handleSubmit = async (e, saveAsDraft = false) => {
    if (e) e.preventDefault();
    setLoading(true);

    const typeOfWork = workType === 'others' ? customWorkType : workType;
    const filteredFamily = familyMembers.filter(m => m.name.trim() !== '');

    const payload = {
      name,
      phone,
      address: address || "Not Specified",
      birthDate: birthDate || null,
      anniversaryDate: anniversaryDate || null,
      drawingPlanUrl: planFileName || null,
      familyMembers: filteredFamily,
      project: {
        workType: typeOfWork || "Architectural",
        carpetArea: carpetArea ? parseFloat(carpetArea) : null,
        areaUnit,
        builtUpArea: builtUpArea ? parseFloat(builtUpArea) : null,
        budget: budget ? parseFloat(budget) : null,
        timeline: timeline || "30"
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
        alert(saveAsDraft ? 'Customer details saved as Draft!' : 'Customer details saved successfully!');
        if (saveAsDraft) {
          navigate('/quotations');
        } else {
          navigate(`/customer/${newCustomerId}/create-quotation`);
        }
      }
    } catch (err) {
      console.error('Failed to save customer', err);
      alert('Error saving customer. Verify required fields are filled.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    }}>
      <Navbar />

      <div className="container py-4 px-4" style={{ maxWidth: '1200px' }}>
        {/* Navigation & Header Tools */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <button 
            type="button" 
            className="btn btn-link text-decoration-none text-secondary d-flex align-items-center gap-1 p-0 fw-semibold"
            style={{ fontSize: '15px' }}
            onClick={() => navigate(-1)}
          >
            <i className="fas fa-chevron-left"></i> Back
          </button>
          
          <div className="d-flex align-items-center gap-2">
            <button 
              className="btn btn-outline-secondary btn-sm px-3 py-2 fw-semibold bg-white text-dark border d-flex align-items-center gap-2"
              style={{ borderRadius: '8px', fontSize: '14px' }}
              onClick={() => alert('Import configuration is under development.')}
            >
              <i className="fas fa-file-import text-muted"></i> Import
            </button>
            <button 
              className="btn btn-light btn-sm p-2 border" 
              style={{ borderRadius: '8px', width: '38px', height: '38px' }}
              onClick={() => alert('Quick Actions is under development.')}
            >
              <i className="fas fa-ellipsis-h text-secondary"></i>
            </button>
          </div>
        </div>

        {/* Customer Form Card Container */}
        <div className="card border-0 shadow-sm bg-white mx-auto overflow-hidden mb-5" style={{ borderRadius: '16px', maxWidth: '880px' }}>
          
          {/* Main Card Header */}
          <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center bg-primary-subtle" 
                style={{ width: '48px', height: '48px', color: '#2563eb' }}
              >
                <i className="fas fa-user-plus fs-5"></i>
              </div>
              <div>
                <h4 className="fw-bold text-dark mb-0" style={{ fontSize: '20px' }}>Customer &amp; Project Details</h4>
                <span className="text-secondary" style={{ fontSize: '13px' }}>Highlight your previous workplaces on your profile.</span>
              </div>
            </div>
            <button 
              type="button" 
              className="btn-close text-secondary" 
              onClick={() => navigate(-1)}
            ></button>
          </div>

          <div className="card-body p-4 p-md-5">
            {loading && editId ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2 text-muted">Retrieving customer data...</p>
              </div>
            ) : (
              <form onSubmit={(e) => handleSubmit(e, false)}>
                
                {/* Personal Information */}
                <h5 className="fw-bold text-dark border-bottom pb-2 mb-4" style={{ fontSize: '16px' }}>Personal Information</h5>
                
                <div className="row g-4 mb-5">
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-secondary small mb-1">Full Name *</label>
                    <input 
                      type="text" 
                      className="form-control px-3 border" 
                      placeholder="Enter your Name" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      required 
                      style={{ height: '44px', borderRadius: '8px', fontSize: '14px' }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-secondary small mb-1">Phone Number *</label>
                    <div className="position-relative">
                      <input 
                        type="tel" 
                        className="form-control ps-5 border" 
                        placeholder="Enter Phone Number" 
                        value={phone} 
                        onChange={e => setPhone(e.target.value)} 
                        required 
                        style={{ height: '44px', borderRadius: '8px', fontSize: '14px' }}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-secondary small mb-1">Birth Date</label>
                    <input 
                      type="date" 
                      className="form-control px-3 border" 
                      value={birthDate} 
                      onChange={e => setBirthDate(e.target.value)} 
                      style={{ height: '44px', borderRadius: '8px', fontSize: '14px', color: birthDate ? '#000' : '#9ca3af' }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-secondary small mb-1">Anniversary Date</label>
                    <input 
                      type="date" 
                      className="form-control px-3 border" 
                      value={anniversaryDate} 
                      onChange={e => setAnniversaryDate(e.target.value)} 
                      style={{ height: '44px', borderRadius: '8px', fontSize: '14px', color: anniversaryDate ? '#000' : '#9ca3af' }}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-bold text-secondary small mb-1">Address</label>
                    <textarea 
                      className="form-control p-3 border" 
                      rows="2" 
                      placeholder="Enter site address details..."
                      value={address} 
                      onChange={e => setAddress(e.target.value)}
                      style={{ borderRadius: '8px', fontSize: '14px' }}
                    ></textarea>
                  </div>
                </div>

                {/* Family Members & Approvals Grid */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold text-dark mb-0" style={{ fontSize: '16px' }}>Family Members &amp; Approvals</h5>
                  <button 
                    type="button" 
                    className="btn btn-outline-primary btn-sm px-3 fw-bold rounded-pill" 
                    onClick={addFamilyRow}
                    style={{ fontSize: '13px' }}
                  >
                    + Add Member
                  </button>
                </div>

                <div className="table-responsive bg-light p-2 rounded border mb-5">
                  <table className="table table-sm table-borderless mb-0 align-middle" style={{ fontSize: '13px' }}>
                    <thead>
                      <tr className="text-secondary border-bottom" style={{ fontSize: '11px' }}>
                        <th className="py-2">TYPE</th>
                        <th className="py-2">NAME</th>
                        <th className="py-2">CONTACT</th>
                        <th className="py-2">EMAIL</th>
                        <th className="py-2" style={{ width: '130px' }}>BIRTHDATE</th>
                        <th className="py-2 text-center" style={{ width: '75px' }}>DESIGN APPR.</th>
                        <th className="py-2 text-center" style={{ width: '75px' }}>FINANCE APPR.</th>
                        <th className="py-2" style={{ width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {familyMembers.map((member, index) => (
                        <tr key={index}>
                          <td className="py-2">
                            <select 
                              className="form-select form-select-sm border" 
                              value={member.type} 
                              onChange={e => updateFamilyMember(index, 'type', e.target.value)}
                              style={{ borderRadius: '6px' }}
                            >
                              <option value="Spouse">Spouse</option>
                              <option value="Child">Child</option>
                              <option value="Parents">Parents</option>
                              <option value="Siblings">Siblings</option>
                              <option value="Others">Others</option>
                            </select>
                          </td>
                          <td className="py-2">
                            <input 
                              type="text" 
                              className="form-control form-control-sm border" 
                              placeholder="Name" 
                              value={member.name}
                              onChange={e => updateFamilyMember(index, 'name', e.target.value)}
                              style={{ borderRadius: '6px' }}
                            />
                          </td>
                          <td className="py-2">
                            <input 
                              type="tel" 
                              className="form-control form-control-sm border" 
                              placeholder="Contact" 
                              value={member.contact}
                              onChange={e => updateFamilyMember(index, 'contact', e.target.value)}
                              style={{ borderRadius: '6px' }}
                            />
                          </td>
                          <td className="py-2">
                            <input 
                              type="email" 
                              className="form-control form-control-sm border" 
                              placeholder="Email" 
                              value={member.email}
                              onChange={e => updateFamilyMember(index, 'email', e.target.value)}
                              style={{ borderRadius: '6px' }}
                            />
                          </td>
                          <td className="py-2">
                            <input 
                              type="date" 
                              className="form-control form-control-sm border" 
                              value={member.birthdate}
                              onChange={e => updateFamilyMember(index, 'birthdate', e.target.value)}
                              style={{ borderRadius: '6px' }}
                            />
                          </td>
                          <td className="py-2 text-center">
                            <input 
                              className="form-check-input border" 
                              type="checkbox" 
                              checked={member.designApproval}
                              onChange={e => updateFamilyMember(index, 'designApproval', e.target.checked)}
                            />
                          </td>
                          <td className="py-2 text-center">
                            <input 
                              className="form-check-input border" 
                              type="checkbox" 
                              checked={member.financeApproval}
                              onChange={e => updateFamilyMember(index, 'financeApproval', e.target.checked)}
                            />
                          </td>
                          <td className="py-2 text-center">
                            <button 
                              type="button" 
                              className="btn btn-link btn-sm text-danger p-0 border-0" 
                              onClick={() => removeFamilyRow(index)}
                            >
                              <i className="fas fa-times fs-6"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Project Details Section */}
                <h5 className="fw-bold text-dark border-bottom pb-2 mb-4" style={{ fontSize: '16px' }}>Project Details</h5>
                
                <div className="row g-4 mb-5">
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-secondary small mb-1">Type of Work *</label>
                    <select 
                      className="form-select px-3 border" 
                      value={workType} 
                      onChange={handleWorkTypeChange} 
                      required 
                      style={{ height: '44px', borderRadius: '8px', fontSize: '14px' }}
                    >
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
                        className="form-control mt-2 border" 
                        placeholder="Specify Work Type"
                        value={customWorkType}
                        onChange={e => setCustomWorkType(e.target.value)}
                        required
                        style={{ height: '44px', borderRadius: '8px', fontSize: '14px' }}
                      />
                    )}
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-secondary small mb-1">Carpet Area *</label>
                    <div className="input-group">
                      <input 
                        type="number" 
                        className="form-control px-3 border" 
                        placeholder="Area" 
                        value={carpetArea}
                        onChange={e => setCarpetArea(e.target.value)}
                        required
                        style={{ height: '44px', borderRadius: '8px 0 0 8px', fontSize: '14px' }}
                      />
                      <span className="input-group-text bg-primary-subtle text-primary fw-bold px-3 border-0" style={{ fontSize: '13px', borderRadius: '0 8px 8px 0' }}>SQ. FT</span>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold text-secondary small mb-1">Built-up Area</label>
                    <input 
                      type="number" 
                      className="form-control px-3 border" 
                      value={builtUpArea} 
                      onChange={e => setBuiltUpArea(e.target.value)} 
                      style={{ height: '44px', borderRadius: '8px', fontSize: '14px' }}
                    />
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-secondary small mb-1">Client Budget (INR)</label>
                    <input 
                      type="number" 
                      className="form-control px-3 border" 
                      placeholder="₹" 
                      value={budget} 
                      onChange={e => setBudget(e.target.value)} 
                      style={{ height: '44px', borderRadius: '8px', fontSize: '14px' }}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold text-secondary small mb-1">Expected Timeline</label>
                    <input 
                      type="text" 
                      className="form-control px-3 border" 
                      placeholder="eg : 3 months, Dec 2023" 
                      value={timeline} 
                      onChange={e => setTimeline(e.target.value)} 
                      style={{ height: '44px', borderRadius: '8px', fontSize: '14px' }}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold text-secondary small mb-1">Quotation Type</label>
                    <select 
                      className="form-select px-3 border" 
                      value={quotationType} 
                      onChange={e => setQuotationType(e.target.value)} 
                      style={{ height: '44px', borderRadius: '8px', fontSize: '14px' }}
                    >
                      <option value="">Choose Type...</option>
                      <option value="Budget quote">Budget Quote</option>
                      <option value="Premium range quote">Premium Range Quote</option>
                      <option value="ultra luxury quote">Ultra Luxury Quote</option>
                    </select>
                  </div>
                </div>

                {/* Upload Drawing Plan Section */}
                <div className="row g-4 mb-5">
                  <div className="col-12 mt-3">
                    <label className="form-label fw-bold text-secondary small mb-1">Upload Drawing / Plan</label>
                    <p className="text-secondary small mb-2" style={{ fontSize: '12px' }}>Drag and drop document to upload in box</p>
                    <div 
                      className="border border-2 border-dashed rounded-4 p-5 text-center bg-white" 
                      style={{ cursor: 'pointer', borderColor: '#cbd5e1' }}
                      onClick={() => document.getElementById('drawingPlanInput').click()}
                    >
                      <div className="mb-3 text-primary">
                        <i className="fas fa-cloud-upload-alt fa-3x"></i>
                      </div>
                      <p className="fw-semibold text-dark mb-1" style={{ fontSize: '14px' }}>Choose a file or drag &amp; drop it here.</p>
                      <p className="text-secondary small mb-3" style={{ fontSize: '12px' }}>txt, docx, pdf, jpeg, xlsx - Up to 50MB</p>
                      <button 
                        type="button"
                        className="btn btn-outline-secondary btn-sm px-4 py-2 bg-white fw-semibold"
                        style={{ borderRadius: '8px' }}
                      >
                        Browse files
                      </button>
                      <input 
                        type="file" 
                        id="drawingPlanInput" 
                        accept="image/*,application/pdf,.xlsx,.docx,.txt" 
                        style={{ display: 'none' }} 
                        onChange={handleFileSelect}
                      />
                      {planFileName && <p className="mt-3 text-primary small fw-semibold">Selected: {planFileName}</p>}
                    </div>
                  </div>

                  {/* Description text input area */}
                  <div className="col-12 mt-3">
                    <label className="form-label fw-bold text-secondary small mb-1">Description</label>
                    <textarea 
                      className="form-control p-3 border" 
                      rows="3" 
                      placeholder="Descript your experience here!"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      style={{ borderRadius: '8px', fontSize: '14px' }}
                    ></textarea>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="d-flex justify-content-between align-items-center border-top pt-4 mt-4 flex-wrap gap-3">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary px-4 py-2 fw-semibold bg-white text-dark" 
                    onClick={() => handleSubmit(null, true)}
                    disabled={loading}
                    style={{ borderRadius: '8px', height: '42px', fontSize: '14px' }}
                  >
                    Save as Draft
                  </button>

                  <div className="d-flex align-items-center gap-3">
                    <button 
                      type="button" 
                      className="btn btn-light px-4 py-2 fw-semibold border" 
                      onClick={handleReset}
                      style={{ borderRadius: '8px', height: '42px', fontSize: '14px', color: '#64748b' }}
                    >
                      Reset Data
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary px-4 py-2 fw-semibold" 
                      disabled={loading}
                      style={{ borderRadius: '8px', height: '42px', fontSize: '14px', backgroundColor: '#2563eb', border: 'none' }}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </div>

              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

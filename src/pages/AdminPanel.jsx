import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import API from '../services/api';

export default function AdminPanel() {
  const currentUserRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
  const isSuperAdmin = currentUserRoles.includes('ROLE_SUPER_ADMIN');
  const isAdmin = currentUserRoles.includes('ROLE_ADMIN');

  // Active Tab: users, admins, approvals, boq
  const [activeTab, setActiveTab] = useState('users');

  // Users State
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(0);
  const [usersTotalPages, setUsersTotalPages] = useState(0);

  // New User Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoles, setSelectedRoles] = useState(['ROLE_USER']);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Admins State (Super Admin only)
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminsPage, setAdminsPage] = useState(0);
  const [adminsTotalPages, setAdminsTotalPages] = useState(0);

  // Approvals State
  const [approvals, setApprovals] = useState([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [approvalsPage, setApprovalsPage] = useState(0);
  const [approvalsTotalPages, setApprovalsTotalPages] = useState(0);
  const [submitApprovalType, setSubmitApprovalType] = useState('RATE_CHANGE');
  const [submitApprovalLoading, setSubmitApprovalLoading] = useState(false);

  // Pending BOQ Items State (Super Admin only)
  const [pendingBoqItems, setPendingBoqItems] = useState([]);
  const [pendingBoqLoading, setPendingBoqLoading] = useState(false);
  const [pendingBoqPage, setPendingBoqPage] = useState(0);
  const [pendingBoqTotalPages, setPendingBoqTotalPages] = useState(0);

  // BOQ State
  const [boqJobs, setBoqJobs] = useState([]);
  const [boqLoading, setBoqLoading] = useState(false);
  const [boqPage, setBoqPage] = useState(0);
  const [boqTotalPages, setBoqTotalPages] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [boqSubTab, setBoqSubTab] = useState('import'); // 'import', 'manual', or 'imported_data'

  // Imported BOQ Data State
  const [importedItems, setImportedItems] = useState([]);
  const [importedSearch, setImportedSearch] = useState('');
  const [importedPage, setImportedPage] = useState(0);
  const [importedTotalPages, setImportedTotalPages] = useState(0);
  const [loadingImported, setLoadingImported] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editMainHeading, setEditMainHeading] = useState('');
  const [editSubHeading, setEditSubHeading] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editUnit, setEditUnit] = useState('SQ.FT.');
  const [editRate, setEditRate] = useState('');
  const [editStatus, setEditStatus] = useState('APPROVED');
  const [updatingItem, setUpdatingItem] = useState(false);

  // Manual BOQ Form State
  const [manualMainHeading, setManualMainHeading] = useState('');
  const [manualSubHeading, setManualSubHeading] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualUnit, setManualUnit] = useState('SQ.FT.');
  const [manualRate, setManualRate] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState('');
  const [existingApprovedItems, setExistingApprovedItems] = useState([]);


  // Fetch Users
  const fetchUsers = async (pageNumber = 0) => {
    setUsersLoading(true);
    try {
      const res = await API.get('/admin/users', {
        params: { page: pageNumber, size: 10 }
      });
      setUsers(res.data.content || []);
      setUsersTotalPages(res.data.totalPages || 0);
      setUsersPage(pageNumber);
    } catch (err) {
      console.error('Failed to fetch user list', err);
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch Admins
  const fetchAdmins = async (pageNumber = 0) => {
    if (!isSuperAdmin) return;
    setAdminsLoading(true);
    try {
      const res = await API.get('/super-admin/admins', {
        params: { page: pageNumber, size: 10 }
      });
      setAdmins(res.data.content || []);
      setAdminsTotalPages(res.data.totalPages || 0);
      setAdminsPage(pageNumber);
    } catch (err) {
      console.error('Failed to fetch admin list', err);
    } finally {
      setAdminsLoading(false);
    }
  };

  // Fetch Approvals
  const fetchApprovals = async (pageNumber = 0) => {
    setApprovalsLoading(true);
    try {
      const endpoint = isSuperAdmin ? '/super-admin/approvals' : '/admin/approvals';
      const res = await API.get(endpoint, {
        params: { page: pageNumber, size: 10 }
      });
      setApprovals(res.data.content || []);
      setApprovalsTotalPages(res.data.totalPages || 0);
      setApprovalsPage(pageNumber);
    } catch (err) {
      console.error('Failed to fetch approvals list', err);
    } finally {
      setApprovalsLoading(false);
    }
  };

  // Fetch BOQ Jobs
  const fetchBoqJobs = async (pageNumber = 0) => {
    setBoqLoading(true);
    try {
      const res = await API.get('/boq/imports', {
        params: { page: pageNumber, size: 10 }
      });
      setBoqJobs(res.data.content || []);
      setBoqTotalPages(res.data.totalPages || 0);
      setBoqPage(pageNumber);
    } catch (err) {
      console.error('Failed to fetch BOQ jobs', err);
    } finally {
      setBoqLoading(false);
    }
  };

  // Fetch Imported BOQ Items
  const fetchImportedItems = async (pageNumber = 0, searchQuery = importedSearch) => {
    setLoadingImported(true);
    try {
      const res = await API.get('/boq/items', {
        params: { page: pageNumber, size: 10, search: searchQuery }
      });
      setImportedItems(res.data.content || []);
      setImportedTotalPages(res.data.totalPages || 0);
      setImportedPage(pageNumber);
    } catch (err) {
      console.error('Failed to fetch imported BOQ items', err);
    } finally {
      setLoadingImported(false);
    }
  };

  const handleEditClick = (item) => {
    setEditItem(item);
    setEditMainHeading(item.mainHeading || '');
    setEditSubHeading(item.subHeading || '');
    setEditDescription(item.description || '');
    setEditUnit(item.unit || 'SQ.FT.');
    setEditRate(item.rate || '');
    setEditStatus(item.status || 'APPROVED');
  };

  const handleUpdateBoqItem = async (e) => {
    e.preventDefault();
    if (!editItem) return;
    setUpdatingItem(true);
    try {
      await API.put(`/boq/${editItem.id}`, {
        mainHeading: editMainHeading,
        subHeading: editSubHeading,
        description: editDescription,
        unit: editUnit,
        rate: parseFloat(editRate) || 0,
        status: editStatus
      });
      alert('BOQ item updated successfully!');
      setEditItem(null);
      fetchImportedItems(importedPage);
    } catch (err) {
      console.error('Failed to update BOQ item', err);
      alert('Error updating BOQ item. Check constraints.');
    } finally {
      setUpdatingItem(false);
    }
  };

  const handleDeleteBoqItem = async (id, subHeading) => {
    if (window.confirm(`Are you sure you want to delete the BOQ item "${subHeading}"? This action cannot be undone.`)) {
      try {
        await API.delete(`/boq/${id}`);
        alert('BOQ item deleted successfully.');
        const newPage = importedItems.length === 1 && importedPage > 0 ? importedPage - 1 : importedPage;
        fetchImportedItems(newPage);
      } catch (err) {
        console.error('Failed to delete BOQ item', err);
        alert('Error deleting BOQ item.');
      }
    }
  };

  // Fetch Pending BOQ Items
  const fetchPendingBoqItems = async (pageNumber = 0) => {
    if (!isSuperAdmin) return;
    setPendingBoqLoading(true);
    try {
      const res = await API.get('/boq/pending', {
        params: { page: pageNumber, size: 10 }
      });
      setPendingBoqItems(res.data.content || []);
      setPendingBoqTotalPages(res.data.totalPages || 0);
      setPendingBoqPage(pageNumber);
    } catch (err) {
      console.error('Failed to fetch pending BOQ items', err);
    } finally {
      setPendingBoqLoading(false);
    }
  };

  // Approve BOQ Item
  const handleApproveBoqItem = async (id) => {
    if (window.confirm('Are you sure you want to approve this BOQ item rate?')) {
      try {
        await API.post(`/boq/${id}/approve`);
        alert('BOQ item approved successfully!');
        fetchPendingBoqItems(pendingBoqPage);
      } catch (err) {
        console.error('Failed to approve BOQ item', err);
        alert('Error approving BOQ item.');
      }
    }
  };

  // Reject BOQ Item
  const handleRejectBoqItem = async (id) => {
    if (window.confirm('Are you sure you want to reject this BOQ item rate?')) {
      try {
        await API.post(`/boq/${id}/reject`);
        alert('BOQ item rejected successfully!');
        fetchPendingBoqItems(pendingBoqPage);
      } catch (err) {
        console.error('Failed to reject BOQ item', err);
        alert('Error rejecting BOQ item.');
      }
    }
  };

  const fetchApprovedBoq = async () => {
    try {
      const res = await API.get('/boq/approved');
      setExistingApprovedItems(res.data || []);
    } catch (err) {
      console.error('Failed to fetch approved BOQ categories', err);
    }
  };

  // Refresh tab data
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers(0);
    } else if (activeTab === 'admins' && isSuperAdmin) {
      fetchAdmins(0);
    } else if (activeTab === 'approvals') {
      fetchApprovals(0);
      if (isSuperAdmin) {
        fetchPendingBoqItems(0);
      }
    } else if (activeTab === 'boq') {
      if (boqSubTab === 'import') {
        fetchBoqJobs(0);
      } else if (boqSubTab === 'manual') {
        fetchApprovedBoq();
      } else if (boqSubTab === 'imported_data') {
        fetchImportedItems(0);
      }
    }
  }, [activeTab, boqSubTab]);


  // Actions
  const handleToggleUserStatus = async (id) => {
    const targetUser = users.find(u => u.id === id);
    let securityCode = null;
    if (targetUser && targetUser.roles.includes('ROLE_SUPER_ADMIN') && targetUser.enabled) {
      securityCode = prompt('Enter security code to block Super Admin:');
      if (securityCode === null) {
        return; // cancel action
      }
      if (securityCode !== '1998') {
        alert('Invalid security code. Action aborted.');
        return;
      }
    }

    try {
      await API.put(`/admin/users/${id}/toggle`, null, {
        params: securityCode ? { securityCode } : {}
      });
      fetchUsers(usersPage);
    } catch (err) {
      console.error('Failed to toggle user status', err);
      const errMsg = err.response?.data?.message || 'Error updating user status.';
      alert(errMsg);
    }
  };

  const handleToggleAdminStatus = async (adminId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    const targetAdmin = admins.find(a => a.id === adminId);
    let securityCode = null;
    if (targetAdmin && targetAdmin.roles.includes('ROLE_SUPER_ADMIN') && newStatus === 'BLOCKED') {
      securityCode = prompt('Enter security code to block Super Admin:');
      if (securityCode === null) {
        return; // cancel action
      }
      if (securityCode !== '1998') {
        alert('Invalid security code. Action aborted.');
        return;
      }
    }

    if (window.confirm(`Are you sure you want to change this Admin's status to ${newStatus}?`)) {
      try {
        await API.put(`/super-admin/admins/${adminId}/status`, null, {
          params: { 
            status: newStatus,
            ...(securityCode ? { securityCode } : {})
          }
        });
        alert(`Admin status updated to ${newStatus}`);
        fetchAdmins(adminsPage);
      } catch (err) {
        console.error('Failed to toggle admin status', err);
        const errMsg = err.response?.data?.message || 'Error updating admin status.';
        alert(errMsg);
      }
    }
  };

  const handleDeleteUser = async (id, emailStr) => {
    if (window.confirm(`Are you sure you want to permanently delete user "${emailStr}"?`)) {
      try {
        await API.delete(`/admin/users/${id}`);
        alert('User deleted successfully.');
        fetchUsers(usersPage);
      } catch (err) {
        console.error('Failed to delete user', err);
        alert('Error deleting user. Only SUPER_ADMIN can delete user accounts.');
      }
    }
  };

  const handleRoleCheckbox = (role) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(prev => prev.filter(r => r !== role));
    } else {
      setSelectedRoles(prev => [...prev, role]);
    }
  };

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email) {
      setFormError('Email is required');
      return;
    }
    if (!password || password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }
    if (selectedRoles.length === 0) {
      setFormError('Select at least one role');
      return;
    }

    setFormLoading(true);
    try {
      await API.post('/admin/users', {
        email,
        password,
        roles: selectedRoles
      });
      alert('User registered successfully!');
      setEmail('');
      setPassword('');
      setSelectedRoles(['ROLE_USER']);
      fetchUsers(usersPage);
    } catch (err) {
      console.error('Failed to create user', err);
      if (err.response?.data?.message) {
        setFormError(err.response.data.message);
      } else {
        setFormError('Failed to register user. Verify credentials and permissions.');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Approval Actions
  const handleProcessApproval = async (id, statusStr) => {
    if (window.confirm(`Are you sure you want to ${statusStr.toLowerCase()} this approval request?`)) {
      try {
        await API.put(`/super-admin/approvals/${id}`, null, {
          params: { status: statusStr }
        });
        alert(`Approval request ${statusStr.toLowerCase()} successfully!`);
        fetchApprovals(approvalsPage);
      } catch (err) {
        console.error('Failed to process approval', err);
        alert('Error processing approval request.');
      }
    }
  };

  const handleSubmitApproval = async (e) => {
    e.preventDefault();
    setSubmitApprovalLoading(true);
    try {
      await API.post('/admin/approvals', {
        type: submitApprovalType
      });
      alert('Approval request submitted successfully!');
      fetchApprovals(0);
    } catch (err) {
      console.error('Failed to submit approval', err);
      alert('Error submitting approval request.');
    } finally {
      setSubmitApprovalLoading(false);
    }
  };

  // BOQ Actions
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setUploadLoading(true);
    try {
      await API.post('/boq/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('BOQ import job started successfully!');
      setSelectedFile(null);
      if (document.getElementById('boqFileInput')) {
        document.getElementById('boqFileInput').value = '';
      }
      fetchBoqJobs(0);
    } catch (err) {
      console.error('Failed to upload BOQ file', err);
      if (err.response?.data?.message) {
        alert('Upload failed: ' + err.response.data.message);
      } else {
        alert('Upload failed. Please check the file formatting.');
      }
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await API.get('/boq/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'boq_import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download template', err);
      alert('Error downloading template');
    }
  };

  const handleDownloadSummary = async (jobId) => {
    try {
      const response = await API.get(`/boq/imports/${jobId}/summary`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `boq_import_summary_${jobId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download summary report', err);
      alert('Error downloading summary report');
    }
  };

  const handleCreateManualBoqSubmit = async (e) => {
    e.preventDefault();
    setManualError('');

    if (!manualMainHeading.trim()) {
      setManualError('Main Heading (Category Type) is required.');
      return;
    }
    if (!manualSubHeading.trim()) {
      setManualError('Subheading (Category Name) is required.');
      return;
    }
    if (!manualUnit) {
      setManualError('Unit is required.');
      return;
    }
    if (manualRate === '' || parseFloat(manualRate) < 0) {
      setManualError('Rate must be a non-negative number.');
      return;
    }

    setManualSubmitting(true);
    try {
      await API.post('/boq/manual', {
        mainHeading: manualMainHeading,
        subHeading: manualSubHeading,
        description: manualDescription,
        unit: manualUnit,
        rate: parseFloat(manualRate)
      });
      alert('BOQ item created successfully!');
      setManualMainHeading('');
      setManualSubHeading('');
      setManualDescription('');
      setManualRate('');
      fetchApprovedBoq();
    } catch (err) {
      console.error('Failed to create manual BOQ item', err);
      const errMsg = err.response?.data?.message || 'Error creating manual BOQ item.';
      setManualError(errMsg);
    } finally {
      setManualSubmitting(false);
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
        {/* Tab Controls */}
        <div className="mb-4 d-flex flex-wrap gap-2">
          <button 
            className={`btn px-4 fw-bold ${activeTab === 'users' ? 'btn-light text-primary shadow' : 'btn-outline-light'}`}
            onClick={() => setActiveTab('users')}
          >
            👥 System Users
          </button>
          
          {isSuperAdmin && (
            <button 
              className={`btn px-4 fw-bold ${activeTab === 'admins' ? 'btn-light text-primary shadow' : 'btn-outline-light'}`}
              onClick={() => setActiveTab('admins')}
            >
              🔒 System Admins
            </button>
          )}

          <button 
            className={`btn px-4 fw-bold ${activeTab === 'approvals' ? 'btn-light text-primary shadow' : 'btn-outline-light'}`}
            onClick={() => setActiveTab('approvals')}
          >
            ✔️ Approvals List
          </button>

          <button 
            className={`btn px-4 fw-bold ${activeTab === 'boq' ? 'btn-light text-primary shadow' : 'btn-outline-light'}`}
            onClick={() => setActiveTab('boq')}
          >
            📊 BOQ Import Portal
          </button>
        </div>

        {/* Tab Contents */}
        <div className="row g-4">
          
          {/* USER MANAGEMENT TAB */}
          {activeTab === 'users' && (
            <>
              <div className="col-lg-8">
                <div className="card border-0 shadow-lg p-4 bg-white" style={{ borderRadius: '12px', minHeight: '500px' }}>
                  <h3 className="text-primary fw-bold mb-4 border-bottom pb-2">
                    <i className="fas fa-users-cog me-2"></i> User Directory
                  </h3>

                  {usersLoading ? (
                    <div className="text-center py-5">
                      <span className="spinner-border text-primary" role="status"></span>
                      <p className="mt-2 text-muted small">Loading user accounts...</p>
                    </div>
                  ) : users.length === 0 ? (
                    <p className="text-muted text-center py-5">No user records found.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-4">
                        <thead>
                          <tr className="table-primary text-secondary small">
                            <th className="ps-3">Email Address</th>
                            <th>Roles</th>
                            <th>Registered</th>
                            <th className="text-center">Status</th>
                            <th className="text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((u) => {
                             const isSubUser = u.parentAdminId && u.roles && u.roles.includes('ROLE_USER') && !u.roles.includes('ROLE_ADMIN') && !u.roles.includes('ROLE_SUPER_ADMIN');
                             return (
                               <tr key={u.id} className="small">
                                 <td className={isSubUser ? "ps-5 text-secondary" : "ps-3 fw-bold text-dark"}>
                                   {isSubUser && <span className="text-muted me-2">└─</span>}
                                   {u.email}
                                 </td>
                              <td>
                                {u.roles.map(r => (
                                  <span key={r} className={`badge me-1 ${r === 'ROLE_SUPER_ADMIN' ? 'bg-danger' : r === 'ROLE_ADMIN' ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                                    {r.replace('ROLE_', '')}
                                  </span>
                                ))}
                              </td>
                              <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                              <td className="text-center">
                                <span className={`badge ${u.enabled ? 'bg-success' : 'bg-dark'}`}>
                                  {u.enabled ? 'ACTIVE' : 'BLOCKED'}
                                </span>
                              </td>
                              <td className="text-center">
                                <button 
                                  className={`btn btn-sm ${u.enabled ? 'btn-outline-dark' : 'btn-outline-success'} me-1 py-1`}
                                  onClick={() => handleToggleUserStatus(u.id)}
                                >
                                  {u.enabled ? 'Block' : 'Unblock'}
                                </button>
                                {isSuperAdmin && (
                                  <button 
                                    className="btn btn-sm btn-outline-danger py-1"
                                    onClick={() => handleDeleteUser(u.id, u.email)}
                                  >
                                    Delete
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                         })}
                        </tbody>
                      </table>

                      {/* Pagination */}
                      {usersTotalPages > 1 && (
                        <div className="d-flex justify-content-center gap-1">
                          {Array.from({ length: usersTotalPages }, (_, idx) => (
                            <button 
                              key={idx} 
                              className={`btn btn-sm ${usersPage === idx ? 'btn-primary' : 'btn-outline-primary'}`}
                              onClick={() => fetchUsers(idx)}
                            >
                              {idx + 1}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="col-lg-4">
                <div className="card border-0 shadow-lg p-4 bg-white" style={{ borderRadius: '12px' }}>
                  <h4 className="text-primary fw-bold mb-4 border-bottom pb-2">
                    <i className="fas fa-user-plus me-2"></i> Register New User
                  </h4>

                  {formError && (
                    <div className="alert alert-danger py-2 text-center small mb-3" role="alert">
                      {formError}
                    </div>
                  )}

                  <form onSubmit={handleCreateUserSubmit}>
                    <div className="mb-3">
                      <label className="form-label text-dark fw-semibold small">Email Address *</label>
                      <input 
                        type="email" 
                        className="form-control" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required 
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label text-dark fw-semibold small">Password *</label>
                      <input 
                        type="password" 
                        className="form-control" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required 
                      />
                    </div>

                    <div className="mb-4">
                      <label className="form-label text-dark fw-semibold small d-block">Assign Roles *</label>
                      <div className="form-check mb-1">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          id="roleUser" 
                          checked={selectedRoles.includes('ROLE_USER')}
                          onChange={() => handleRoleCheckbox('ROLE_USER')}
                        />
                        <label className="form-check-label small" htmlFor="roleUser">Standard User (ROLE_USER)</label>
                      </div>
                      
                      {isSuperAdmin && (
                        <>
                          <div className="form-check mb-1">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              id="roleAdmin" 
                              checked={selectedRoles.includes('ROLE_ADMIN')}
                              onChange={() => handleRoleCheckbox('ROLE_ADMIN')}
                            />
                            <label className="form-check-label small" htmlFor="roleAdmin">System Admin (ROLE_ADMIN)</label>
                          </div>
                          <div className="form-check">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              id="roleSuperAdmin" 
                              checked={selectedRoles.includes('ROLE_SUPER_ADMIN')}
                              onChange={() => handleRoleCheckbox('ROLE_SUPER_ADMIN')}
                            />
                            <label className="form-check-label small" htmlFor="roleSuperAdmin">Super Admin (ROLE_SUPER_ADMIN)</label>
                          </div>
                        </>
                      )}
                    </div>

                    <button 
                      type="submit" 
                      className="btn btn-primary w-100 fw-bold py-2" 
                      disabled={formLoading}
                      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
                    >
                      {formLoading ? 'Registering...' : 'Register User'}
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}

          {/* ADMIN MANAGEMENT TAB (SUPER ADMIN ONLY) */}
          {activeTab === 'admins' && isSuperAdmin && (
            <div className="col-12">
              <div className="card border-0 shadow-lg p-4 bg-white" style={{ borderRadius: '12px', minHeight: '500px' }}>
                <h3 className="text-primary fw-bold mb-4 border-bottom pb-2">
                  <i className="fas fa-user-shield me-2"></i> System Admins Directory
                </h3>

                {adminsLoading ? (
                  <div className="text-center py-5">
                    <span className="spinner-border text-primary" role="status"></span>
                    <p className="mt-2 text-muted small">Loading administrators list...</p>
                  </div>
                ) : admins.length === 0 ? (
                  <p className="text-muted text-center py-5">No admin accounts found.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-4">
                      <thead>
                        <tr className="table-warning text-secondary small">
                          <th className="ps-3">Email Address</th>
                          <th>Registered</th>
                          <th className="text-center">Status</th>
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {admins.map((a) => (
                          <tr key={a.id} className="small">
                            <td className="ps-3 fw-bold text-dark">{a.email}</td>
                            <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                            <td className="text-center">
                              <span className={`badge ${a.status === 'ACTIVE' ? 'bg-success' : 'bg-danger'}`}>
                                {a.status}
                              </span>
                            </td>
                            <td className="text-center">
                              <button 
                                className={`btn btn-sm ${a.status === 'ACTIVE' ? 'btn-outline-danger' : 'btn-outline-success'} py-1`}
                                onClick={() => handleToggleAdminStatus(a.id, a.status)}
                              >
                                {a.status === 'ACTIVE' ? 'Block Admin' : 'Activate Admin'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Pagination */}
                    {adminsTotalPages > 1 && (
                      <div className="d-flex justify-content-center gap-1">
                        {Array.from({ length: adminsTotalPages }, (_, idx) => (
                          <button 
                            key={idx} 
                            className={`btn btn-sm ${adminsPage === idx ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => fetchAdmins(idx)}
                          >
                            {idx + 1}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* APPROVALS TAB */}
          {activeTab === 'approvals' && (
            <>
              <div className={isSuperAdmin ? "col-12" : "col-lg-8"}>
                <div className="card border-0 shadow-lg p-4 bg-white mb-4" style={{ borderRadius: '12px', minHeight: '350px' }}>
                  <h3 className="text-primary fw-bold mb-4 border-bottom pb-2">
                    <i className="fas fa-check-double me-2"></i> Approval Requests Registry
                  </h3>

                  {approvalsLoading ? (
                    <div className="text-center py-5">
                      <span className="spinner-border text-primary" role="status"></span>
                      <p className="mt-2 text-muted small">Loading approvals history...</p>
                    </div>
                  ) : approvals.length === 0 ? (
                    <p className="text-muted text-center py-5">No approval requests found.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-4">
                        <thead>
                          <tr className="table-success text-secondary small">
                            <th className="ps-3">Request Type</th>
                            <th>Submitted By</th>
                            <th>Submitted Date</th>
                            <th className="text-center">Status</th>
                            {isSuperAdmin && <th className="text-center">Actions</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {approvals.map((app) => (
                            <tr key={app.id} className="small">
                              <td className="ps-3 fw-bold text-dark">{app.type.replace('_', ' ')}</td>
                              <td>{app.submittedBy}</td>
                              <td>{new Date(app.createdAt).toLocaleString()}</td>
                              <td className="text-center">
                                <span className={`badge ${app.status === 'APPROVED' ? 'bg-success' : app.status === 'REJECTED' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                                  {app.status}
                                </span>
                              </td>
                              {isSuperAdmin && (
                                <td className="text-center">
                                  {app.status === 'PENDING' ? (
                                    <>
                                      <button 
                                        className="btn btn-sm btn-success py-1 me-1"
                                        onClick={() => handleProcessApproval(app.id, 'APPROVED')}
                                      >
                                        Approve
                                      </button>
                                      <button 
                                        className="btn btn-sm btn-danger py-1"
                                        onClick={() => handleProcessApproval(app.id, 'REJECTED')}
                                      >
                                        Reject
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-muted small">Processed</span>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Pagination */}
                      {approvalsTotalPages > 1 && (
                        <div className="d-flex justify-content-center gap-1">
                          {Array.from({ length: approvalsTotalPages }, (_, idx) => (
                            <button 
                              key={idx} 
                              className={`btn btn-sm ${approvalsPage === idx ? 'btn-primary' : 'btn-outline-primary'}`}
                              onClick={() => fetchApprovals(idx)}
                            >
                              {idx + 1}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isSuperAdmin && (
                  <div className="card border-0 shadow-lg p-4 bg-white" style={{ borderRadius: '12px', minHeight: '350px' }}>
                    <h3 className="text-primary fw-bold mb-4 border-bottom pb-2">
                      <i className="fas fa-tasks me-2"></i> Pending BOQ Item Uploads
                    </h3>

                    {pendingBoqLoading ? (
                      <div className="text-center py-5">
                        <span className="spinner-border text-primary" role="status"></span>
                        <p className="mt-2 text-muted small">Loading pending BOQ items...</p>
                      </div>
                    ) : pendingBoqItems.length === 0 ? (
                      <p className="text-muted text-center py-5">No pending BOQ items awaiting review.</p>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-4">
                          <thead>
                            <tr className="table-primary text-secondary small text-center">
                              <th className="ps-3 text-start">Subheading</th>
                              <th className="text-start">Description</th>
                              <th>Unit</th>
                              <th>Qty</th>
                              <th>No. of Units</th>
                              <th>Total Qty.</th>
                              <th className="text-end">Rate (₹)</th>
                              <th>Uploaded By</th>
                              <th>New Value?</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pendingBoqItems.map((item) => (
                              <tr key={item.id} className="small text-center">
                                <td className="ps-3 fw-bold text-dark text-start">{item.subHeading}</td>
                                <td className="text-start">{item.description || '-'}</td>
                                <td>{item.unit}</td>
                                <td>{item.qty ? item.qty.toFixed(2) : '0.00'}</td>
                                <td>{item.noOfUnit ? item.noOfUnit.toFixed(2) : '0.00'}</td>
                                <td className="fw-bold">{item.totalQty ? item.totalQty.toFixed(2) : '0.00'}</td>
                                <td className="text-end fw-bold text-primary">₹{item.rate ? item.rate.toFixed(2) : '0.00'}</td>
                                <td>
                                  <div className="fw-semibold">{item.uploadedRole ? item.uploadedRole.replace('ROLE_', '') : 'ADMIN'}</div>
                                  <div className="text-muted" style={{ fontSize: '9px' }}>ID: {item.uploadedBy || '-'}</div>
                                </td>
                                <td>
                                  <span className={`badge ${item.newValue ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                                    {item.newValue ? 'NEW' : 'EXISTING'}
                                  </span>
                                </td>
                                <td>
                                  <button 
                                    className="btn btn-sm btn-success py-1 me-1 fw-bold"
                                    onClick={() => handleApproveBoqItem(item.id)}
                                  >
                                    Approve
                                  </button>
                                  <button 
                                    className="btn btn-sm btn-danger py-1 fw-bold"
                                    onClick={() => handleRejectBoqItem(item.id)}
                                  >
                                    Reject
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Pagination */}
                        {pendingBoqTotalPages > 1 && (
                          <div className="d-flex justify-content-center gap-1">
                            {Array.from({ length: pendingBoqTotalPages }, (_, idx) => (
                              <button 
                                key={idx} 
                                className={`btn btn-sm ${pendingBoqPage === idx ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => fetchPendingBoqItems(idx)}
                              >
                                {idx + 1}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!isSuperAdmin && (
                <div className="col-lg-4">
                  <div className="card border-0 shadow-lg p-4 bg-white" style={{ borderRadius: '12px' }}>
                    <h4 className="text-primary fw-bold mb-4 border-bottom pb-2">
                      <i className="fas fa-paper-plane me-2"></i> Submit Request
                    </h4>

                    <form onSubmit={handleSubmitApproval}>
                      <div className="mb-4">
                        <label className="form-label text-dark fw-semibold small">Approval Type</label>
                        <select 
                          className="form-select"
                          value={submitApprovalType}
                          onChange={e => setSubmitApprovalType(e.target.value)}
                        >
                          <option value="RATE_CHANGE">Rate Change Approval</option>
                          <option value="BULK_UPLOAD">Bulk Upload Approval</option>
                        </select>
                        <p className="text-muted small mt-2">
                          Rate changes and spreadsheet uploads must be approved by a system administrator before committing.
                        </p>
                      </div>

                      <button 
                        type="submit" 
                        className="btn btn-success w-100 fw-bold py-2"
                        disabled={submitApprovalLoading}
                      >
                        {submitApprovalLoading ? 'Submitting...' : 'Submit Request'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}

          {/* BOQ IMPORT PORTAL TAB */}
          {activeTab === 'boq' && (
            <>
              {/* BOQ Sub-Tabs */}
              <div className="col-12 mb-3">
                <div className="d-flex gap-2 p-1 bg-white bg-opacity-25 rounded-3" style={{ width: 'fit-content' }}>
                  <button
                    className={`btn btn-sm px-3 fw-bold ${boqSubTab === 'import' ? 'btn-light text-primary shadow-sm' : 'btn-link text-white text-decoration-none'}`}
                    onClick={() => setBoqSubTab('import')}
                  >
                    📊 Excel Upload & Import Log
                  </button>
                  <button
                    className={`btn btn-sm px-3 fw-bold ${boqSubTab === 'manual' ? 'btn-light text-primary shadow-sm' : 'btn-link text-white text-decoration-none'}`}
                    onClick={() => setBoqSubTab('manual')}
                  >
                    ➕ Add Single BOQ Item
                  </button>
                  <button
                    className={`btn btn-sm px-3 fw-bold ${boqSubTab === 'imported_data' ? 'btn-light text-primary shadow-sm' : 'btn-link text-white text-decoration-none'}`}
                    onClick={() => setBoqSubTab('imported_data')}
                  >
                    📚 Imported DATA
                  </button>
                </div>
              </div>

              {boqSubTab === 'import' && (
                <>
                  <div className="col-lg-8">
                    <div className="card border-0 shadow-lg p-4 bg-white" style={{ borderRadius: '12px', minHeight: '500px' }}>
                      <h3 className="text-primary fw-bold mb-4 border-bottom pb-2">
                        <i className="fas fa-file-excel me-2"></i> BOQ Import Job Log
                      </h3>

                      {boqLoading ? (
                        <div className="text-center py-5">
                          <span className="spinner-border text-primary" role="status"></span>
                          <p className="mt-2 text-muted small">Loading job history...</p>
                        </div>
                      ) : boqJobs.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                          <div className="fs-1">📊</div>
                          <p className="mt-2 mb-0">No BOQ spreadsheet import logs found.</p>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-hover align-middle border mb-4" style={{ fontSize: '13px' }}>
                            <thead>
                              <tr className="table-light text-secondary">
                                <th className="ps-3 py-2">Filename</th>
                                <th className="py-2">Date Processed</th>
                                <th className="py-2">Total Rows</th>
                                <th className="py-2 text-success">Success</th>
                                <th className="py-2 text-danger">Failed</th>
                                <th className="py-2 text-center">Status</th>
                                <th className="py-2 text-center">Report</th>
                              </tr>
                            </thead>
                            <tbody>
                              {boqJobs.map((job) => (
                                <tr key={job.id}>
                                  <td className="ps-3 py-2 fw-semibold text-dark">{job.fileName}</td>
                                  <td className="py-2 text-secondary">{new Date(job.createdAt).toLocaleString()}</td>
                                  <td className="py-2 text-center text-dark fw-semibold">{job.totalRows}</td>
                                  <td className="py-2 text-center text-success fw-bold">{job.successRows}</td>
                                  <td className="py-2 text-center text-danger fw-bold">{job.failedRows}</td>
                                  <td className="py-2 text-center">
                                    <span className={`badge ${
                                      job.status === 'COMPLETED' ? 'bg-success-subtle text-success border border-success' :
                                      job.status === 'FAILED' ? 'bg-danger-subtle text-danger border border-danger' :
                                      'bg-warning-subtle text-warning border border-warning'
                                    }`} style={{ fontSize: '11px', padding: '4px 8px' }}>
                                      {job.status === 'COMPLETED' ? 'Success' : job.status === 'FAILED' ? 'Failed' : 'Processing'}
                                    </span>
                                  </td>
                                  <td className="py-2 text-center">
                                    <button 
                                      className="btn btn-xs btn-outline-primary py-1 px-2 fw-semibold"
                                      onClick={() => handleDownloadSummary(job.id)}
                                      style={{ fontSize: '11px' }}
                                    >
                                      <i className="fas fa-file-excel me-1"></i>Excel
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-lg-4">
                    <div className="card border-0 shadow-lg p-4 bg-white mb-4" style={{ borderRadius: '12px' }}>
                      <h4 className="text-primary fw-bold mb-4 border-bottom pb-2">
                        <i className="fas fa-cloud-upload-alt me-2"></i> Import BOQ Excel
                      </h4>

                      <form onSubmit={handleUploadFile}>
                        <div className="mb-4">
                          <label className="form-label text-dark fw-semibold small">Choose Spreadsheet File (.xlsx)</label>
                          <input 
                            type="file" 
                            id="boqFileInput"
                            className="form-control" 
                            accept=".xlsx"
                            onChange={handleFileChange}
                            required
                          />
                          <p className="text-muted small mt-2">
                            Only standard BOQ templates with heading layouts, measurement specifications, units, and unit rates are accepted.
                          </p>
                        </div>

                        <button 
                          type="submit" 
                          className="btn btn-primary w-100 fw-bold py-2 mb-3"
                          disabled={uploadLoading}
                          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
                        >
                          {uploadLoading ? 'Uploading...' : 'Upload & Process'}
                        </button>
                      </form>
                    </div>

                    <div className="card border-0 shadow-lg p-4 bg-light" style={{ borderRadius: '12px' }}>
                      <h5 className="text-dark fw-bold mb-3 border-bottom pb-2">Resources</h5>
                      <p className="text-secondary small">
                        Use our verified templates to construct your Bill of Quantities spreadsheet correctly for validation.
                      </p>
                      <button 
                        className="btn btn-outline-primary w-100 fw-bold"
                        onClick={handleDownloadTemplate}
                      >
                        📥 Download BOQ Template
                      </button>
                    </div>
                  </div>
                </>
              )}
              {boqSubTab === 'manual' && (
                <>
                  <div className="col-lg-7">
                    <div className="card border-0 shadow-lg p-4 bg-white" style={{ borderRadius: '12px', minHeight: '500px' }}>
                      <h3 className="text-primary fw-bold mb-4 border-bottom pb-2">
                        <i className="fas fa-plus-circle me-2"></i> Add Single BOQ Item
                      </h3>

                      {manualError && (
                        <div className="alert alert-danger py-2 text-center small mb-3" role="alert">
                          {manualError}
                        </div>
                      )}

                      <form onSubmit={handleCreateManualBoqSubmit}>
                        <div className="mb-3">
                          <label className="form-label text-dark fw-semibold small">Category Type / Main Heading *</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="e.g. PARTITION WORK, CEILING WORK"
                            value={manualMainHeading}
                            onChange={e => setManualMainHeading(e.target.value)}
                            list="existing-main-headings"
                            required 
                          />
                          <datalist id="existing-main-headings">
                            {[...new Set(existingApprovedItems.map(item => item.mainHeading).filter(Boolean))].map(type => (
                              <option key={type} value={type} />
                            ))}
                          </datalist>
                          <div className="form-text small text-muted">
                            Select an existing type from the dropdown list or type a new one.
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label text-dark fw-semibold small">Category Name / Subheading *</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="e.g. 100MM THICK GYPSUM PARTITION"
                            value={manualSubHeading}
                            onChange={e => setManualSubHeading(e.target.value)}
                            required 
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label text-dark fw-semibold small">Specification / Description</label>
                          <textarea 
                            className="form-control" 
                            placeholder="Detailed material specifications, thickness, dimensions, framework details, etc."
                            rows="4"
                            value={manualDescription}
                            onChange={e => setManualDescription(e.target.value)}
                          />
                        </div>

                        <div className="row g-3 mb-4">
                          <div className="col-md-6">
                            <label className="form-label text-dark fw-semibold small">Unit *</label>
                            <select 
                              className="form-select" 
                              value={manualUnit}
                              onChange={e => setManualUnit(e.target.value)}
                              required
                            >
                              <option value="SQ.FT.">SQ.FT.</option>
                              <option value="R.FT.">R.FT.</option>
                              <option value="CU.FT.">CU.FT.</option>
                              <option value="SQ.MTR.">SQ.MTR.</option>
                              <option value="R.MTR.">R.MTR.</option>
                              <option value="CU.MTR.">CU.MTR.</option>
                              <option value="KGS">KGS</option>
                              <option value="NOS.">NOS.</option>
                              <option value="NUMBER">NUMBER</option>
                              <option value="JOB">JOB</option>
                            </select>
                          </div>

                          <div className="col-md-6">
                            <label className="form-label text-dark fw-semibold small">Default Rate (₹) *</label>
                            <div className="input-group">
                              <span className="input-group-text bg-light text-secondary">₹</span>
                              <input 
                                type="number" 
                                step="0.01"
                                className="form-control" 
                                placeholder="0.00"
                                value={manualRate}
                                onChange={e => setManualRate(e.target.value)}
                                required 
                              />
                            </div>
                          </div>
                        </div>

                        <button 
                          type="submit" 
                          className="btn btn-primary w-100 fw-bold py-2" 
                          disabled={manualSubmitting}
                          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
                        >
                          {manualSubmitting ? 'Saving...' : 'Add BOQ Item'}
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="col-lg-5">
                    <div className="card border-0 shadow-lg p-4 bg-white" style={{ borderRadius: '12px', maxHeight: '550px', overflowY: 'auto' }}>
                      <h4 className="text-primary fw-bold mb-3 border-bottom pb-2">
                        <i className="fas fa-list-ul me-2"></i> Master Directory Types
                      </h4>
                      <p className="text-secondary small">
                        Current active categories in the master library. Keep main headings consistent where possible.
                      </p>

                      {[...new Set(existingApprovedItems.map(item => item.mainHeading).filter(Boolean))].length === 0 ? (
                        <p className="text-muted small text-center py-4">No master categories listed yet.</p>
                      ) : (
                        <div className="list-group list-group-flush">
                          {[...new Set(existingApprovedItems.map(item => item.mainHeading).filter(Boolean))].map((type) => {
                            const count = existingApprovedItems.filter(i => i.mainHeading === type).length;
                            return (
                              <div key={type} className="list-group-item d-flex justify-content-between align-items-center px-0 py-2 small">
                                <span className="fw-semibold text-dark">{type}</span>
                                <span className="badge bg-primary rounded-pill">{count} items</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {boqSubTab === 'imported_data' && (
                <div className="col-12 animate__animated animate__fadeIn">
                  <div className="card border-0 shadow-lg p-4 bg-white" style={{ borderRadius: '12px', minHeight: '500px' }}>
                    <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2 flex-wrap gap-3">
                      <h3 className="text-primary fw-bold mb-0">
                        <i className="fas fa-database me-2"></i> Master Imported BOQ Library
                      </h3>
                      <div className="d-flex gap-2 align-items-center" style={{ minWidth: '300px' }}>
                        <div className="input-group">
                          <input 
                            type="text" 
                            className="form-control form-control-sm" 
                            placeholder="Search headings or description..."
                            value={importedSearch}
                            onChange={e => {
                              setImportedSearch(e.target.value);
                              fetchImportedItems(0, e.target.value);
                            }}
                          />
                          {importedSearch && (
                            <button 
                              className="btn btn-outline-secondary btn-sm" 
                              onClick={() => {
                                setImportedSearch('');
                                fetchImportedItems(0, '');
                              }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {loadingImported ? (
                      <div className="text-center py-5">
                        <span className="spinner-border text-primary" role="status"></span>
                        <p className="mt-2 text-muted small">Loading BOQ records...</p>
                      </div>
                    ) : importedItems.length === 0 ? (
                      <div className="text-center py-5 text-muted">
                        <div className="fs-1">📚</div>
                        <p className="mt-2 mb-0">No BOQ items found in the library.</p>
                      </div>
                    ) : (
                      <>
                        <div className="table-responsive mb-4">
                          <table className="table table-hover align-middle border mb-0" style={{ fontSize: '13px' }}>
                            <thead>
                              <tr className="table-light text-secondary">
                                <th className="ps-3 py-2">Category (Main Heading)</th>
                                <th className="py-2">Item Name (Subheading)</th>
                                <th className="py-2" style={{ maxWidth: '300px' }}>Specification (Description)</th>
                                <th className="py-2 text-center" style={{ width: '80px' }}>Unit</th>
                                <th className="py-2 text-end" style={{ width: '100px' }}>Rate (₹)</th>
                                <th className="py-2 text-center" style={{ width: '120px' }}>Status</th>
                                <th className="py-2 text-center" style={{ width: '150px' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {importedItems.map((item) => (
                                <tr key={item.id}>
                                  <td className="ps-3 py-2 fw-semibold text-dark">{item.mainHeading}</td>
                                  <td className="py-2 text-secondary">{item.subHeading}</td>
                                  <td className="py-2 text-muted" style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.description}>
                                    {item.description || <em className="text-light-muted">No description</em>}
                                  </td>
                                  <td className="py-2 text-center text-secondary fw-semibold">{item.unit}</td>
                                  <td className="py-2 text-end fw-semibold text-dark">₹{Number(item.rate).toFixed(2)}</td>
                                  <td className="py-2 text-center">
                                    <span className={`badge ${
                                      item.status === 'APPROVED' ? 'bg-success-subtle text-success border border-success' :
                                      item.status === 'PENDING_APPROVAL' ? 'bg-warning-subtle text-warning border border-warning' :
                                      'bg-danger-subtle text-danger border border-danger'
                                    }`} style={{ fontSize: '11px', padding: '4px 8px' }}>
                                      {item.status === 'APPROVED' ? 'Approved' : item.status === 'PENDING_APPROVAL' ? 'Pending' : 'Rejected'}
                                    </span>
                                  </td>
                                  <td className="py-2 text-center">
                                    <button 
                                      className="btn btn-xs btn-outline-warning me-2 py-1 px-2 fw-semibold"
                                      onClick={() => handleEditClick(item)}
                                      style={{ fontSize: '11px' }}
                                    >
                                      <i className="fas fa-edit me-1"></i>Edit
                                    </button>
                                    <button 
                                      className="btn btn-xs btn-outline-danger py-1 px-2 fw-semibold"
                                      onClick={() => handleDeleteBoqItem(item.id, item.subHeading)}
                                      style={{ fontSize: '11px' }}
                                    >
                                      <i className="fas fa-trash me-1"></i>Delete
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination */}
                        {importedTotalPages > 1 && (
                          <div className="d-flex justify-content-center gap-1">
                            {Array.from({ length: importedTotalPages }, (_, idx) => (
                              <button 
                                key={idx} 
                                className={`btn btn-sm ${importedPage === idx ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => fetchImportedItems(idx)}
                              >
                                {idx + 1}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Edit BOQ Item Modal */}
              {editItem && (
                <div 
                  className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(5px)',
                    zIndex: 1050
                  }}
                >
                  <div 
                    className="card border-0 shadow-lg p-4 animate__animated animate__fadeInUp" 
                    style={{ width: '500px', borderRadius: '12px', background: 'white' }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                      <h5 className="text-primary fw-bold mb-0">
                        <i className="fas fa-edit me-2"></i> Edit BOQ Item
                      </h5>
                      <button 
                        type="button" 
                        className="btn-close" 
                        onClick={() => setEditItem(null)}
                      ></button>
                    </div>

                    <form onSubmit={handleUpdateBoqItem}>
                      <div className="mb-3">
                        <label className="form-label text-dark fw-semibold small">Category Type / Main Heading</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={editMainHeading}
                          onChange={e => setEditMainHeading(e.target.value)}
                          required 
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label text-dark fw-semibold small">Category Name / Subheading</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={editSubHeading}
                          onChange={e => setEditSubHeading(e.target.value)}
                          required 
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label text-dark fw-semibold small">Specification / Description</label>
                        <textarea 
                          className="form-control" 
                          rows="3"
                          value={editDescription}
                          onChange={e => setEditDescription(e.target.value)}
                        />
                      </div>

                      <div className="row g-3 mb-4">
                        <div className="col-md-6">
                          <label className="form-label text-dark fw-semibold small">Unit</label>
                          <select 
                            className="form-select" 
                            value={editUnit}
                            onChange={e => setEditUnit(e.target.value)}
                            required
                          >
                            <option value="SQ.FT.">SQ.FT.</option>
                            <option value="R.FT.">R.FT.</option>
                            <option value="CU.FT.">CU.FT.</option>
                            <option value="SQ.MTR.">SQ.MTR.</option>
                            <option value="R.MTR.">R.MTR.</option>
                            <option value="CU.MTR.">CU.MTR.</option>
                            <option value="KGS">KGS</option>
                            <option value="NOS.">NOS.</option>
                            <option value="NUMBER">NUMBER</option>
                            <option value="JOB">JOB</option>
                          </select>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label text-dark fw-semibold small">Default Rate (₹)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            className="form-control" 
                            value={editRate}
                            onChange={e => setEditRate(e.target.value)}
                            required 
                          />
                        </div>
                      </div>

                      <div className="d-flex gap-2">
                        <button 
                          type="button" 
                          className="btn btn-outline-secondary w-50 fw-bold"
                          onClick={() => setEditItem(null)}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="btn btn-primary w-50 fw-bold"
                          disabled={updatingItem}
                          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
                        >
                          {updatingItem ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}

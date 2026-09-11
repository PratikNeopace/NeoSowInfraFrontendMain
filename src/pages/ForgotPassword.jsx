import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../services/config';
import logo from '../assets/logo.svg';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [step, setStep] = useState('PHONE'); // PHONE, VERIFY, RESET, SUCCESS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { phone });
      setSuccess(response.data);
      setStep('VERIFY');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/verify-code`, { phone, code });
      setSuccess(response.data);
      setStep('RESET');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, { 
        phone, 
        code, 
        newPassword 
      });
      setSuccess(response.data);
      setStep('SUCCESS');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-sm border-0" style={{ maxWidth: '440px', width: '100%', borderRadius: '12px' }}>
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <img src={logo} alt="NEO SOW INFRA" style={{ height: '50px' }} />
          </div>
          
          <h3 className="fw-bold text-dark mb-1 text-center" style={{ fontSize: '24px' }}>Reset Password</h3>
          <p className="text-secondary small mb-4 text-center">
            {step === 'PHONE' && "Enter your registered mobile number to receive a verification code."}
            {step === 'VERIFY' && "Enter the verification code sent to your mobile."}
            {step === 'RESET' && "Enter your new password."}
            {step === 'SUCCESS' && "Your password has been reset successfully."}
          </p>

          {error && (
            <div className="alert alert-danger py-2 text-center small mb-4" role="alert" style={{ borderRadius: '6px' }}>
              <i className="fas fa-exclamation-circle me-1"></i> {error}
            </div>
          )}

          {success && step !== 'SUCCESS' && (
            <div className="alert alert-success py-2 text-center small mb-4" role="alert" style={{ borderRadius: '6px' }}>
              <i className="fas fa-check-circle me-1"></i> {success}
            </div>
          )}

          {step === 'PHONE' && (
            <form onSubmit={handleSendCode}>
              <div className="mb-4">
                <label className="form-label text-secondary fw-bold mb-1" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>MOBILE NUMBER</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted" style={{ width: '42px', justifyContent: 'center' }}>
                    <i className="fas fa-phone"></i>
                  </span>
                  <input
                    type="tel"
                    className="form-control border-start-0 bg-white"
                    placeholder="+919876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ height: '42px', fontSize: '13px' }}
                    required
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="btn w-100 fw-bold shadow-sm"
                style={{ backgroundColor: '#174D3A', color: 'white', height: '42px', fontSize: '14px', borderRadius: '6px' }}
                disabled={loading}
              >
                {loading ? <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> : null}
                Send Verification Code
              </button>
            </form>
          )}

          {step === 'VERIFY' && (
            <form onSubmit={handleVerifyCode}>
              <div className="mb-4">
                <label className="form-label text-secondary fw-bold mb-1" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>VERIFICATION CODE</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted" style={{ width: '42px', justifyContent: 'center' }}>
                    <i className="fas fa-key"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 bg-white"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    style={{ height: '42px', fontSize: '13px' }}
                    required
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="btn w-100 fw-bold shadow-sm"
                style={{ backgroundColor: '#174D3A', color: 'white', height: '42px', fontSize: '14px', borderRadius: '6px' }}
                disabled={loading}
              >
                {loading ? <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> : null}
                Verify Code
              </button>
            </form>
          )}

          {step === 'RESET' && (
            <form onSubmit={handleResetPassword}>
              <div className="mb-4">
                <label className="form-label text-secondary fw-bold mb-1" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>NEW PASSWORD</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted" style={{ width: '42px', justifyContent: 'center' }}>
                    <i className="fas fa-lock"></i>
                  </span>
                  <input
                    type="password"
                    className="form-control border-start-0 bg-white"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ height: '42px', fontSize: '13px' }}
                    minLength="6"
                    required
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="btn w-100 fw-bold shadow-sm"
                style={{ backgroundColor: '#174D3A', color: 'white', height: '42px', fontSize: '14px', borderRadius: '6px' }}
                disabled={loading}
              >
                {loading ? <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> : null}
                Reset Password
              </button>
            </form>
          )}

          {step === 'SUCCESS' && (
            <div className="text-center">
              <Link to="/login" className="btn w-100 fw-bold shadow-sm" style={{ backgroundColor: '#174D3A', color: 'white', height: '42px', fontSize: '14px', borderRadius: '6px', lineHeight: '28px' }}>
                Go to Login
              </Link>
            </div>
          )}

          {step !== 'SUCCESS' && (
            <div className="mt-4 text-center">
              <Link to="/login" className="text-decoration-none fw-bold" style={{ color: '#475569', fontSize: '12px' }}>
                <i className="fas fa-arrow-left me-1"></i> Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

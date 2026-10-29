import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../services/config';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  // Forgot password flow states
  const [view, setView] = useState('login'); // 'login', 'forgot', 'verify', 'reset'
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCodeError, setVerificationCodeError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('accessToken');
    if (token) {
      navigate('/');
    }

    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, [navigate]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const validateEmail = (val) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(val);
  };

  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handlePasswordBlur = () => {
    if (password && password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
    } else {
      setPasswordError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    if (!email) {
      setEmailError('Email is required');
      return;
    }
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setPasswordError('Password is required');
      return;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const baseURL = API_BASE_URL;
      const response = await axios.post(`${baseURL}/auth/login`, { email, password });

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('userEmail', response.data.email);
      localStorage.setItem('userRoles', JSON.stringify(response.data.roles));
      localStorage.setItem('loginTime', new Date().toLocaleString());
      localStorage.setItem('userPassword', password);

      navigate('/');
    } catch (err) {
      console.error('Authentication failed: ', err);
      if (err.response?.status === 401 || err.response?.status === 400) {
        setGeneralError('Invalid email or password. Please try again.');
      } else if (err.response?.data?.message) {
        setGeneralError(err.response.data.message);
      } else {
        setGeneralError('Failed to connect to the server. Please verify the backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    setGeneralError('');

    if (!email) {
      setEmailError('Email is required');
      return;
    }
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const baseURL = API_BASE_URL;
      await axios.post(`${baseURL}/auth/forgot-password`, { email });
      setSuccessMessage('Verification code sent to your registered mobile number.');
      setView('verify');
    } catch (err) {
      console.error('Forgot password failed: ', err);
      setGeneralError(err.response?.data?.message || 'Failed to request verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCodeSubmit = async (e) => {
    e.preventDefault();
    setVerificationCodeError('');
    setGeneralError('');

    if (!verificationCode || verificationCode.length !== 6) {
      setVerificationCodeError('Verification code must be exactly 6 digits');
      return;
    }

    setLoading(true);

    try {
      const baseURL = API_BASE_URL;
      await axios.post(`${baseURL}/auth/verify-code`, { email, code: verificationCode });
      setSuccessMessage('Code verified successfully!');
      setView('reset');
    } catch (err) {
      console.error('Verification failed: ', err);
      setGeneralError(err.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setNewPasswordError('');
    setGeneralError('');

    if (newPassword.length < 6) {
      setNewPasswordError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setGeneralError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const baseURL = API_BASE_URL;
      await axios.post(`${baseURL}/auth/reset-password`, { 
        email, 
        code: verificationCode, 
        newPassword 
      });
      setSuccessMessage('Password reset successfully! Please login with your new password.');
      setView('login');
      setPassword('');
      setVerificationCode('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Password reset failed: ', err);
      setGeneralError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh', fontFamily: "'Inter', sans-serif", backgroundColor: '#f8fafc' }}>
      
      {/* Left Column: Visual Showcase */}
      <div className="d-none d-lg-flex col-lg-6 position-relative flex-column justify-content-between p-5 text-white" style={{
        background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
        overflow: 'hidden'
      }}>
        {/* Abstract Geometric Overlay Background */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.1) 100%)',
          clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0% 100%)',
          zIndex: 1
        }} />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(225deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%)',
          clipPath: 'polygon(30% 0, 100% 0, 100% 70%, 50% 100%)',
          zIndex: 1
        }} />

        {/* Brand/Logo Top Left (Small Version) */}
        <div className="position-relative" style={{ zIndex: 2 }}>
          <img src="/src/assets/logo.svg" alt="Logo" style={{ height: '40px', filter: 'brightness(0.9) contrast(1.2)' }} />
        </div>

        {/* Middle Value Props */}
        <div className="my-auto position-relative" style={{ zIndex: 2, maxWidth: '520px', color: '#1e293b' }}>
          <h1 className="fw-bold mb-3" style={{ fontSize: '38px', letterSpacing: '-0.02em', color: '#0f172a' }}>
            Design. Build. Deliver.
          </h1>
          <p className="text-secondary mb-5" style={{ fontSize: '16px', lineHeight: '1.6' }}>
            Create professional quotations, manage projects, and streamline architectural workflows from one platform.
          </p>

          <div className="d-flex flex-column gap-4">
            {/* Value Prop 1 */}
            <div className="d-flex align-items-start gap-3">
              <div className="d-flex align-items-center justify-content-center rounded-3 bg-white shadow-sm" style={{ width: '42px', height: '42px', minWidth: '42px' }}>
                <i className="fas fa-pencil-ruler text-primary" style={{ fontSize: '18px' }}></i>
              </div>
              <div>
                <h6 className="fw-bold mb-1" style={{ fontSize: '15px', color: '#0f172a' }}>Architectural Design</h6>
                <p className="text-secondary small mb-0">Residential, commercial, and interior design solutions.</p>
              </div>
            </div>

            {/* Value Prop 2 */}
            <div className="d-flex align-items-start gap-3">
              <div className="d-flex align-items-center justify-content-center rounded-3 bg-white shadow-sm" style={{ width: '42px', height: '42px', minWidth: '42px' }}>
                <i className="fas fa-file-invoice-dollar text-primary" style={{ fontSize: '18px' }}></i>
              </div>
              <div>
                <h6 className="fw-bold mb-1" style={{ fontSize: '15px', color: '#0f172a' }}>Quotation &amp; Cost Estimation</h6>
                <p className="text-secondary small mb-0">Generate accurate BOQs, material estimates, and project quotations.</p>
              </div>
            </div>

            {/* Value Prop 3 */}
            <div className="d-flex align-items-start gap-3">
              <div className="d-flex align-items-center justify-content-center rounded-3 bg-white shadow-sm" style={{ width: '42px', height: '42px', minWidth: '42px' }}>
                <i className="fas fa-tasks text-primary" style={{ fontSize: '18px' }}></i>
              </div>
              <div>
                <h6 className="fw-bold mb-1" style={{ fontSize: '15px', color: '#0f172a' }}>Construction Management</h6>
                <p className="text-secondary small mb-0">Track projects from concept to completion with centralized documentation.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info decoration */}
        <div className="position-relative d-flex align-items-center gap-2" style={{ zIndex: 2 }}>
          <div className="bg-primary" style={{ width: '28px', height: '3px', borderRadius: '2px' }} />
          <span className="small text-secondary fw-semibold">Neo Pace Ecosystem</span>
        </div>
      </div>

      {/* Right Column: Form Panel */}
      <div className="col-12 col-lg-6 d-flex flex-column justify-content-center align-items-center p-4 p-md-5">
        <div className="w-100" style={{ maxWidth: '440px' }}>
          
          {/* Main Logo */}
          <div className="text-center mb-5">
            <img src="/src/assets/logo.svg" alt="NEO SOW INFRA" style={{ height: '70px' }} />
          </div>

          {/* Form Container */}
          <div className="bg-white border rounded-3 p-4 p-md-5 shadow-sm" style={{ borderRadius: '12px' }}>
            
            {view === 'login' && (
              <>
                <h3 className="fw-bold text-dark mb-1" style={{ fontSize: '24px' }}>Log In</h3>
                <p className="text-secondary small mb-4">Authenticate to access the administrative console.</p>
              </>
            )}

            {view === 'forgot' && (
              <>
                <h3 className="fw-bold text-dark mb-1" style={{ fontSize: '24px' }}>Forgot Password</h3>
                <p className="text-secondary small mb-4">Enter your work email address and we'll send a 6-digit verification code to your registered mobile number.</p>
              </>
            )}

            {view === 'verify' && (
              <>
                <h3 className="fw-bold text-dark mb-1" style={{ fontSize: '24px' }}>Verify Code</h3>
                <p className="text-secondary small mb-4">Enter the 6-digit verification code sent to your registered mobile number.</p>
              </>
            )}

            {view === 'reset' && (
              <>
                <h3 className="fw-bold text-dark mb-1" style={{ fontSize: '24px' }}>Reset Password</h3>
                <p className="text-secondary small mb-4">Choose a secure new password for your account.</p>
              </>
            )}

            {generalError && (
              <div className="alert alert-danger py-2 text-center small mb-4" role="alert" style={{ borderRadius: '6px' }}>
                <i className="fas fa-exclamation-circle me-1"></i> {generalError}
              </div>
            )}

            {successMessage && (
              <div className="alert alert-success py-2 text-center small mb-4" role="alert" style={{ borderRadius: '6px' }}>
                <i className="fas fa-check-circle me-1"></i> {successMessage}
              </div>
            )}

            {view === 'login' && (
              <form onSubmit={handleSubmit}>
                {/* Email Address */}
                <div className="mb-3">
                  <label className="form-label text-secondary fw-bold mb-1" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>WORK EMAIL</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted" style={{ width: '42px', justifycontent: 'center' }}>
                      <i className="far fa-envelope"></i>
                    </span>
                    <input
                      type="email"
                      className={`form-control border-start-0 bg-white ${emailError ? 'is-invalid' : ''}`}
                      placeholder="admin@enterprise.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError('');
                      }}
                      onBlur={handleEmailBlur}
                      style={{ height: '42px', fontSize: '13px', borderTopRightRadius: '6px', borderBottomRightRadius: '6px' }}
                      required
                    />
                    {emailError && <div className="invalid-feedback small">{emailError}</div>}
                  </div>
                </div>

                {/* Password */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label text-secondary fw-bold mb-0" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>PASSWORD</label>
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); setView('forgot'); setGeneralError(''); setEmailError(''); }} 
                      className="text-decoration-none fw-bold"
                      style={{ color: '#006A4E', fontSize: '11px' }}
                    >
                      Forgot password?
                    </a>
                  </div>
                  
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted" style={{ width: '42px', justifycontent: 'center' }}>
                      <i className="fas fa-lock"></i>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`form-control border-start-0 border-end-0 bg-white ${passwordError ? 'is-invalid' : ''}`}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError('');
                      }}
                      onBlur={handlePasswordBlur}
                      style={{ height: '42px', fontSize: '13px' }}
                      required
                    />
                    <button 
                      type="button" 
                      className="input-group-text bg-white text-muted border-start-0" 
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ width: '42px', justifycontent: 'center', borderTopRightRadius: '6px', borderBottomRightRadius: '6px' }}
                    >
                      <i className={`far ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                    {passwordError && <div className="invalid-feedback small w-100">{passwordError}</div>}
                  </div>
                </div>

                {/* Remember Me */}
                <div className="form-check mb-4">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                    style={{ cursor: 'pointer' }}
                  />
                  <label className="form-check-label text-secondary small" htmlFor="rememberMe" style={{ cursor: 'pointer', fontWeight: '500' }}>
                    Keep me signed in on this device
                  </label>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="btn btn-primary w-100 fw-bold py-2" 
                  style={{
                    height: '42px',
                    borderRadius: '6px',
                    backgroundColor: '#006A4E',
                    border: 'none',
                    fontSize: '13px',
                    letterSpacing: '0.03em'
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      SIGNING IN...
                    </>
                  ) : (
                    'SIGN IN'
                  )}
                </button>
              </form>
            )}

            {view === 'forgot' && (
              <form onSubmit={handleForgotPasswordSubmit}>
                {/* Email Address */}
                <div className="mb-4">
                  <label className="form-label text-secondary fw-bold mb-1" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>WORK EMAIL</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted" style={{ width: '42px', justifycontent: 'center' }}>
                      <i className="far fa-envelope"></i>
                    </span>
                    <input
                      type="email"
                      className={`form-control border-start-0 bg-white ${emailError ? 'is-invalid' : ''}`}
                      placeholder="admin@enterprise.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError('');
                      }}
                      onBlur={handleEmailBlur}
                      style={{ height: '42px', fontSize: '13px', borderTopRightRadius: '6px', borderBottomRightRadius: '6px' }}
                      required
                    />
                    {emailError && <div className="invalid-feedback small">{emailError}</div>}
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-100 fw-bold py-2 mb-3" 
                  style={{
                    height: '42px',
                    borderRadius: '6px',
                    backgroundColor: '#006A4E',
                    border: 'none',
                    fontSize: '13px',
                    letterSpacing: '0.03em'
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      SENDING CODE...
                    </>
                  ) : (
                    'SEND CODE'
                  )}
                </button>

                <div className="text-center">
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); setView('login'); setGeneralError(''); setEmailError(''); }} 
                    className="text-decoration-none small fw-bold"
                    style={{ color: '#006A4E' }}
                  >
                    Back to Login
                  </a>
                </div>
              </form>
            )}

            {view === 'verify' && (
              <form onSubmit={handleVerifyCodeSubmit}>
                {/* Verification Code */}
                <div className="mb-4">
                  <label className="form-label text-secondary fw-bold mb-1" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>VERIFICATION CODE</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted" style={{ width: '42px', justifycontent: 'center' }}>
                      <i className="fas fa-key"></i>
                    </span>
                    <input
                      type="text"
                      className={`form-control border-start-0 bg-white ${verificationCodeError ? 'is-invalid' : ''}`}
                      placeholder="123456"
                      value={verificationCode}
                      onChange={(e) => {
                        setVerificationCode(e.target.value);
                        setVerificationCodeError('');
                      }}
                      maxLength={6}
                      style={{ height: '42px', fontSize: '13px', borderTopRightRadius: '6px', borderBottomRightRadius: '6px' }}
                      required
                    />
                    {verificationCodeError && <div className="invalid-feedback small">{verificationCodeError}</div>}
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-100 fw-bold py-2 mb-3" 
                  style={{
                    height: '42px',
                    borderRadius: '6px',
                    backgroundColor: '#006A4E',
                    border: 'none',
                    fontSize: '13px',
                    letterSpacing: '0.03em'
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      VERIFYING...
                    </>
                  ) : (
                    'VERIFY CODE'
                  )}
                </button>

                <div className="text-center">
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); setView('forgot'); setGeneralError(''); setVerificationCodeError(''); }} 
                    className="text-decoration-none small fw-bold"
                    style={{ color: '#006A4E' }}
                  >
                    Back to Email Entry
                  </a>
                </div>
              </form>
            )}

            {view === 'reset' && (
              <form onSubmit={handleResetPasswordSubmit}>
                {/* New Password */}
                <div className="mb-3">
                  <label className="form-label text-secondary fw-bold mb-1" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>NEW PASSWORD</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted" style={{ width: '42px', justifycontent: 'center' }}>
                      <i className="fas fa-lock"></i>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`form-control border-start-0 bg-white ${newPasswordError ? 'is-invalid' : ''}`}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setNewPasswordError('');
                      }}
                      style={{ height: '42px', fontSize: '13px', borderTopRightRadius: '6px', borderBottomRightRadius: '6px' }}
                      required
                    />
                    {newPasswordError && <div className="invalid-feedback small">{newPasswordError}</div>}
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="mb-4">
                  <label className="form-label text-secondary fw-bold mb-1" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>CONFIRM PASSWORD</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted" style={{ width: '42px', justifycontent: 'center' }}>
                      <i className="fas fa-lock"></i>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control border-start-0 bg-white"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{ height: '42px', fontSize: '13px', borderTopRightRadius: '6px', borderBottomRightRadius: '6px' }}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-100 fw-bold py-2 mb-3" 
                  style={{
                    height: '42px',
                    borderRadius: '6px',
                    backgroundColor: '#006A4E',
                    border: 'none',
                    fontSize: '13px',
                    letterSpacing: '0.03em'
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      RESETTING...
                    </>
                  ) : (
                    'RESET PASSWORD'
                  )}
                </button>
              </form>
            )}

          </div>

          {/* Footer Onboarding request */}
          <div className="text-center mt-4">
            <span className="text-secondary small" style={{ fontSize: '12px' }}>
              Require onboarding access?{' '}
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); alert('Please contact system administrator to request account onboarding.'); }} 
                className="fw-bold text-decoration-none ms-1"
                style={{ color: '#006A4E' }}
              >
                REQUEST AN ACCOUNT
              </a>
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}

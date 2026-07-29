import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
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

      navigate('/');
    } catch (err) {
      log.error('Authentication failed: ', err);
      if (err.response?.status === 401) {
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

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <div style={{
        width: '100%',
        maxWidth: '450px',
        background: 'white',
        borderRadius: '10px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        padding: '40px'
      }}>
        <div className="text-center mb-4">
          <h1 style={{ color: '#667eea', fontSize: '28px', fontWeight: 700 }}>Welcome Back</h1>
          <p className="text-muted small">Sign in to your account to continue</p>
        </div>

        {generalError && (
          <div className="alert alert-danger py-2 text-center small mb-3" role="alert">
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="mb-3">
            <label className="form-label text-dark fw-semibold small">Email Address</label>
            <input
              type="email"
              className={`form-control ${emailError ? 'is-invalid' : ''}`}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError('');
              }}
              onBlur={handleEmailBlur}
              required
            />
            {emailError && <div className="invalid-feedback small">{emailError}</div>}
          </div>

          {/* Password */}
          <div className="mb-3">
            <label className="form-label text-dark fw-semibold small">Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              className={`form-control ${passwordError ? 'is-invalid' : ''}`}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError('');
              }}
              onBlur={handlePasswordBlur}
              required
            />
            <div className="mt-2 form-check small">
              <input
                type="checkbox"
                className="form-check-input"
                id="showPassword"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
              />
              <label className="form-check-label text-secondary" htmlFor="showPassword">Show Password</label>
            </div>
            {passwordError && <div className="invalid-feedback small">{passwordError}</div>}
          </div>

          {/* Remember Me & Forgot */}
          <div className="d-flex justify-content-between align-items-center mb-4 small">
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="rememberMe"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              <label className="form-check-label text-secondary" htmlFor="rememberMe">Remember me</label>
            </div>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); alert('Password reset feature coming soon!'); }} 
              className="text-decoration-none"
              style={{ color: '#667eea' }}
            >
              Forgot password?
            </a>
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            className="btn w-100 fw-bold py-2 text-white" 
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '5px'
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="text-center text-muted small mt-4">
          Don't have an account?{' '}
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); alert('Sign up feature coming soon! Please contact your administrator.'); }} 
            className="fw-bold text-decoration-none"
            style={{ color: '#D3D3D3' }}
          >
            Create account
          </a>
        </div>
      </div>
    </div>
  );
}


 

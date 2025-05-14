import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/auth.css';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPasswordWithToken } = useAuth();
  
  // Extract token from URL query parameters
  const query = new URLSearchParams(location.search);
  const token = query.get('token');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    
    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    
    if (!token) {
      return setError('Invalid or missing reset token');
    }
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      const result = await resetPasswordWithToken(
        token,
        formData.password,
        formData.confirmPassword
      );
      
      if (result.success) {
        setSuccess(result.message);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to reset password');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-container">
      <div className="branding">
        <div className="logo-container">
          <img src="/images/logo.png" alt="Campus Room Logo" className="logo" />
          <h1>Campus<span>Room</span></h1>
        </div>
        <p className="tagline">Smart Classroom Management System</p>
      </div>
      
      <div className="auth-card">
        <div className="auth-sidebar">
          <h2>Reset Your Password</h2>
          <p>Create a new password for your account.</p>
          <p className="new-account">Remember your password? <Link to="/">Sign in</Link></p>
        </div>
        
        <div className="auth-form">
          <h2>Create New Password</h2>
          
          {error && <div className="error-alert">{error}</div>}
          {success && <div className="success-alert">{success}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <div className="input-icon">
                <i className="fas fa-lock"></i>
                <input 
                  type="password" 
                  id="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <div className="input-icon">
                <i className="fas fa-lock"></i>
                <input 
                  type="password" 
                  id="confirmPassword" 
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
      
      <div className="footer">
        <p>&copy; 2025 CampusRoom. All rights reserved.</p>
      </div>
    </div>
  );
};

export default ResetPassword;
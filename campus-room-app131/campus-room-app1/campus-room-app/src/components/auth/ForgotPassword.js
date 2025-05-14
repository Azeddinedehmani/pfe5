import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      const result = await resetPassword(email);
      
      if (result.success) {
        setSuccess(result.message);
        
        // Extraire le token du message
        const tokenMatch = result.message.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/);
        if (tokenMatch) {
          setToken(tokenMatch[0]);
        }
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

  const goToResetPage = () => {
    if (token) {
      navigate(`/reset-password?token=${token}`);
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
          <h2>Reset Password</h2>
          <p>Enter your email address and we'll send you a link to reset your password.</p>
          <p className="new-account">Remember your password? <Link to="/">Sign in</Link></p>
        </div>
        
        <div className="auth-form">
          <h2>Forgot Password</h2>
          
          {error && <div className="error-alert">{error}</div>}
          {success && (
            <div className="success-alert">
              {success}
              {token && (
                <button 
                  onClick={goToResetPage}
                  className="btn-primary mt-3"
                  style={{ display: 'block', margin: '10px auto', width: '100%' }}
                >
                  Continuer vers la réinitialisation
                </button>
              )}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-icon">
                <i className="fas fa-envelope"></i>
                <input 
                  type="email" 
                  id="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            
            <div className="mt-3 text-center">
              <Link to="/register">Need an account? Register</Link>
            </div>
          </form>
        </div>
      </div>
      
      <div className="footer">
        <p>&copy; 2025 CampusRoom. All rights reserved.</p>
      </div>
    </div>
  );
};

export default ForgotPassword;
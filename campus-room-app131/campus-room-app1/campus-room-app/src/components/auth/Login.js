import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to appropriate dashboard
  useEffect(() => {
    if (currentUser) {
      redirectBasedOnRole(currentUser.role);
    }
  }, [currentUser, navigate]);

  const redirectBasedOnRole = (role) => {
    switch(role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'professor':
        navigate('/professor');
        break;
      case 'student':
        navigate('/student');
        break;
      default:
        navigate('/');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      
      const result = await login(email, password, rememberMe);
      
      if (result.success) {
        redirectBasedOnRole(result.user.role.toLowerCase());
      } else {
        // Display the error message from the server
        setError(result.message);
        
        // Specifically handle inactive account message
        if (result.message && result.message.includes("n'est pas activé")) {
          // You could add special styling or additional info for inactive accounts
          console.log("Account is inactive");
        }
      }
    } catch (err) {
      setError('Failed to log in');
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
          <h2>Welcome Back</h2>
          <p>Log in to manage your classroom reservations and scheduling</p>
          <p className="new-account">Don't have an account? <Link to="/register">Create one</Link></p>
        </div>
        
        <div className="auth-form">
          <h2>Sign In</h2>
          
          {error && <div className="error-alert">{error}</div>}
          
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
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-icon">
                <i className="fas fa-lock"></i>
                <input 
                  type="password" 
                  id="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>
            
            <div className="form-options">
              <label className="remember">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
            </div>
            
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
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

export default Login;
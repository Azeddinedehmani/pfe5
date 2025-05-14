import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' // default role
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    
    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    
    try {
      setError('');
      setLoading(true);
      
      const result = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
      
      if (result.success) {
        navigate('/');
        alert('Account created successfully! Please log in.');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to create an account');
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
          <h2>Create Account</h2>
          <p>Join our platform to reserve classrooms and manage your academic schedule.</p>
          <p className="new-account">Already have an account? <Link to="/">Sign in</Link></p>
        </div>
        
        <div className="auth-form">
          <h2>Register</h2>
          
          {error && <div className="error-alert">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input 
                  type="text" 
                  id="firstName" 
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input 
                  type="text" 
                  id="lastName" 
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input 
                type="email" 
                id="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                required 
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input 
                  type="password" 
                  id="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
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
            
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select 
                id="role" 
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="student">Student</option>
                <option value="professor">Professor</option>
              </select>
              <small>Admin accounts can only be created by existing admins.</small>
            </div>
            
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
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

export default Register;
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import './styles/base.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';

// Dashboard Components
import AdminDashboard from './components/admin/AdminDashboard';
import ProfessorDashboard from './components/professor/ProfessorDashboard';
import StudentDashboard from './components/student/StudentDashboard';
import AdminClassrooms from './components/admin/AdminClassrooms';

// Profile Component
import Profile from './components/common/Profile'; // Make sure this path matches your actual Profile component location

// Context Provider
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/" />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Redirect to the appropriate dashboard based on role
    switch(currentUser.role) {
      case 'admin':
        return <Navigate to="/admin" />;
      case 'professor':
        return <Navigate to="/professor" />;
      case 'student':
        return <Navigate to="/student" />;
      default:
        return <Navigate to="/" />;
    }
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Profile Route - Accessible to all authenticated users */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'professor', 'student']}>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            

            {/* Protected Routes */}
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/professor/*" 
              element={
                <ProtectedRoute allowedRoles={['professor']}>
                  <ProfessorDashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/student/*" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
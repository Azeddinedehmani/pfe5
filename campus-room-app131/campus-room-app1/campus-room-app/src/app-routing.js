import React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import AdminDashboard from './components/admin/AdminDashboard';
import ProfessorDashboard from './components/professor/ProfessorDashboard';
import StudentDashboard from './components/student/StudentDashboard';
import NotFound from './components/common/NotFound';
import PrivateRoute from './components/common/PrivateRoute';

const AppRouting = () => {
  return (
    <Router>
      <Switch>
        {/* Routes publiques */}
        <Route exact path="/" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password/:token" component={ResetPassword} />
        
        {/* Routes privées avec redirection selon le rôle */}
        <PrivateRoute 
          path="/admin" 
          component={AdminDashboard} 
          roles={['ADMIN']} 
        />
        
        <PrivateRoute 
          path="/professor" 
          component={ProfessorDashboard} 
          roles={['PROFESSOR']} 
        />
        
        <PrivateRoute 
          path="/student" 
          component={StudentDashboard} 
          roles={['STUDENT']} 
        />
        
        {/* Redirection basée sur le rôle après connexion */}
        <PrivateRoute exact path="/dashboard">
          {() => {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const role = user.role || '';
            
            if (role === 'ADMIN') {
              return <Redirect to="/admin" />;
            } else if (role === 'PROFESSOR') {
              return <Redirect to="/professor" />;
            } else if (role === 'STUDENT') {
              return <Redirect to="/student" />;
            } else {
              // Si le rôle n'est pas reconnu, déconnexion et redirection vers login
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              return <Redirect to="/" />;
            }
          }}
        </PrivateRoute>
        
        {/* Page 404 */}
        <Route path="*" component={NotFound} />
      </Switch>
    </Router>
  );
};

export default AppRouting;
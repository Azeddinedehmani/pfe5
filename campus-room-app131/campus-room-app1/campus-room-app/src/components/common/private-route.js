import React from 'react';
import { Route, Redirect } from 'react-router-dom';

const PrivateRoute = ({ component: Component, roles, children, ...rest }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : {};
  const userRole = user.role || '';
  
  return (
    <Route
      {...rest}
      render={props => {
        // Vérifier si l'utilisateur est authentifié
        if (!isAuthenticated) {
          // Rediriger vers la page de connexion si non authentifié
          return (
            <Redirect
              to={{
                pathname: '/',
                state: { from: props.location }
              }}
            />
          );
        }
        
        // Vérifier les rôles autorisés pour cette route
        if (roles && !roles.includes(userRole)) {
          // Rediriger vers la page de tableau de bord appropriée si le rôle n'est pas autorisé
          if (userRole === 'ADMIN') {
            return <Redirect to="/admin" />;
          } else if (userRole === 'PROFESSOR') {
            return <Redirect to="/professor" />;
          } else if (userRole === 'STUDENT') {
            return <Redirect to="/student" />;
          } else {
            // Cas improbable mais par sécurité, déconnexion et redirection
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return <Redirect to="/" />;
          }
        }
        
        // Rendu du composant approprié ou des enfants
        return children ? children(props) : <Component {...props} />;
      }}
    />
  );
};

export default PrivateRoute;
import React from 'react';
import '../../styles/dashboard.css';

const Header = ({ title, currentUser, userRole }) => {
  return (
    <div className="header">
      <h1>{title}</h1>
      <div className="user-info">
        <span className="role-badge">{userRole}</span>
        <span>{currentUser?.firstName} {currentUser?.lastName}</span>
      </div>
    </div>
  );
};

export default Header;
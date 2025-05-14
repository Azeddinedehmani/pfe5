import React from 'react';
import '../../styles/dashboard.css';

const StatCard = ({ icon, title, value, color, description }) => {
  return (
    <div className="stat-card">
      <div className="stat-icon icon-blue">
        <i className={icon}></i>
      </div>
      <div className="stat-info">
        <h3>{title}</h3>
        <p className="stat-number">{value}</p>
        {description && <p className="stat-description">{description}</p>}
      </div>
    </div>
  );
};

export default StatCard;
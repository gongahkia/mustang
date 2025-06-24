import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ securityMessage }) => {
  return (
    <div className="spinner-container" aria-live="polite">
      <div className="spinner" role="status">
        <div className="spinner-sector spinner-sector-red"></div>
        <div className="spinner-sector spinner-sector-blue"></div>
        <div className="spinner-sector spinner-sector-green"></div>
      </div>
      <div className="spinner-security-message">
        <span className="encryption-badge">🔒</span>
        {securityMessage || "Securing communication channels..."}
      </div>
    </div>
  );
};

export default LoadingSpinner;
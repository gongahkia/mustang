import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { CryptoContext } from '../../contexts/CryptoContext';
import ChainMonitor from './ChainMonitor';
import MessageComposer from './MessageComposer';
import ZeroizeNotifier from '../../components/ZeroizeNotifier';
import { schedulePurge } from '../../utils/purgeService';
import './Dashboard.css';

const Dashboard = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const { purgeSession } = useContext(CryptoContext);
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    const cleanup = schedulePurge();
    return () => cleanup();
  }, []);
  
  const handleLogout = () => {
    purgeSession();
    logout();
    navigate('/login');
  };
  
  return (
    <div className="dashboard" data-testid="dashboard">
      <header className="dashboard-header">
        <div className="user-info">
          <span className="user-email">{currentUser?.email}</span>
          <span className="encryption-badge active">ENCRYPTED</span>
        </div>
        <button 
          className="logout-button"
          onClick={handleLogout}
          aria-label="Logout and purge session"
        >
          Logout & Purge
        </button>
      </header>
      
      <div className="dashboard-content">
        <section className="communication-section">
          <MessageComposer />
        </section>
        
        <section className="security-section">
          <ChainMonitor />
          
          <div className="security-status">
            <h3>Session Security</h3>
            <div className="status-item">
              <span className="status-label">Encryption:</span>
              <span className="status-value active">AES-256-GCM Active</span>
            </div>
            <div className="status-item">
              <span className="status-label">Key Exchange:</span>
              <span className="status-value active">ECDH P-256</span>
            </div>
            <div className="status-item">
              <span className="status-label">Auto-Purge:</span>
              <span className="status-value active">15 minutes</span>
            </div>
          </div>
        </section>
      </div>
      
      <ZeroizeNotifier />
    </div>
  );
};

export default Dashboard;
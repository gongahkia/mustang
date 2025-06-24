import React, { useContext, useEffect, useState } from 'react';
import { CryptoContext } from '../../contexts/CryptoContext';
import './ChainMonitor.css';

const ChainMonitor = () => {
  const { hashChain } = useContext(CryptoContext);
  const [chainStatus, setChainStatus] = useState('valid');
  
  useEffect(() => {
    if (hashChain.length > 1) {
      for (let i = 1; i < hashChain.length; i++) {
        const prevHash = hashChain[i-1];
        const currentHash = hashChain[i];
        
        if (currentHash.length !== 64 || 
            !currentHash.startsWith(prevHash.substring(0, 8))) {
          setChainStatus('invalid');
          return;
        }
      }
      setChainStatus('valid');
    }
  }, [hashChain]);
  
  return (
    <div className="chain-monitor" data-testid="chain-monitor">
      <div className="monitor-header">
        <h2>Chain Integrity Monitor</h2>
        <span className={`status-badge ${chainStatus}`}>
          {chainStatus.toUpperCase()}
        </span>
      </div>
      
      <div className="chain-visualizer">
        {hashChain.map((hash, index) => (
          <div key={index} className="chain-block">
            <div className="block-header">
              <span className="block-number">#{index + 1}</span>
              <span className="block-hash">{hash.substring(0, 12)}...{hash.substring(52)}</span>
            </div>
            {index > 0 && (
              <div className="chain-connector">
                <div className="connector-line"></div>
                <div className="connector-node"></div>
              </div>
            )}
          </div>
        ))}
        
        {hashChain.length === 0 && (
          <div className="empty-chain">
            <p>No messages in chain yet</p>
            <p>Send a message to start the hash chain</p>
          </div>
        )}
      </div>
      
      <div className="chain-stats">
        <div className="stat-item">
          <span className="stat-label">Blocks:</span>
          <span className="stat-value">{hashChain.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Status:</span>
          <span className={`stat-value ${chainStatus}`}>{chainStatus}</span>
        </div>
      </div>
    </div>
  );
};

export default ChainMonitor;
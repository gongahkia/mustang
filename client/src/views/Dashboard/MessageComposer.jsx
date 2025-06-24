import React, { useState, useContext, useRef } from 'react';
import { CryptoContext } from '../../contexts/CryptoContext';
import { sendSecureMessage } from '../../utils/apiClient';
import './MessageComposer.css';

const MessageComposer = () => {
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState(null);
  const { encryptData, establishSession } = useContext(CryptoContext);
  const messageRef = useRef(null);
  
  const handleSend = async () => {
    if (!message.trim() || !recipient.trim()) return;
    
    try {
      setIsSending(true);
      setStatus('Encrypting...');
      
      const peerPublicKey = await establishSession(recipient);
      
      setStatus('Encrypting message...');
      const { ciphertext, iv, chainHash } = await encryptData(
        new TextEncoder().encode(message)
      );
      
      setStatus('Transmitting securely...');
      await sendSecureMessage(
        { ciphertext, iv, chainHash },
        recipient
      );
      
      setStatus('Message sent securely!');
      setMessage('');
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      console.error('Send error:', error);
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <div className="message-composer">
      <h2>Secure Message Composer</h2>
      
      <div className="composer-controls">
        <div className="input-group">
          <label htmlFor="recipient">Recipient ID</label>
          <input
            type="text"
            id="recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Enter recipient ID"
          />
        </div>
        
        <div className="input-group">
          <label htmlFor="message">Message (Auto-purged after sending)</label>
          <textarea
            ref={messageRef}
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your secure message..."
            autoComplete="off"
            data-crypto-sensitive="true"
          />
        </div>
        
        <button
          onClick={handleSend}
          disabled={isSending || !message.trim() || !recipient.trim()}
          className="send-button"
        >
          {isSending ? 'Sending...' : 'Encrypt & Send'}
        </button>
      </div>
      
      {status && (
        <div className={`status-message ${status.includes('Error') ? 'error' : 'success'}`}>
          {status}
        </div>
      )}
      
      <div className="security-note">
        <p>⚠️ Messages are end-to-end encrypted and auto-purged after transmission</p>
        <p>⏱️ Server retention: max 60 seconds</p>
      </div>
    </div>
  );
};

export default MessageComposer;
import React, { useEffect } from 'react';
import '../../styles/modal.css';

const Modal = ({ show, onClose, title, children }) => {
  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && show) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    
    // Prevent body scrolling when modal is open
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'auto';
    };
  }, [show, onClose]);

  // Close modal if clicking outside content area
  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('modal')) {
      onClose();
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className="modal" onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>{title}</h2>
          <span className="close-modal" onClick={onClose}>&times;</span>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
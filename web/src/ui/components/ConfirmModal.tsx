import React, { useEffect } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { AlertTriangle } from 'lucide-react';
import './ConfirmModal.css';

export function ConfirmModal() {
  const confirmDialog = useUIStore(s => s.confirmDialog);
  const closeConfirm = useUIStore(s => s.closeConfirm);

  useEffect(() => {
    if (!confirmDialog) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        confirmDialog.onCancel?.();
        closeConfirm();
      } else if (e.key === 'Enter') {
        confirmDialog.onConfirm();
        closeConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmDialog, closeConfirm]);

  if (!confirmDialog) return null;

  return (
    <div className="confirm-backdrop" onClick={() => {
      confirmDialog.onCancel?.();
      closeConfirm();
    }}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: '#E74C3C' }}>
          <AlertTriangle size={48} strokeWidth={2.5} />
        </div>
        <div className="confirm-message">
          {confirmDialog.message}
        </div>
        <div className="confirm-actions">
          <button 
            className="confirm-btn-cancel"
            onClick={() => {
              confirmDialog.onCancel?.();
              closeConfirm();
            }}
          >
            Cancel
          </button>
          <button 
            className="confirm-btn-danger"
            onClick={() => {
              confirmDialog.onConfirm();
              closeConfirm();
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Book } from 'lucide-react';
import { useCollectionStore } from './useCollectionStore';
import { useTrackingStore } from '../tracking/useTrackingStore';
import { audio } from '../../engine/audioEngine';
import '../../ui/TutorialModal.css';
import { Tooltip } from '../../ui/Tooltip';

export const CollectionButton: React.FC = () => {
  const openCollection = useCollectionStore((s) => s.openCollection);
  const unreadReports = useTrackingStore((s) => s.unreadReports);
  const clearUnread = useTrackingStore((s) => s.clearUnread);

  return (
    <div style={{ position: 'relative' }}>
      <Tooltip content="Darwinpedia" position="bottom" align="left" variant="god">
        <button 
          className={`tutorial-button ${unreadReports > 0 ? 'notification-jiggle' : ''}`} 
          onClick={() => {
            audio.playUIClick();
            clearUnread();
            openCollection();
          }}
          aria-label="Open Collection"
        >
          <Book size={32} />
        </button>
      </Tooltip>
      {unreadReports > 0 && (
        <div style={{
          position: 'absolute',
          top: -8,
          right: -8,
          background: 'var(--color-primary)',
          color: 'var(--color-text)',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontWeight: 900,
          border: '3px solid var(--color-text)',
          pointerEvents: 'none',
          zIndex: 10
        }}>
          {unreadReports}
        </div>
      )}
    </div>
  );
};


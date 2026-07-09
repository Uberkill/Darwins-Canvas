import { Clock, Play, Trash2, Plus } from 'lucide-react';
import type { SaveSlotMetadata } from '../../utils/saveSystem';

interface SaveSlotsModalProps {
  mode: 'NEW' | 'LOAD';
  saves: Record<string, SaveSlotMetadata | null>;
  onPlay: (slotId: string, isNew: boolean) => void;
  onDelete: (e: React.MouseEvent, slotId: string) => void;
}

export function SaveSlotsModal({ mode, saves, onPlay, onDelete }: SaveSlotsModalProps) {
  const formatTime = (ms: number) => {
    const d = new Date(ms);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '24px', textAlign: 'center', color: 'var(--color-text)' }}>
        {mode === 'NEW' ? 'Select a Slot to Overwrite' : 'Select a Save to Load'}
      </h2>

      <div className="save-slots-container">
        {['slot_1', 'slot_2', 'slot_3'].map((slotId, index) => {
          const save = saves[slotId];
          if (save) {
            return (
              <button key={slotId} className="save-slot filled" onClick={() => onPlay(slotId, mode === 'NEW')}>
                <div className="slot-info">
                  <div className="slot-title">Ecosystem {index + 1}</div>
                  <div className="slot-stats">
                    <span>{save.creatureCount} Creatures</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} /> {formatTime(save.lastSaved)}
                    </span>
                  </div>
                </div>
                <div className="slot-actions">
                  <div className="btn-icon delete-btn" onClick={(e) => onDelete(e, slotId)}>
                    <Trash2 size={20} />
                  </div>
                  <div className="btn-icon play-btn">
                    <Play size={20} fill="currentColor" />
                  </div>
                </div>
              </button>
            );
          } else {
            return (
              <button 
                key={slotId} 
                className={`save-slot empty ${mode === 'LOAD' ? 'disabled' : ''}`}
                onClick={() => mode === 'NEW' && onPlay(slotId, true)}
                style={{ opacity: mode === 'LOAD' ? 0.5 : 1, cursor: mode === 'LOAD' ? 'default' : 'pointer' }}
              >
                <Plus size={32} />
                <div className="slot-title">New Ecosystem</div>
              </button>
            );
          }
        })}
      </div>
    </>
  );
}

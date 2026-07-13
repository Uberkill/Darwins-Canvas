import { Zap } from 'lucide-react';
import { GAME_VERSION } from '../../constants';
import { PATCH_NOTES, getIconForType } from '../../data/patchNotes';

interface PatchNotesModalProps {
  onClose: () => void;
}

export function PatchNotesModal({ onClose }: PatchNotesModalProps) {
  return (
    <div className="pause-menu-content" style={{ textAlign: 'left', width: '100%', maxWidth: '500px', margin: '0 auto', maxHeight: '70cqh', overflowY: 'auto' }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', marginBottom: '8px', textAlign: 'center', color: 'var(--color-text)' }}>Patch Notes</h2>
      <p style={{ textAlign: 'center', marginBottom: '24px', opacity: 0.7, fontWeight: 'bold' }}>Current Version: {GAME_VERSION}</p>
      
      <div style={{ background: 'var(--color-sand)', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '2px solid rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: '1.4rem', marginBottom: '12px', color: '#6A5ACD', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={20} /> Latest Updates
        </h3>
        
        <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {PATCH_NOTES.map(note => {
            const { icon: Icon, color } = getIconForType(note.type);
            return (
              <li key={note.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <Icon size={18} style={{ marginTop: '2px', color, flexShrink: 0 }} />
                <div>
                  <strong>{note.title}</strong>
                  <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '4px', lineHeight: 1.4 }}>
                    {note.description}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
        <button className="btn-massive" onClick={onClose} style={{ fontSize: '1.2rem', padding: '12px 32px' }}>
          Awesome!
        </button>
      </div>
    </div>
  );
}

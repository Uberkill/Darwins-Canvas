import { FileText, Bug, Zap } from 'lucide-react';
import { GAME_VERSION } from '../../constants';

interface PatchNotesModalProps {
  onClose: () => void;
}

export function PatchNotesModal({ onClose }: PatchNotesModalProps) {
  return (
    <div className="pause-menu-content" style={{ textAlign: 'left', width: '100%', maxWidth: '500px', margin: '0 auto', maxHeight: '70vh', overflowY: 'auto' }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', marginBottom: '8px', textAlign: 'center', color: 'var(--color-text)' }}>Patch Notes</h2>
      <p style={{ textAlign: 'center', marginBottom: '24px', opacity: 0.7, fontWeight: 'bold' }}>Current Version: {GAME_VERSION}</p>
      
      <div style={{ background: 'var(--color-sand)', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '2px solid rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: '1.4rem', marginBottom: '12px', color: '#6A5ACD', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={20} /> Latest Updates
        </h3>
        
        <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <FileText size={18} style={{ marginTop: '2px', color: '#56B6C2', flexShrink: 0 }} />
            <div>
              <strong>Darwinpedia Catalog System</strong>
              <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '4px', lineHeight: 1.4 }}>Added the ability to save creatures to a persistent catalog. Generates detailed lore and lifetime statistics for saved entities. Implemented a 2-pane UI layout.</div>
            </div>
          </li>
          <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <FileText size={18} style={{ marginTop: '2px', color: '#56B6C2', flexShrink: 0 }} />
            <div>
              <strong>Active Research Tracking</strong>
              <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '4px', lineHeight: 1.4 }}>Introduced a targeting system. Players can now pin and monitor vital statistics for up to 3 creatures simultaneously via the HUD. HUD dynamically resizes based on active tracking.</div>
            </div>
          </li>
          <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <FileText size={18} style={{ marginTop: '2px', color: '#56B6C2', flexShrink: 0 }} />
            <div>
              <strong>Map Expansion Support</strong>
              <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '4px', lineHeight: 1.4 }}>Added 2x and 3x map generation options during initialization.</div>
            </div>
          </li>
          <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <Zap size={18} style={{ marginTop: '2px', color: '#facc15', flexShrink: 0 }} />
            <div>
              <strong>Performance Optimization</strong>
              <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '4px', lineHeight: 1.4 }}>Refactored spatial AI and physics calculations. Improved pathfinding efficiency.</div>
            </div>
          </li>
          <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <Bug size={18} style={{ marginTop: '2px', color: '#E06C75', flexShrink: 0 }} />
            <div>
              <strong>Stability Fixes</strong>
              <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '4px', lineHeight: 1.4 }}>Resolved memory leak issues causing runtime crashes during extended simulation sessions.</div>
            </div>
          </li>
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

import { FileText, Bug, Zap, Hand } from 'lucide-react';
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
          <Zap size={20} /> Latest Update (Today)
        </h3>
        
        <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <Bug size={18} style={{ marginTop: '2px', color: '#E06C75', flexShrink: 0 }} />
            <div>
              <strong>Complete Physics Overhaul</strong>
              <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '4px', lineHeight: 1.4 }}>Fixed the infamous "Starvation Circle" and Boids twitching glitches. Creatures now physically push each other apart smoothly and use dynamic radii to reach their food.</div>
            </div>
          </li>
          <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <Hand size={18} style={{ marginTop: '2px', color: '#98C379', flexShrink: 0 }} />
            <div>
              <strong>New God Tools: Clone & Lure</strong>
              <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '4px', lineHeight: 1.4 }}>Added the ability to instantly duplicate your favorite creatures, or drop a Lure to attract the entire ecosystem to a single spot for chaos.</div>
            </div>
          </li>
          <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <FileText size={18} style={{ marginTop: '2px', color: '#56B6C2', flexShrink: 0 }} />
            <div>
              <strong>Audio Engine Rewrite</strong>
              <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '4px', lineHeight: 1.4 }}>Implemented a robust Web Audio API "DJ Crossfader" to seamlessly transition between Day and Night music without memory leaks, alongside fully procedural spatial sound effects.</div>
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

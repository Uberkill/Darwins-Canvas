import { Volume2 } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const masterVolume = useSettingsStore((s) => s.masterVolume);
  const sfxVolume = useSettingsStore((s) => s.sfxVolume);
  const musicVolume = useSettingsStore((s) => s.musicVolume);
  const uiScale = useSettingsStore((s) => s.uiScale);
  const setSettings = useSettingsStore((s) => s.setSettings);

  const handleEmergencyReset = async () => {
    if (confirm('This will completely reset the game cache and force a hard reload. Continue?')) {
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const reg of registrations) {
            await reg.unregister();
          }
        } catch (e) {
          console.error(e);
        }
      }
      try {
        const cacheKeys = await caches.keys();
        for (const key of cacheKeys) {
          await caches.delete(key);
        }
      } catch (e) {
        console.error(e);
      }
      window.location.reload();
    }
  };

  return (
    <div className="pause-menu-content" style={{ textAlign: 'left', width: '100%', maxWidth: '400px', margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', marginBottom: '16px', textAlign: 'center', color: 'var(--color-text)' }}>Settings</h2>
      
      <div className="settings-group">
        <div className="settings-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Volume2 size={20} /> Master Volume
        </div>
        <input 
          type="range" 
          min="0" max="1" step="0.05" 
          value={masterVolume} 
          onChange={(e) => setSettings({ masterVolume: parseFloat(e.target.value) })}
        />
      </div>

      <div className="settings-group">
        <div className="settings-label">SFX Volume</div>
        <input 
          type="range" 
          min="0" max="1" step="0.05" 
          value={sfxVolume} 
          onChange={(e) => setSettings({ sfxVolume: parseFloat(e.target.value) })}
        />
      </div>

      <div className="settings-group">
        <div className="settings-label">Music Volume</div>
        <input 
          type="range" 
          min="0" max="1" step="0.05" 
          value={musicVolume} 
          onChange={(e) => setSettings({ musicVolume: parseFloat(e.target.value) })}
        />
      </div>

      <div className="pause-section-title" style={{ marginTop: '24px', marginBottom: '12px', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text)' }}>UI Scale</div>
      
      <div className="scale-buttons" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        {[0.8, 1.0, 1.25, 1.5].map((scale) => (
          <button 
            key={scale}
            className={`scale-btn ${uiScale === scale ? 'active' : ''}`}
            onClick={() => setSettings({ uiScale: scale })}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: uiScale === scale ? '#7C9A92' : '#E2DDD5', color: uiScale === scale ? 'white' : 'inherit', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {scale}x
          </button>
        ))}
      </div>

      <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center' }}>
        <button className="btn-massive" onClick={onClose} style={{ fontSize: '1.2rem', padding: '12px 32px' }}>
          Done
        </button>
      </div>

      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
        <button 
          onClick={handleEmergencyReset} 
          style={{ background: 'none', border: 'none', color: '#ff4444', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          Emergency App Reset
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export function EmergencyResetButton() {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleEmergencyReset = async () => {
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
  };

  if (isConfirming) {
    return (
      <div style={{ marginTop: '24px', padding: '16px', border: '2px solid #ff4444', borderRadius: '12px', background: 'rgba(255, 68, 68, 0.1)', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#ff4444', marginBottom: '8px', fontWeight: 'bold' }}>
          <AlertTriangle size={24} />
          WARNING
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text)', marginBottom: '16px', lineHeight: '1.4' }}>
          This will completely reset the game cache and force a hard reload. Only do this if your game is stuck or not updating properly.
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button 
            className="btn-secondary" 
            onClick={() => setIsConfirming(false)}
          >
            No, Go Back
          </button>
          <button 
            className="btn-secondary" 
            style={{ borderColor: '#ff4444', color: '#ff4444', background: 'transparent' }}
            onClick={handleEmergencyReset}
          >
            Yes, Reset App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
      <button 
        className="btn-secondary"
        style={{ borderColor: '#ff4444', color: '#ff4444', background: 'transparent', display: 'flex', alignItems: 'center', gap: '8px' }}
        onClick={() => setIsConfirming(true)}
      >
        <AlertTriangle size={18} />
        Emergency App Reset
      </button>
    </div>
  );
}

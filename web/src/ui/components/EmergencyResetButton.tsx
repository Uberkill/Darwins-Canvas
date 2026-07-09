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
      <div style={{ 
        background: 'rgba(255, 68, 68, 0.05)', 
        border: '2px solid #ff4444', 
        borderRadius: '12px', 
        padding: '16px', 
        textAlign: 'center',
        fontFamily: 'var(--font-body)',
        width: '100%'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#ff4444', marginBottom: '8px', fontWeight: 800 }}>
          <AlertTriangle size={16} />
          RESET GAME CACHE?
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text)', marginBottom: '16px', lineHeight: '1.4' }}>
          This completely wipes the cache and forces a hard reload. Only do this if your game is stuck.
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button 
            style={{ 
              fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 800, padding: '8px 16px', 
              borderRadius: '20px', background: 'white', color: 'var(--color-text-muted)', border: '2px solid #E2DDD5', cursor: 'pointer' 
            }}
            onClick={() => setIsConfirming(false)}
          >
            Cancel
          </button>
          <button 
            style={{ 
              fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 800, padding: '8px 16px', 
              borderRadius: '20px', background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', border: '2px solid #ff4444', cursor: 'pointer' 
            }}
            onClick={handleEmergencyReset}
          >
            Yes, Wipe It
          </button>
        </div>
      </div>
    );
  }

  return (
    <button 
      style={{ 
        fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 800, padding: '8px 16px', 
        borderRadius: '20px', background: 'transparent', color: '#ff4444', border: '2px solid #ff4444', 
        display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' 
      }}
      onClick={() => setIsConfirming(true)}
    >
      <AlertTriangle size={14} />
      Reset App
    </button>
  );
}

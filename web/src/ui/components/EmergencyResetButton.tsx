import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useEngineStore } from '../../store/useEngineStore';
import { saveGame } from '../../utils/saveSystem';
import { worldRef } from '../../engine/worldRef';

export function EmergencyResetButton() {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleEmergencyReset = async () => {
    setIsResetting(true);

    // 1. Wipe IndexedDB databases (Saves & Custom Creatures)
    try {
      if (indexedDB.databases) {
        const dbs = await indexedDB.databases();
        for (const db of dbs) {
          if (db.name) indexedDB.deleteDatabase(db.name);
        }
      } else {
        indexedDB.deleteDatabase('darwins-canvas-saves');
        indexedDB.deleteDatabase('darwins-canvas-collection');
      }
    } catch (e) {
      console.error(e);
      // Fallback if databases() throws (e.g. security errors in some browsers)
      try {
        indexedDB.deleteDatabase('darwins-canvas-saves');
        indexedDB.deleteDatabase('darwins-canvas-collection');
      } catch (err) {}
    }

    // 2. Clear Local Storage & Session Storage (Settings, UI states)
    localStorage.clear();
    sessionStorage.clear();

    // 3. Wipe PWA caches and unregister SW
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
          FACTORY RESET APP?
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text)', marginBottom: '16px', lineHeight: '1.4' }}>
          This completely wipes <b>ALL saved games, custom creatures, settings, and caches</b>. Only do this if your game is completely broken.
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setIsConfirming(false)}
            disabled={isResetting}
            style={{ 
              flex: 1, 
              padding: '8px', 
              borderRadius: '8px', 
              border: 'none', 
              background: '#e0e0e0',
              color: '#333',
              cursor: isResetting ? 'default' : 'pointer',
              fontWeight: 'bold',
              opacity: isResetting ? 0.5 : 1
            }}>
            Cancel
          </button>
          <button 
            onClick={handleEmergencyReset}
            disabled={isResetting}
            style={{ 
              flex: 1, 
              padding: '8px', 
              borderRadius: '8px', 
              border: 'none', 
              background: '#ff4444', 
              color: 'white',
              cursor: isResetting ? 'default' : 'pointer',
              fontWeight: 'bold',
              opacity: isResetting ? 0.5 : 1
            }}>
            {isResetting ? 'Saving...' : 'Yes, Hard Reset'}
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

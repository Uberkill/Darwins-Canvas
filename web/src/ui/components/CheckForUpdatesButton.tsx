import { useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export function CheckForUpdatesButton() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'up-to-date' | 'error'>('idle');

  const checkForUpdates = async () => {
    if (!('serviceWorker' in navigator)) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    setStatus('checking');

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      
      // If an update is found, the vite-plugin-pwa 'needRefresh' event will fire,
      // and the UpdatePrompt toast will automatically appear!
      // Otherwise, we just tell the user they are up to date.
      
      // We add a small delay so the 'checking' state is visible.
      setTimeout(() => {
        setStatus('up-to-date');
        setTimeout(() => setStatus('idle'), 3000);
      }, 800);
      
    } catch (err) {
      console.error('Failed to check for updates:', err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <button 
      style={{ 
        fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 800, padding: '8px 16px', 
        borderRadius: '20px', background: 'transparent', color: 'var(--color-text)', border: '2px solid var(--color-border)', 
        display: 'flex', alignItems: 'center', gap: '6px', cursor: status === 'checking' ? 'default' : 'pointer',
        opacity: status === 'checking' ? 0.7 : 1,
        marginBottom: '12px'
      }}
      onClick={checkForUpdates}
      disabled={status === 'checking'}
    >
      {status === 'idle' && <><RefreshCw size={14} /> Check for Updates</>}
      {status === 'checking' && <><RefreshCw size={14} className="spin" /> Checking...</>}
      {status === 'up-to-date' && <><CheckCircle size={14} color="var(--color-tertiary)" /> Up to Date</>}
      {status === 'error' && <><AlertCircle size={14} color="#ff4444" /> Check Failed</>}
    </button>
  );
}

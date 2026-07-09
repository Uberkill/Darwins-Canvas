import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Multi-tab Zombie PWA Defense: 
// If another tab triggers the SW to update, this tab will lose access to old JS chunks.
// We must immediately reload to sync with the new SW.
if ('serviceWorker' in navigator) {
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true
      window.location.reload()
    }
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

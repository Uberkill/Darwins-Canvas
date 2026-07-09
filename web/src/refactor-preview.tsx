import React from 'react'
import ReactDOM from 'react-dom/client'
import { PauseMenuMockup } from './ui/PauseMenuMockup'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'url(/src/assets/bg.png)', // fallback background or just color
      backgroundColor: 'var(--color-bg-base)',
      backgroundImage: 'radial-gradient(var(--color-bg-dots) 15%, transparent 15%)',
      backgroundSize: '32px 32px'
    }}>
      <PauseMenuMockup />
    </div>
  </React.StrictMode>,
)

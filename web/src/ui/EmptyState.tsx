import { useEffect, useState } from 'react'
import { EMPTY_STATE_DELAY_MS } from '../constants'
import { ArrowDown } from 'lucide-react'

export function EmptyState() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), EMPTY_STATE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (!show) return null

  return (
    <div 
      className="modal-card" 
      role="status" 
      aria-live="polite"
      style={{
        position: 'absolute',
        bottom: 'calc(max(32px, env(safe-area-inset-bottom)) + 88px)',
        right: 'max(32px, env(safe-area-inset-right))',
        width: '280px',
        maxWidth: 'calc(100vw - 64px)',
        textAlign: 'center',
        padding: '24px',
        animation: 'bounce-float 2s infinite ease-in-out',
        zIndex: 20
      }}
    >
      <div style={{ fontWeight: 900, fontSize: '20px', marginBottom: '8px' }}>It's quiet in here...</div>
      <div style={{ color: 'var(--color-text-muted)', fontWeight: 800 }}>Draw your first creature to bring the canvas to life!</div>
      <div style={{ marginTop: '16px', color: 'var(--color-primary)', display: 'flex', justifyContent: 'center' }}>
        <ArrowDown size={32} />
      </div>
    </div>
  )
}

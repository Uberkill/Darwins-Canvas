import { useEffect, useState } from 'react'
import { Smartphone } from 'lucide-react'

export function PortraitLock() {
  const [isPortrait, setIsPortrait] = useState(false)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const isVertical = window.innerHeight > window.innerWidth
      const activeTag = document.activeElement?.tagName
      const keyboardLikely = activeTag === 'INPUT' || activeTag === 'TEXTAREA'
      
      setIsPortrait(isVertical)
      setIsKeyboardOpen(keyboardLikely)
    }

    window.addEventListener('resize', handleResize)
    
    // Listen for focusout to quickly clear keyboard state
    const handleFocusOut = () => {
      setTimeout(handleResize, 100) // slight delay to allow resize to happen
    }
    window.addEventListener('focusout', handleFocusOut)

    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('focusout', handleFocusOut)
    }
  }, [])

  if (!isPortrait || isKeyboardOpen) {
    return null
  }

  return (
    <div className="portrait-lock-overlay">
      <div className="portrait-lock-content">
        <Smartphone size={64} className="rotate-icon" />
        <h2>Please Rotate Your Device</h2>
        <p>Darwin's Canvas requires Landscape mode for the best experience.</p>
      </div>
    </div>
  )
}

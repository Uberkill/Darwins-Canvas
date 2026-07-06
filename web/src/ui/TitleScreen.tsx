import { useState } from 'react'
import { Palette } from 'lucide-react'

interface TitleScreenProps {
  onPlay: () => void
}

export function TitleScreen({ onPlay }: TitleScreenProps) {
  const [isHiding, setIsHiding] = useState(false)

  const handlePlay = () => {
    setIsHiding(true)
    setTimeout(() => {
      onPlay()
    }, 600) // matches CSS transition time
  }

  return (
    <div className={`title-screen ${isHiding ? 'hidden' : ''}`}>
      <div className="title-logo" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        Darwin's Canvas <Palette size={64} />
      </div>
      <button className="btn-play" onClick={handlePlay}>Play</button>
    </div>
  )
}

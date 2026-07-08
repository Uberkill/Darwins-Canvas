import { LineChart } from 'lucide-react'
import { audio } from '../engine/audioEngine'
// Re-using tutorial-button styles for consistency
import './TutorialModal.css'
import { useUIStore } from '../store/useUIStore';

export function StatsButton() {
  const openStats = useUIStore((s) => s.openStats)

  return (
    <button className="tutorial-button" onClick={() => {
      audio.playUIClick()
      openStats()
    }} title="Ecosystem Statistics">
      <LineChart size={32} />
    </button>
  )
}

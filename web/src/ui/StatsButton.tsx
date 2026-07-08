import { LineChart } from 'lucide-react'
import { useStore } from '../store/useStore'
import { audio } from '../engine/audioEngine'
// Re-using tutorial-button styles for consistency
import './TutorialModal.css'

export function StatsButton() {
  const openStats = useStore((s) => s.openStats)

  return (
    <button className="tutorial-button" onClick={() => {
      audio.playUIClick()
      openStats()
    }} title="Ecosystem Statistics">
      <LineChart size={32} />
    </button>
  )
}

import { LineChart } from 'lucide-react'
import { audio } from '../engine/audioEngine'
// Re-using tutorial-button styles for consistency
import './TutorialModal.css'
import { useUIStore } from '../store/useUIStore';
import { Tooltip } from './Tooltip';

export function StatsButton() {
  const openStats = useUIStore((s) => s.openStats)

  return (
    <Tooltip content="Ecosystem Stats" position="bottom" align="left" variant="god">
      <button className="tutorial-button" onClick={() => {
        audio.playUIClick()
        openStats()
      }}>
        <LineChart size={32} />
      </button>
    </Tooltip>
  )
}


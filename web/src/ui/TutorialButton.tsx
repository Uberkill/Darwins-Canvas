import { HelpCircle } from 'lucide-react'
import './TutorialModal.css'
import { useUIStore } from '../store/useUIStore';
import { Tooltip } from './Tooltip';

export function TutorialButton() {
  const openTutorial = useUIStore((s) => s.openTutorial)

  return (
    <Tooltip content="Help & Controls" position="bottom" align="left" variant="god">
      <button className="tutorial-button" onClick={openTutorial}>
        <HelpCircle size={32} />
      </button>
    </Tooltip>
  )
}

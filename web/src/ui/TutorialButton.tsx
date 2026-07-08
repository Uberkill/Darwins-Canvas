import { HelpCircle } from 'lucide-react'
import './TutorialModal.css'
import { useUIStore } from '../store/useUIStore';

export function TutorialButton() {
  const openTutorial = useUIStore((s) => s.openTutorial)

  return (
    <button className="tutorial-button" onClick={openTutorial}>
      <HelpCircle size={32} />
    </button>
  )
}

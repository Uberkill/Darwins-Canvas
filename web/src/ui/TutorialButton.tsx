import { HelpCircle } from 'lucide-react'
import { useStore } from '../store/useStore'
import './TutorialModal.css'

export function TutorialButton() {
  const openTutorial = useStore((s) => s.openTutorial)

  return (
    <button className="tutorial-button" onClick={openTutorial}>
      <HelpCircle size={32} />
    </button>
  )
}

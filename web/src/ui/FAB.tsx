
interface FABProps {
  creatureCount: number
}

import { Plus } from 'lucide-react'
import { useUIStore } from '../store/useUIStore';

/**
 * FAB — floating action button that opens the creation panel.
 * Pulses when the ecosystem is empty to guide the first-time user.
 */
export function FAB({ creatureCount }: FABProps) {
  const openPanel = useUIStore((s) => s.openPanel)

  return (
    <button
      id="fab-create"
      className="fab"
      style={creatureCount === 0 ? { animation: 'bounce-float 2s infinite ease-in-out' } : undefined}
      onClick={openPanel}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      aria-label="Create a new creature"
    >
      <Plus size={32} strokeWidth={3.5} />
    </button>
  )
}

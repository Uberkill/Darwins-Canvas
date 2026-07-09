/// <reference types="vite-plugin-pwa/client" />
import { useRegisterSW } from 'virtual:pwa-register/react'
import { saveGame } from '../../utils/saveSystem'
import { worldRef } from '../../engine/worldRef'
import { useEngineStore } from '../../store/useEngineStore'
import { AlertCircle } from 'lucide-react'
import './UpdatePrompt.css'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error: Error) {
      console.log('SW registration error', error)
    },
  })

  const close = () => {
    setNeedRefresh(false)
  }

  const handleUpdate = async () => {
    // 1. Force flush the save state
    const activeSlot = useEngineStore.getState().activeSaveSlot
    if (activeSlot) {
      await saveGame(activeSlot, worldRef.current, "Autosaved Before Update")
    }
    // 2. Perform the update
    updateServiceWorker(true)
  }

  if (!needRefresh) return null

  return (
    <div className="update-prompt-overlay">
      <div className="update-prompt-toast">
        <div className="update-prompt-header">
          <AlertCircle size={24} color="#facc15" />
          <h3>Update Available</h3>
        </div>
        <p>A new version of Darwin's Canvas is ready! Your current ecosystem will be autosaved before reloading.</p>
        <div className="update-prompt-actions">
          <button className="btn-secondary" onClick={close}>Later</button>
          <button className="btn-primary" onClick={handleUpdate}>Update Now</button>
        </div>
      </div>
    </div>
  )
}

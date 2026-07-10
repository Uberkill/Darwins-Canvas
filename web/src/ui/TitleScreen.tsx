import { useState, useEffect } from 'react'
import { Settings, X, Power, FileText } from 'lucide-react'
import { audio } from '../engine/audioEngine'
import { useSaves } from '../hooks/useSaves'
import { DoodleLayer } from './components/DoodleLayer'
import { SettingsModal } from './components/SettingsModal'
import { SaveSlotsModal } from './components/SaveSlotsModal'
import { PatchNotesModal } from './components/PatchNotesModal'
import { MapSizePromptModal } from './components/MapSizePromptModal'
import { updateWorldDimensions, centerCamera, worldRef } from '../engine/worldRef'
import './PauseMenuModal.css'
import './TitleScreen.css'

interface TitleScreenProps {
  onPlay: () => void
}

type MenuState = 'ROOT' | 'SLOT_MODAL_NEW' | 'SLOT_MODAL_LOAD' | 'SETTINGS' | 'PATCH_NOTES' | 'MAP_SIZE_PROMPT'

export function TitleScreen({ onPlay }: TitleScreenProps) {
  const [isHiding, setIsHiding] = useState(false)
  const [menuState, setMenuState] = useState<MenuState>('ROOT')
  const [pendingPlaySlot, setPendingPlaySlot] = useState<{ slotId: string, isNew: boolean } | null>(null)
  
  const { saves, hasSaves, mostRecentSlot, executePlay, removeSave } = useSaves();

  useEffect(() => {
    // Attempt to start BGM immediately (may be blocked by browser autoplay policy)
    audio.startBGM()
    
    // Fallback: start BGM on the very first user interaction anywhere on the page
    const handleFirstInteraction = () => {
      audio.startBGM()
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
      window.removeEventListener('touchstart', handleFirstInteraction)
    }
    window.addEventListener('click', handleFirstInteraction)
    window.addEventListener('keydown', handleFirstInteraction)
    window.addEventListener('touchstart', handleFirstInteraction)
    
    return () => {
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
      window.removeEventListener('touchstart', handleFirstInteraction)
    }
  }, [])

  const handlePlayRequest = (slotId: string, isNew: boolean) => {
    if (isNew) {
      setPendingPlaySlot({ slotId, isNew })
      setMenuState('MAP_SIZE_PROMPT')
    } else {
      executePlay(slotId, isNew)
      setIsHiding(true)
      setTimeout(() => {
        onPlay()
      }, 600)
    }
  }

  const handleMapSizeSelect = (multiplier: number) => {
    if (!pendingPlaySlot) return;
    
    worldRef.current.mapSizeMultiplier = multiplier;
    updateWorldDimensions();
    centerCamera();

    executePlay(pendingPlaySlot.slotId, pendingPlaySlot.isNew)
    setIsHiding(true)
    setMenuState('ROOT')
    setTimeout(() => {
      onPlay()
    }, 600)
  }

  const handleDelete = (e: React.MouseEvent, slotId: string) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this ecosystem?')) {
      removeSave(slotId)
    }
  }

  const handleFrictionlessPlay = () => {
    // Pick the first empty slot, or slot_1 if all full (unlikely if they have no saves)
    let slotToUse = 'slot_1'
    for (const id of ['slot_1', 'slot_2', 'slot_3']) {
      if (!saves[id]) {
        slotToUse = id
        break
      }
    }
    handlePlayRequest(slotToUse, true)
  }

  const handleContinue = () => {
    if (mostRecentSlot) {
      handlePlayRequest(mostRecentSlot, false)
    }
  }

  const handleQuit = () => {
    // In browser context window.close() usually fails, so fallback to a nice fade out
    setIsHiding(true)
    setTimeout(() => {
      document.body.innerHTML = '<div style="display:flex; height:100vh; width:100vw; align-items:center; justify-content:center; background:#4A3B32; color:white; font-family:Nunito, sans-serif; font-size:3rem; font-weight:900;">Thanks for playing Darwin\'s Canvas!</div>'
    }, 600)
    try {
      window.close()
    } catch {
      // Ignore
    }
  }

  return (
    <div className={`title-screen ${isHiding ? 'hidden' : ''}`}>
      
      <DoodleLayer />

      <div className="title-screen-container">
        <div className="title-logo" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          Darwin's Canvas
        </div>
        
        {!hasSaves ? (
          <div className="button-stack">
            <button className="btn-massive" onClick={handleFrictionlessPlay}>
              Play
            </button>
          </div>
        ) : (
          <div className="button-stack">
            <button className="btn-massive" onClick={handleContinue}>
              Continue
            </button>
            <div className="secondary-button-row">
              <button className="btn-secondary" onClick={() => setMenuState('SLOT_MODAL_NEW')}>
                New Game
              </button>
              <button className="btn-secondary" onClick={() => setMenuState('SLOT_MODAL_LOAD')}>
                Load Game
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bottom-corner-controls">
        <button className="icon-btn-tertiary patch-btn" title="Patch Notes" onClick={() => setMenuState('PATCH_NOTES')}>
          <FileText size={24} />
        </button>
        <button className="icon-btn-tertiary settings-btn" title="Settings" onClick={() => setMenuState('SETTINGS')}>
          <Settings size={24} />
        </button>
        <button className="icon-btn-tertiary quit-btn" title="Quit" onClick={handleQuit}>
          <Power size={24} />
        </button>
      </div>

      {/* Save Slots / Settings Modal */}
      {(menuState !== 'ROOT') && (
        <div className="slots-modal-overlay">
          <div className="slots-modal-panel">
            <div className="slots-modal-close" onClick={() => setMenuState('ROOT')}>
              <X size={32} />
            </div>
            
            {menuState === 'SETTINGS' && (
              <SettingsModal onClose={() => setMenuState('ROOT')} />
            )}

            {menuState === 'PATCH_NOTES' && (
              <PatchNotesModal onClose={() => setMenuState('ROOT')} />
            )}

            {(menuState === 'SLOT_MODAL_NEW' || menuState === 'SLOT_MODAL_LOAD') && (
              <SaveSlotsModal 
                mode={menuState === 'SLOT_MODAL_NEW' ? 'NEW' : 'LOAD'} 
                saves={saves} 
                onPlay={handlePlayRequest} 
                onDelete={handleDelete} 
              />
            )}

            {menuState === 'MAP_SIZE_PROMPT' && (
              <MapSizePromptModal onSelect={handleMapSizeSelect} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

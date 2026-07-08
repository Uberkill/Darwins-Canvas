import { useState } from 'react'
import { Play, Save, Settings, LogOut, Check, Volume2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import { saveGame } from '../utils/saveSystem'
import { worldRef } from '../engine/worldRef'
import './PauseMenuModal.css'

export function PauseMenuModal() {
  const isOpen = useStore((s) => s.isPauseMenuOpen)
  const close = useStore((s) => s.closePauseMenu)
  const activeSaveSlot = useStore((s) => s.activeSaveSlot)
  
  const masterVolume = useStore((s) => s.masterVolume)
  const sfxVolume = useStore((s) => s.sfxVolume)
  const musicVolume = useStore((s) => s.musicVolume)
  const uiScale = useStore((s) => s.uiScale)
  const setSettings = useStore((s) => s.setSettings)

  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'main' | 'settings'>('main')

  if (!isOpen) return null

  const handleManualSave = async () => {
    if (!activeSaveSlot || isSaving) return
    
    setIsSaving(true)
    setSaveSuccess(false)
    
    try {
      await saveGame(activeSaveSlot, worldRef.current, `Ecosystem ${activeSaveSlot.replace('slot_', '')}`)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (e) {
      console.error('Manual save failed:', e)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAndQuit = async () => {
    if (activeSaveSlot && !isSaving) {
      setIsSaving(true)
      try {
        await saveGame(activeSaveSlot, worldRef.current, `Ecosystem ${activeSaveSlot.replace('slot_', '')}`)
      } catch (e) {
        console.error('Save and quit failed:', e)
      }
      setIsSaving(false)
    }
    
    window.dispatchEvent(new CustomEvent('QUIT_TO_TITLE'))
    close()
  }

  return (
    <div className="pause-backdrop">
      <div className="pause-modal">
        <div className="pause-header">
          <h2>{activeTab === 'settings' ? 'Settings' : 'Paused'}</h2>
        </div>

        <div className="pause-content">
          {activeTab === 'main' ? (
            <>
              <button className="pause-btn primary" onClick={close}>
                <Play size={24} /> Resume Game
              </button>
              
              <button 
                className="pause-btn" 
                onClick={handleManualSave}
                disabled={isSaving || saveSuccess}
              >
                {saveSuccess ? <Check size={24} color="var(--color-tertiary)" /> : <Save size={24} />}
                {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Manual Save'}
              </button>

              <div className="pause-section-title">Options</div>
              
              <button className="pause-btn" onClick={() => setActiveTab('settings')}>
                <Settings size={24} /> Audio & UI Scale
              </button>

              <div style={{ height: '8px' }} />

              <button 
                className="pause-btn danger" 
                onClick={handleSaveAndQuit}
                disabled={isSaving}
              >
                <LogOut size={24} /> Save & Quit
              </button>
            </>
          ) : (
            <>
              <div className="settings-group">
                <div className="settings-label">
                  <Volume2 size={20} /> Master Volume
                </div>
                <input 
                  type="range" 
                  min="0" max="1" step="0.05" 
                  value={masterVolume} 
                  onChange={(e) => setSettings({ masterVolume: parseFloat(e.target.value) })}
                />
              </div>

              <div className="settings-group">
                <div className="settings-label">SFX Volume</div>
                <input 
                  type="range" 
                  min="0" max="1" step="0.05" 
                  value={sfxVolume} 
                  onChange={(e) => setSettings({ sfxVolume: parseFloat(e.target.value) })}
                />
              </div>

              <div className="settings-group">
                <div className="settings-label">Music Volume</div>
                <input 
                  type="range" 
                  min="0" max="1" step="0.05" 
                  value={musicVolume} 
                  onChange={(e) => setSettings({ musicVolume: parseFloat(e.target.value) })}
                />
              </div>

              <div className="pause-section-title">UI Scale</div>
              
              <div className="scale-buttons">
                {[0.8, 1.0, 1.25, 1.5].map((scale) => (
                  <button 
                    key={scale}
                    className={`scale-btn ${uiScale === scale ? 'active' : ''}`}
                    onClick={() => setSettings({ uiScale: scale })}
                  >
                    {scale}x
                  </button>
                ))}
              </div>

              <div style={{ height: '16px' }} />

              <button className="pause-btn" onClick={() => setActiveTab('main')}>
                <Check size={24} /> Apply & Back
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

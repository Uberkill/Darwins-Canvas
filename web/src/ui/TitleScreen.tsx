import { useState, useEffect } from 'react'
import { Play, Trash2, Plus, Clock, Settings, X, Volume2, Power } from 'lucide-react'
import { listSaves, deleteGame, loadGame } from '../utils/saveSystem'
import type { SaveSlotMetadata } from '../utils/saveSystem'
import { useStore } from '../store/useStore'
import { worldRef } from '../engine/worldRef'
import { setEntities, clearEntities } from '../engine/entityManager'
import './PauseMenuModal.css'
import './TitleScreen.css'

interface TitleScreenProps {
  onPlay: () => void
}

type MenuState = 'ROOT' | 'SLOT_MODAL_NEW' | 'SLOT_MODAL_LOAD' | 'SETTINGS'

export function TitleScreen({ onPlay }: TitleScreenProps) {
  const [isHiding, setIsHiding] = useState(false)
  const [frightened, setFrightened] = useState<Record<number, boolean>>({})
  const [menuState, setMenuState] = useState<MenuState>('ROOT')
  const masterVolume = useStore((s) => s.masterVolume)
  const sfxVolume = useStore((s) => s.sfxVolume)
  const musicVolume = useStore((s) => s.musicVolume)
  const uiScale = useStore((s) => s.uiScale)
  const setSettings = useStore((s) => s.setSettings)
  
  const [saves, setSaves] = useState<Record<string, SaveSlotMetadata | null>>({
    'slot_1': null,
    'slot_2': null,
    'slot_3': null,
  })

  useEffect(() => {
    async function fetchSaves() {
      const allSaves = await listSaves()
      const newSaves: Record<string, SaveSlotMetadata | null> = { 'slot_1': null, 'slot_2': null, 'slot_3': null }
      for (const save of allSaves) {
        if (newSaves[save.id] !== undefined) {
          newSaves[save.id] = save
        }
      }
      setSaves(newSaves)
    }
    fetchSaves()
  }, [])

  const hasSaves = Object.values(saves).some(s => s !== null)
  
  // Find the slot with the most recent save time
  const mostRecentSlot = Object.values(saves).reduce<string | null>((recent, save) => {
    if (!save) return recent
    if (!recent) return save.id
    const recentSave = saves[recent]
    if (recentSave && save.lastSaved > recentSave.lastSaved) {
      return save.id
    }
    return recent
  }, null)

  const handlePlay = async (slotId: string, isNew: boolean) => {
    useStore.getState().setActiveSaveSlot(slotId)
    
    if (!isNew) {
      const save = await loadGame(slotId)
      if (save) {
        // Hydrate world
        setEntities(worldRef.current, save.creatures || [], save.plants || [])
        worldRef.current.timeOfDay = save.timeOfDay || 0.1
        worldRef.current.weather = save.weather || 'CLEAR'
        worldRef.current.totalTime = save.totalTime || 0
      }
    } else {
      // Start fresh, wipe worldRef cleanly except bounds
      clearEntities(worldRef.current)
      worldRef.current.timeOfDay = 0.1
      worldRef.current.totalTime = 0
      
      // Trigger onboarding for new games
      useStore.getState().openOnboarding()
    }

    setIsHiding(true)
    setTimeout(() => {
      onPlay()
    }, 600) // matches CSS transition time
  }

  const handleDelete = async (e: React.MouseEvent, slotId: string) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this ecosystem?')) {
      await deleteGame(slotId)
      setSaves(prev => ({ ...prev, [slotId]: null }))
    }
  }

  const formatTime = (ms: number) => {
    const d = new Date(ms)
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
    handlePlay(slotToUse, true)
  }

  const handleContinue = () => {
    if (mostRecentSlot) {
      handlePlay(mostRecentSlot, false)
    }
  }

  const handlePokeDoodle = (id: number) => {
    setFrightened(prev => ({ ...prev, [id]: true }))
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
      
      <div className="doodle-layer">
        {/* Little Crawler Bug */}
        <svg onClick={() => handlePokeDoodle(1)} className={`doodle doodle-bug ${frightened[1] ? 'run-away' : ''}`} viewBox="0 0 100 100" fill="none" stroke="#FF6B9E" strokeWidth="5" strokeLinecap="round">
          <ellipse cx="50" cy="50" rx="20" ry="30" fill="#FFF6E5" />
          <path d="M30,40 L15,30 M30,50 L10,50 M30,60 L15,70" />
          <path d="M70,40 L85,30 M70,50 L90,50 M70,60 L85,70" />
          <circle cx="42" cy="40" r="4" fill="#4A3B32" stroke="none"/>
          <circle cx="58" cy="40" r="4" fill="#4A3B32" stroke="none"/>
        </svg>

        {/* Cute Slime/Blob */}
        <svg onClick={() => handlePokeDoodle(2)} className={`doodle doodle-blob ${frightened[2] ? 'run-away-right' : ''}`} viewBox="0 0 100 100" fill="none" stroke="#00D8A1" strokeWidth="5" strokeLinecap="round">
          <path d="M50,80 Q20,80 20,55 Q20,20 50,20 Q80,20 80,55 Q80,80 50,80 Z" fill="#FFF6E5" />
          <circle cx="35" cy="50" r="5" fill="#4A3B32" stroke="none" />
          <circle cx="65" cy="50" r="5" fill="#4A3B32" stroke="none" />
          <path d="M45,60 Q50,65 55,60" />
        </svg>

        {/* Flying Creature */}
        <svg onClick={() => handlePokeDoodle(3)} className={`doodle doodle-fly ${frightened[3] ? 'run-away' : ''}`} viewBox="0 0 100 100" fill="none" stroke="#36C5F0" strokeWidth="5" strokeLinecap="round">
          <circle cx="50" cy="50" r="15" fill="#FFF6E5" />
          <path d="M35,40 Q20,20 10,40 Q20,50 35,50" fill="#FFF6E5" />
          <path d="M65,40 Q80,20 90,40 Q80,50 65,50" fill="#FFF6E5" />
          <circle cx="45" cy="48" r="3" fill="#4A3B32" stroke="none" />
          <circle cx="55" cy="48" r="3" fill="#4A3B32" stroke="none" />
        </svg>
        
        {/* Right Margin Crawler */}
        <svg onClick={() => handlePokeDoodle(4)} className={`doodle doodle-crawler ${frightened[4] ? 'run-away-right' : ''}`} viewBox="0 0 100 100" fill="none" stroke="#FFC837" strokeWidth="5" strokeLinecap="round">
          <path d="M20,50 Q50,20 80,50 Q50,80 20,50" fill="#FFF6E5" />
          <path d="M30,50 L30,75 M50,55 L50,80 M70,50 L70,75" />
          <circle cx="65" cy="45" r="4" fill="#4A3B32" stroke="none" />
        </svg>

        {/* Star */}
        <svg onClick={() => handlePokeDoodle(5)} className={`doodle doodle-star ${frightened[5] ? 'run-away' : ''}`} viewBox="0 0 100 100" fill="none" stroke="#00D8A1" strokeWidth="5" strokeLinecap="round">
          <path d="M50,10 L60,40 L90,40 L65,60 L75,90 L50,70 L25,90 L35,60 L10,40 L40,40 Z" fill="#FFF6E5" />
          <circle cx="40" cy="55" r="4" fill="#4A3B32" stroke="none" />
          <circle cx="60" cy="55" r="4" fill="#4A3B32" stroke="none" />
        </svg>

        {/* Snake */}
        <svg onClick={() => handlePokeDoodle(6)} className={`doodle doodle-snake ${frightened[6] ? 'run-away' : ''}`} viewBox="0 0 100 100" fill="none" stroke="#FF6B9E" strokeWidth="5" strokeLinecap="round">
          <path d="M50,10 Q20,30 50,50 T50,90" fill="none" />
          <circle cx="50" cy="90" r="10" fill="#FFF6E5" />
          <circle cx="45" cy="92" r="3" fill="#4A3B32" stroke="none" />
          <circle cx="55" cy="92" r="3" fill="#4A3B32" stroke="none" />
        </svg>
      </div>

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
              <div className="pause-menu-content" style={{ textAlign: 'left', width: '100%', maxWidth: '400px', margin: '0 auto' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', marginBottom: '16px', textAlign: 'center', color: 'var(--color-text)' }}>Settings</h2>
                
                <div className="settings-group">
                  <div className="settings-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

                <div className="pause-section-title" style={{ marginTop: '24px', marginBottom: '12px', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text)' }}>UI Scale</div>
                
                <div className="scale-buttons" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  {[0.8, 1.0, 1.25, 1.5].map((scale) => (
                    <button 
                      key={scale}
                      className={`scale-btn ${uiScale === scale ? 'active' : ''}`}
                      onClick={() => setSettings({ uiScale: scale })}
                      style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: uiScale === scale ? '#7C9A92' : '#E2DDD5', color: uiScale === scale ? 'white' : 'inherit', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      {scale}x
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center' }}>
                  <button className="btn-massive" onClick={() => setMenuState('ROOT')} style={{ fontSize: '1.2rem', padding: '12px 32px' }}>
                    Done
                  </button>
                </div>
              </div>
            )}

            {(menuState === 'SLOT_MODAL_NEW' || menuState === 'SLOT_MODAL_LOAD') && (
              <>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '24px', textAlign: 'center', color: 'var(--color-text)' }}>
                  {menuState === 'SLOT_MODAL_NEW' ? 'Select a Slot to Overwrite' : 'Select a Save to Load'}
                </h2>

                <div className="save-slots-container">
              {['slot_1', 'slot_2', 'slot_3'].map((slotId, index) => {
                const save = saves[slotId]
                if (save) {
                  return (
                    <button key={slotId} className="save-slot filled" onClick={() => handlePlay(slotId, menuState === 'SLOT_MODAL_NEW')}>
                      <div className="slot-info">
                        <div className="slot-title">Ecosystem {index + 1}</div>
                        <div className="slot-stats">
                          <span>{save.creatureCount} Creatures</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={14} /> {formatTime(save.lastSaved)}
                          </span>
                        </div>
                      </div>
                      <div className="slot-actions">
                        <div className="btn-icon delete-btn" onClick={(e) => handleDelete(e, slotId)}>
                          <Trash2 size={20} />
                        </div>
                        <div className="btn-icon play-btn">
                          <Play size={20} fill="currentColor" />
                        </div>
                      </div>
                    </button>
                  )
                } else {
                  return (
                    <button 
                      key={slotId} 
                      className={`save-slot empty ${menuState === 'SLOT_MODAL_LOAD' ? 'disabled' : ''}`}
                      onClick={() => menuState === 'SLOT_MODAL_NEW' && handlePlay(slotId, true)}
                      style={{ opacity: menuState === 'SLOT_MODAL_LOAD' ? 0.5 : 1, cursor: menuState === 'SLOT_MODAL_LOAD' ? 'default' : 'pointer' }}
                    >
                      <Plus size={32} />
                      <div className="slot-title">New Ecosystem</div>
                    </button>
                  )
                }
              })}
            </div>
            </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

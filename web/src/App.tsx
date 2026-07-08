import { useRef, useState, useEffect, useSyncExternalStore } from 'react'
import './index.css'
import { useGameLoop } from './engine/useGameLoop'
import { worldRef } from './engine/worldRef'
import { audio } from './engine/audioEngine'
import { resetWorld } from './engine/entityManager'
import { Settings } from 'lucide-react'

import { useSettingsStore } from './store/useSettingsStore';
import { useEngineStore } from './store/useEngineStore';
import { AudioController } from './components/AudioController';
import { FAB } from './ui/FAB'
import { CreationPanel } from './ui/CreationPanel'

import { TitleScreen } from './ui/TitleScreen'
import { GodToolbar } from './ui/GodToolbar'
import { CreatureInspector } from './ui/CreatureInspector'
import { CameraControls } from './ui/CameraControls'
import { TutorialButton } from './ui/TutorialButton'
import { TutorialModal } from './ui/TutorialModal'
import { HoverOverlay } from './ui/HoverOverlay'
import { TimeControls } from './ui/TimeControls'
import { PauseMenuModal } from './ui/PauseMenuModal'
import { OnboardingModal } from './ui/OnboardingModal'
import { useTerrariumInput } from './hooks/useTerrariumInput'
import { PortraitLock } from './ui/PortraitLock'
import { StatsPanel } from './ui/StatsPanel'
import { StatsButton } from './ui/StatsButton'
import { useUIStore } from './store/useUIStore';

/** Subscribe to creature count changes via a polling interval. */
function useCreatureCount(): number {
  return useSyncExternalStore(
    (onStoreChange) => {
      const interval = setInterval(onStoreChange, 500)
      return () => clearInterval(interval)
    },
    () => worldRef.current.creatures.length,
  )
}

function App() {
  const canvasRef     = useRef<HTMLCanvasElement>(null)
  const creatureCount = useCreatureCount()
  const isPanelOpen   = useUIStore((s) => s.isPanelOpen)
  const uiScale       = useSettingsStore((s) => s.uiScale)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const { handlePointerMove, handlePointerDown, handlePointerUp, handleWheel } = useTerrariumInput(canvasRef)

  useEffect(() => {
    if (isPlaying) {
      audio.startBGM()
    }
  }, [isPlaying])

  useEffect(() => {
    const handleQuit = () => {
      setIsPlaying(false)
      useEngineStore.getState().setTimeScale(1.0)
      resetWorld(worldRef.current)
      useEngineStore.getState().setActiveSaveSlot(null)
      audio.stopBGM()
    }
    
    const handlePointerOver = (e: PointerEvent) => {
      const target = (e.target as HTMLElement).closest('button, .fab, .pill, .tool-btn, .btn-action, .btn-secondary, .btn-massive, .btn-close, .save-slot, [role="button"], .color-chip');
      if (target) {
        audio.playUITick();
      }
    };
    const handleGlobalPointerDown = (e: PointerEvent) => {
      const target = (e.target as HTMLElement).closest('button, .fab, .pill, .tool-btn, .btn-action, .btn-secondary, .btn-massive, .btn-close, .save-slot, [role="button"], .color-chip');
      if (target) {
        audio.playUIPop();
      }
    };

    window.addEventListener('QUIT_TO_TITLE', handleQuit)
    window.addEventListener('pointerover', handlePointerOver)
    window.addEventListener('pointerdown', handleGlobalPointerDown)
    ;(window as any).worldRef = worldRef;
    return () => {
      window.removeEventListener('QUIT_TO_TITLE', handleQuit)
      window.removeEventListener('pointerover', handlePointerOver)
      window.removeEventListener('pointerdown', handleGlobalPointerDown)
    }
  }, [])

  useGameLoop(canvasRef, isPlaying)

  return (
    <div className="app-container" style={{ '--ui-scale': uiScale } as React.CSSProperties}>
      {/* Title Screen Overlay */}
      {!isPlaying && <TitleScreen onPlay={() => {
        audio.playUIClick()
        setIsPlaying(true)
      }} />}

      <AudioController isPlaying={isPlaying} />

      {/* Full-screen terrarium canvas */}
      <canvas
        ref={canvasRef}
        style={{ display: 'block', position: 'absolute', inset: 0, zIndex: 5, touchAction: 'none' }}
        aria-label="Living terrarium ecosystem"
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        onWheel={handleWheel}
      />

      {/* Terrarium Overlay UI */}
      <div className="terrarium-overlay">
        {isPlaying && <HoverOverlay />}
        {useEngineStore((s) => s.pendingCreature) && (
          <div className="toast-notification">
            Click anywhere to drop your creature!
          </div>
        )}
        <div className="header-bar" style={{ pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto', display: 'flex', gap: '8px' }}>
            {isPlaying && <TutorialButton />}
            {isPlaying && <StatsButton />}
          </div>
          
          {isPlaying && <TimeControls />}

          {creatureCount > 0 && (
            <div className="creature-badge" aria-live="polite" style={{ pointerEvents: 'auto' }}>
              {creatureCount} {creatureCount === 1 ? 'creature' : 'creatures'}
            </div>
          )}
        </div>

        {/* Top-Right Settings Button */}
        {isPlaying && (
          <button 
            className="settings-btn-top-right"
            onClick={() => {
              audio.playUIClick()
              useUIStore.getState().openPauseMenu()
            }}
            aria-label="Open Settings"
          >
            <Settings size={24} />
          </button>
        )}

        {/* God Toolbar */}
        {isPlaying && !isPanelOpen && <GodToolbar />}

        {/* Empty state hint (shows when terrarium is empty AND game has started) */}

        
        {/* Creature Inspector panel */}
        {isPlaying && !isPanelOpen && <CreatureInspector />}

        {/* Floating action button */}
        {isPlaying && <FAB creatureCount={creatureCount} />}
        
        {/* Camera Controls */}
        {isPlaying && !isPanelOpen && <CameraControls />}
      </div>

      {/* Creation Lab UI Full-Screen Modal */}
      <CreationPanel />

      {/* Settings / Pause Modal */}
      <PauseMenuModal />

      {/* Tutorial Modal */}
      <TutorialModal />

      {/* Onboarding Modal */}
      <OnboardingModal />

      {/* Mobile Portrait Lock */}
      <PortraitLock />
      <StatsPanel />
    </div>
  )
}

export default App

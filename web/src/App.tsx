import { useRef, useState, useSyncExternalStore } from 'react'
import './index.css'
import { useGameLoop } from './engine/useGameLoop'
import { worldRef } from './engine/worldRef'
import { useStore } from './store/useStore'
import { buildCreature } from './engine/simulate'
import { preloadImage } from './renderer/imageCache'
import { FAB } from './ui/FAB'
import { CreationPanel } from './ui/CreationPanel'
import { EmptyState } from './ui/EmptyState'
import { TitleScreen } from './ui/TitleScreen'
import { GodToolbar } from './ui/GodToolbar'
import { CreatureInspector } from './ui/CreatureInspector'
import { CameraControls } from './ui/CameraControls'
import { TutorialButton } from './ui/TutorialButton'
import { TutorialModal } from './ui/TutorialModal'
import { HoverOverlay } from './ui/HoverOverlay'
import { getWorldPoint } from './renderer/canvasUtils'
import { getCanvasPoint } from './renderer/canvasUtils'

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
  const isPanelOpen   = useStore((s) => s.isPanelOpen)
  const activeTool    = useStore((s) => s.activeTool)
  
  // Camera Drag State
  const [isDragging, setIsDragging] = useState(false);
  
  // Game flow state
  const [isPlaying, setIsPlaying] = useState(false)

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return
    
    if (isDragging) {
      worldRef.current.camera.x -= e.movementX / worldRef.current.camera.zoom;
      worldRef.current.camera.y -= e.movementY / worldRef.current.camera.zoom;
      
      if (useStore.getState().cameraMode === 'TRACKING') {
        useStore.getState().setCameraMode('FREE');
        useStore.getState().setSelectedCreatureId(null);
      }
    }
    
    const canvasPt = getCanvasPoint(canvasRef.current, e.nativeEvent)
    const pt = getWorldPoint(canvasPt.x, canvasPt.y, canvasRef.current.width, canvasRef.current.height, worldRef.current.camera)
    worldRef.current.mouseX = pt.x
    worldRef.current.mouseY = pt.y

    if (worldRef.current.draggedEntityId) {
      const dragged = worldRef.current.creatures.find(c => c.id === worldRef.current.draggedEntityId)
      if (dragged) {
        dragged.x = pt.x
        dragged.y = pt.y
      } else {
        worldRef.current.draggedEntityId = null
      }
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(false);
    if (worldRef.current.draggedEntityId) {
      worldRef.current.draggedEntityId = null;
      try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch(err) {}
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return
    const canvasPt = getCanvasPoint(canvasRef.current, e.nativeEvent)
    const pt = getWorldPoint(canvasPt.x, canvasPt.y, canvasRef.current.width, canvasRef.current.height, worldRef.current.camera)
    worldRef.current.mouseX = pt.x
    worldRef.current.mouseY = pt.y

    const pending = useStore.getState().pendingCreature
    if (pending) {
      const creature = buildCreature(pending, worldRef.current.worldWidth, worldRef.current.worldHeight)
      creature.x = pt.x
      creature.y = pt.y
      preloadImage(creature.id, creature.drawingData)
      worldRef.current.creatures.push(creature)
      useStore.getState().clearQueue()
      return
    }

    // Touch hit test
    let hitId = null;
    for (let i = worldRef.current.creatures.length - 1; i >= 0; i--) {
      const c = worldRef.current.creatures[i];
      const baseRadius = 32 * c.renderScale * c.currentScale;
      const hitRadius = Math.max(48 / worldRef.current.camera.zoom, baseRadius);
      const dx = c.x - pt.x;
      const dy = (c.y - c.z) - pt.y;
      if (dx * dx + dy * dy <= hitRadius * hitRadius) {
        hitId = c.id;
        break;
      }
    }
    worldRef.current.hoveredEntityId = hitId;

    if (activeTool === 'GRAB' && e.isPrimary) {
      if (hitId) {
        worldRef.current.draggedEntityId = hitId;
        const dragged = worldRef.current.creatures.find(c => c.id === hitId);
        if (dragged) dragged.state = 'IDLE';
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }
      return;
    }

    if (e.button === 1 || e.button === 2 || (activeTool === 'POINTER' && !worldRef.current.hoveredEntityId)) {
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    if (activeTool === 'POINTER') {
      const id = worldRef.current.hoveredEntityId
      if (id) {
        useStore.getState().setSelectedCreatureId(id)
        useStore.getState().setCameraMode('TRACKING')
        useStore.getState().setTargetZoom(3.0)
      } else {
        useStore.getState().setSelectedCreatureId(null)
      }
    } else if (activeTool === 'SMITE') {
      const id = worldRef.current.hoveredEntityId
      if (id) {
        worldRef.current.creatures = worldRef.current.creatures.filter(c => c.id !== id)
        worldRef.current.hoveredEntityId = null
      }
      useStore.getState().setActiveTool('POINTER')
    } else if (activeTool === 'FEED') {
      worldRef.current.plants.push({
        id: crypto.randomUUID(),
        x: pt.x,
        y: pt.y,
        growthStage: 0,
        wobblePhase: Math.random() * Math.PI * 2,
      })
      useStore.getState().setActiveTool('POINTER')
    } else if (activeTool === 'LURE') {
      worldRef.current.activeLure = { x: pt.x, y: pt.y, timer: 1 }
      useStore.getState().setActiveTool('POINTER')
    }
  }

  useGameLoop(canvasRef)

  return (
    <div className="app-container">
      {/* Title Screen Overlay */}
      {!isPlaying && <TitleScreen onPlay={() => setIsPlaying(true)} />}

      {/* Full-screen terrarium canvas */}
      <canvas
        ref={canvasRef}
        style={{ display: 'block', position: 'absolute', inset: 0, zIndex: 5 }}
        aria-label="Living terrarium ecosystem"
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        onWheel={(e) => {
          const minZoomX = window.innerWidth / worldRef.current.worldWidth;
          const minZoomY = window.innerHeight / worldRef.current.worldHeight;
          const minZoom = Math.max(minZoomX, minZoomY);
          const newZoom = Math.max(minZoom, Math.min(4.0, useStore.getState().targetZoom - e.deltaY * 0.001));
          useStore.getState().setTargetZoom(newZoom);
        }}
      />

      {/* Terrarium Overlay UI */}
      <div className="terrarium-overlay">
        {isPlaying && <HoverOverlay />}
        {useStore((s) => s.pendingCreature) && (
          <div className="toast-notification">
            Click anywhere to drop your creature!
          </div>
        )}
        <div className="header-bar">
          {isPlaying && <TutorialButton />}
          {creatureCount > 0 && (
            <div className="creature-badge" aria-live="polite">
              {creatureCount} {creatureCount === 1 ? 'creature' : 'creatures'}
            </div>
          )}
        </div>

        {/* God Toolbar */}
        {isPlaying && !isPanelOpen && <GodToolbar />}

        {/* Empty state hint (shows when terrarium is empty AND game has started) */}
        {creatureCount === 0 && isPlaying && !isPanelOpen && <EmptyState />}
        
        {/* Creature Inspector panel */}
        {isPlaying && !isPanelOpen && <CreatureInspector />}

        {/* Floating action button */}
        {isPlaying && <FAB creatureCount={creatureCount} />}
        
        {/* Camera Controls */}
        {isPlaying && !isPanelOpen && <CameraControls />}
      </div>

      {/* Creation Lab UI Full-Screen Modal */}
      <CreationPanel />

      {/* Tutorial Modal */}
      <TutorialModal />
    </div>
  )
}

export default App

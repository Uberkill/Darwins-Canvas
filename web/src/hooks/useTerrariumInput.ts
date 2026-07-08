import { useRef, useState, useEffect, type RefObject } from 'react'
import { useStore } from '../store/useStore'
import { worldRef } from '../engine/worldRef'
import { spawnCreature, spawnPlant, killCreature } from '../engine/entityManager'
import { buildCreature } from '../engine/creatureFactory'
import { preloadImage } from '../renderer/imageCache'
import { getWorldPoint, getCanvasPoint } from '../renderer/canvasUtils'
import { audio } from '../engine/audioEngine'

export function useTerrariumInput(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const [isDragging, setIsDragging] = useState(false)
  const activePointersRef = useRef<Map<number, {x: number, y: number}>>(new Map())

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { setKeys, cameraMode } = useStore.getState();
      
      // If we start panning with keyboard, break out of tracking
      const isPanKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key);
      if (isPanKey && cameraMode === 'TRACKING') {
        useStore.getState().setCameraMode('FREE');
        useStore.getState().setSelectedCreatureId(null);
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          setKeys({ up: true });
          break;
        case 'ArrowDown':
        case 's':
          setKeys({ down: true });
          break;
        case 'ArrowLeft':
        case 'a':
          setKeys({ left: true });
          break;
        case 'ArrowRight':
        case 'd':
          setKeys({ right: true });
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const { setKeys } = useStore.getState();
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          setKeys({ up: false });
          break;
        case 'ArrowDown':
        case 's':
          setKeys({ down: false });
          break;
        case 'ArrowLeft':
        case 'a':
          setKeys({ left: false });
          break;
        case 'ArrowRight':
        case 'd':
          setKeys({ right: false });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return
    
    if (isDragging && activePointersRef.current.has(e.pointerId)) {
      const last = activePointersRef.current.get(e.pointerId)!;
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      
      const pointerCount = activePointersRef.current.size;
      
      worldRef.current.camera.x -= (dx / worldRef.current.camera.zoom) / pointerCount;
      worldRef.current.camera.y -= (dy / worldRef.current.camera.zoom) / pointerCount;
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      
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
        dragged.z = 100 // Lift up while dragging
        dragged.direction.vy = 0
      } else {
        worldRef.current.draggedEntityId = null
      }
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size === 0) {
      setIsDragging(false);
    }
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
    
    if (worldRef.current.draggedEntityId) {
      worldRef.current.draggedEntityId = null;
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return
    const activeTool = useStore.getState().activeTool
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
      spawnCreature(worldRef.current, creature)
      
      audio.playSpawn()
      if (!worldRef.current.visualEffects) worldRef.current.visualEffects = []
      worldRef.current.visualEffects.push({
        id: crypto.randomUUID(),
        type: 'SPAWN',
        x: pt.x,
        y: pt.y,
        timer: 1.0,
        maxTimer: 1.0,
        seed: Math.random()
      })
      
      useStore.getState().clearQueue()
      return
    }

    let hitId = null;
    if (activePointersRef.current.size === 0) {
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
    }
    
    if (activePointersRef.current.size === 0) {
      worldRef.current.hoveredEntityId = hitId;
    } else {
      hitId = null;
    }

    if (activeTool === 'GRAB' && e.isPrimary) {
      if (hitId) {
        audio.playGodTool('GRAB')
        worldRef.current.draggedEntityId = hitId;
        const dragged = worldRef.current.creatures.find(c => c.id === hitId);
        if (dragged) dragged.state = 'IDLE';
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }
      return;
    }

    if (e.button === 1 || e.button === 2 || (activeTool === 'POINTER' && !hitId)) {
      setIsDragging(true);
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    if (activeTool === 'POINTER') {
      if (hitId) {
        audio.playGodTool('POINTER')
        useStore.getState().setSelectedCreatureId(hitId)
        useStore.getState().setCameraMode('TRACKING')
        useStore.getState().setTargetZoom(3.0)
      } else {
        useStore.getState().setSelectedCreatureId(null)
      }
    } else if (activeTool === 'SMITE') {
      if (hitId) {
        audio.playGodTool('SMITE')
        killCreature(worldRef.current, hitId)
        worldRef.current.hoveredEntityId = null
      }
    } else if (activeTool === 'HEAL') {
      if (hitId) {
        audio.playGodTool('HEAL')
        const target = worldRef.current.creatures.find(c => c.id === hitId);
        if (target) {
          target.health = target.maxHealth;
          target.stamina = target.maxStamina;
          target.hunger = Math.max(target.hunger, 80);
        }
      }
    } else if (activeTool === 'FEED') {
      audio.playGodTool('FEED')
      spawnPlant(worldRef.current, {
        id: crypto.randomUUID(),
        type: 'PLANT',
        x: pt.x,
        y: pt.y,
        growthStage: 0,
        wobblePhase: Math.random() * Math.PI * 2,
      })
    } else if (activeTool === 'LURE') {
      audio.playGodTool('LURE')
      worldRef.current.activeLure = { x: pt.x, y: pt.y, timer: 1 }
    }
  }

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    const minZoomX = window.innerWidth / worldRef.current.worldWidth;
    const minZoomY = window.innerHeight / worldRef.current.worldHeight;
    const minZoom = Math.max(minZoomX, minZoomY);
    const newZoom = Math.max(minZoom, Math.min(4.0, useStore.getState().targetZoom - e.deltaY * 0.001));
    useStore.getState().setTargetZoom(newZoom);
  }

  return {
    handlePointerMove,
    handlePointerDown,
    handlePointerUp,
    handleWheel
  }
}

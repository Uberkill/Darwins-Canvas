import { useRef, useState, type RefObject } from 'react';
import { worldRef } from '../engine/worldRef';
import { getWorldPoint, getCanvasPoint } from '../renderer/canvasUtils';
import { useUIStore } from '../store/useUIStore';
import { useCameraControls } from './useCameraControls';
import { useGodTools } from './useGodTools';

export function useTerrariumInput(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const [isDragging, setIsDragging] = useState(false);
  const activePointersRef = useRef<Map<number, {x: number, y: number}>>(new Map());
  
  const { panCamera, zoomCamera } = useCameraControls();
  const { handleGodToolClick, handleGrabStart, handleSummon } = useGodTools();

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    if (isDragging && activePointersRef.current.has(e.pointerId)) {
      const last = activePointersRef.current.get(e.pointerId)!;
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      
      const pointerCount = activePointersRef.current.size;
      panCamera(dx, dy, pointerCount);
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    
    const canvasPt = getCanvasPoint(canvasRef.current, e.nativeEvent);
    const pt = getWorldPoint(canvasPt.x, canvasPt.y, canvasRef.current.width, canvasRef.current.height, worldRef.current.camera);
    worldRef.current.mouseX = pt.x;
    worldRef.current.mouseY = pt.y;

    if (worldRef.current.draggedEntityId) {
      const dragged = worldRef.current.creatures.find(c => c.id === worldRef.current.draggedEntityId);
      if (dragged) {
        dragged.x = pt.x;
        dragged.y = pt.y;
        dragged.z = 100; // Lift up while dragging
        dragged.direction.vy = 0;
      } else {
        worldRef.current.draggedEntityId = null;
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size === 0) {
      setIsDragging(false);
    }
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
    
    if (worldRef.current.draggedEntityId) {
      worldRef.current.draggedEntityId = null;
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const activeTool = useUIStore.getState().activeTool;
    const canvasPt = getCanvasPoint(canvasRef.current, e.nativeEvent);
    const pt = getWorldPoint(canvasPt.x, canvasPt.y, canvasRef.current.width, canvasRef.current.height, worldRef.current.camera);
    
    // Check pending creature summon BEFORE anything else
    if (handleSummon(pt)) return;

    worldRef.current.mouseX = pt.x;
    worldRef.current.mouseY = pt.y;

    let hitId: string | null = null;
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
        handleGrabStart(hitId, () => (e.target as HTMLElement).setPointerCapture(e.pointerId));
      }
      return;
    }

    // Secondary click or Pointer tool on empty space starts panning
    if (e.button === 1 || e.button === 2 || (activeTool === 'POINTER' && !hitId)) {
      setIsDragging(true);
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    // Route remaining clicks to the God Tools handler
    handleGodToolClick(pt, hitId, activeTool);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    zoomCamera(e.deltaY);
  };

  return {
    handlePointerMove,
    handlePointerDown,
    handlePointerUp,
    handleWheel
  };
}

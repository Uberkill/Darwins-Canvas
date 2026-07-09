import { useEffect } from 'react';
import { useUIStore } from '../store/useUIStore';
import { worldRef } from '../engine/worldRef';

export function useCameraControls() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { setKeys, cameraMode } = useUIStore.getState();
      
      // If we start panning with keyboard, break out of tracking
      const isPanKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key);
      if (isPanKey && cameraMode === 'TRACKING') {
        useUIStore.getState().setCameraMode('FREE');
        useUIStore.getState().setSelectedCreatureId(null);
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
      const { setKeys } = useUIStore.getState();
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

  const panCamera = (dx: number, dy: number, pointerCount: number) => {
    worldRef.current.camera.x -= (dx / worldRef.current.camera.zoom) / pointerCount;
    worldRef.current.camera.y -= (dy / worldRef.current.camera.zoom) / pointerCount;
    
    if (useUIStore.getState().cameraMode === 'TRACKING') {
      useUIStore.getState().setCameraMode('FREE');
      useUIStore.getState().setSelectedCreatureId(null);
    }
  };

  const zoomCamera = (deltaY: number) => {
    const minZoomX = window.innerWidth / worldRef.current.worldWidth;
    const minZoomY = window.innerHeight / worldRef.current.worldHeight;
    const minZoom = Math.max(minZoomX, minZoomY);
    const newZoom = Math.max(minZoom, Math.min(4.0, useUIStore.getState().targetZoom - deltaY * 0.001));
    useUIStore.getState().setTargetZoom(newZoom);
  };

  return { panCamera, zoomCamera };
}

import React from 'react';
import { worldRef } from '../engine/worldRef';
import './CameraControls.css';

import { Crosshair, Globe2 } from 'lucide-react';
import { useUIStore } from '../store/useUIStore';

export const CameraControls: React.FC = () => {
  const cameraMode = useUIStore((s) => s.cameraMode);
  const setCameraMode = useUIStore((s) => s.setCameraMode);
  const targetZoom = useUIStore((s) => s.targetZoom);
  const setTargetZoom = useUIStore((s) => s.setTargetZoom);
  const setSelectedCreatureId = useUIStore((s) => s.setSelectedCreatureId);

  const handleZoomIn = () => {
    setTargetZoom(Math.min(4.0, targetZoom + 0.5));
  };

  const handleZoomOut = () => {
    const minZoomX = window.innerWidth / worldRef.current.worldWidth;
    const minZoomY = window.innerHeight / worldRef.current.worldHeight;
    const minZoom = Math.max(minZoomX, minZoomY);
    setTargetZoom(Math.max(minZoom, targetZoom - 0.5));
  };

  const handleModeToggle = () => {
    if (cameraMode === 'TRACKING') {
      setCameraMode('FREE');
      setSelectedCreatureId(null);
    } else {
      // Re-center on middle of world
      worldRef.current.camera.x = worldRef.current.worldWidth / 2;
      worldRef.current.camera.y = worldRef.current.worldHeight / 2;
      setTargetZoom(1.0);
    }
  };

  return (
    <div 
      className="camera-controls-container" 
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
    >
      <div className="camera-controls-group">
        <button className="camera-btn" onClick={handleZoomOut} aria-label="Zoom Out">
          <span className="camera-btn-icon">-</span>
        </button>
        <div className="camera-zoom-indicator">
          {Math.round(targetZoom * 100)}%
        </div>
        <button className="camera-btn" onClick={handleZoomIn} aria-label="Zoom In">
          <span className="camera-btn-icon">+</span>
        </button>
      </div>
      <button 
        className={`camera-btn-mode ${cameraMode === 'TRACKING' ? 'active' : ''}`} 
        onClick={handleModeToggle}
        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        {cameraMode === 'TRACKING' ? (
          <><Crosshair size={18} /> Stop Tracking</>
        ) : (
          <><Globe2 size={18} /> Re-center View</>
        )}
      </button>
    </div>
  );
};

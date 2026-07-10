import React, { useEffect, useState } from 'react';
import { Flame, AlertTriangle, Moon, Smile, Meh, Search } from 'lucide-react';
import { worldRef } from '../engine/worldRef';
import { BASE_RENDER_SIZE, CAMERA_TILT } from '../constants';
import './HoverOverlay.css';
import { useSettingsStore } from '../store/useSettingsStore';

const getMoodIcon = (mood: string) => {
  switch (mood) {
    case 'HAPPY': return <Smile size={16} color="#2ecc71" />;
    case 'SCARED': return <AlertTriangle size={16} color="#f1c40f" />;
    case 'HUNGRY': return <Search size={16} color="#3498db" />;
    case 'SLEEPY': return <Moon size={16} color="#9b59b6" />;
    case 'ANGRY': return <Flame size={16} color="#e74c3c" />;
    default: return <Meh size={16} color="#ccc" />;
  }
}

export const HoverOverlay: React.FC = () => {
  const [tooltipData, setTooltipData] = useState<{
    x: number;
    y: number;
    name: string;
    mood: string;
    intent: string;
    visible: boolean;
  } | null>(null);

  useEffect(() => {
    let active = true;
    const poll = () => {
      if (!active) return;
      
      const { hoveredEntityId, creatures, camera } = worldRef.current;
      
      if (!hoveredEntityId) {
        setTooltipData(null);
      } else {
        const hoveredCreature = creatures.find(c => c.id === hoveredEntityId);
        
        if (hoveredCreature) {
          // Camera math to convert world coords to screen coords
          const size = BASE_RENDER_SIZE * hoveredCreature.renderScale * (hoveredCreature.currentScale || 1.0);
          
          // World position above head — project to visual space first
          const worldX = hoveredCreature.x;
          const worldVisualY = (hoveredCreature.y * CAMERA_TILT) - hoveredCreature.z - size - 10;

          const uiScale = useSettingsStore.getState().uiScale;

          // Logical screen bounds
          const logicalW = window.innerWidth;
          const logicalH = window.innerHeight;

          // camera.y is in visual space, worldVisualY is in visual space — math matches renderer
          const screenX = (worldX - camera.x) * camera.zoom + (logicalW / 2);
          const screenY = (worldVisualY - camera.y) * camera.zoom + (logicalH / 2);

          // Boundary clamping for mobile (tooltips go offscreen otherwise)
          const margin = 100;
          const clampedX = Math.max(margin, Math.min(logicalW - margin, screenX));
          const clampedY = Math.max(margin, Math.min(logicalH - margin, screenY));

          // Because .terrarium-overlay is scaled by uiScale, we must inversely scale the absolute position
          // so it visually aligns with the unscaled canvas.
          setTooltipData(prev => {
            const next = {
              x: clampedX / uiScale,
              y: clampedY / uiScale,
              name: hoveredCreature.name,
              mood: hoveredCreature.mood,
              intent: hoveredCreature.intent,
              visible: true
            };
            if (prev && prev.visible && prev.x === next.x && prev.y === next.y && prev.name === next.name && prev.mood === next.mood && prev.intent === next.intent) {
              return prev;
            }
            return next;
          });
        } else {
          setTooltipData(prev => (prev && !prev.visible) ? prev : { ...prev, visible: false } as any);
        }
      }
      requestAnimationFrame(poll);
    };
    
    const frame = requestAnimationFrame(poll);
    return () => {
      active = false;
      cancelAnimationFrame(frame);
    };
  }, []);

  if (!tooltipData || !tooltipData.visible) return null;

  return (
    <div 
      className="hover-overlay-tooltip"
      style={{
        left: tooltipData.x,
        top: tooltipData.y,
      }}
    >
      <div className="hover-header">
        <span className="hover-name">{tooltipData.name}</span>
        {getMoodIcon(tooltipData.mood)}
      </div>
      <div className="hover-intent">
        "{tooltipData.intent}"
      </div>
    </div>
  );
};

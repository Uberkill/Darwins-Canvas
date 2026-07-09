import { useEffect, useRef } from 'react';
import { useTrackingStore, MAX_TRACKED } from './useTrackingStore';
import { worldRef } from '../../engine/worldRef';
import { Target, X } from 'lucide-react';
import './ActiveResearchHUD.css';

export function ActiveResearchHUD() {
  const trackedIds = useTrackingStore((state) => state.trackedIds);
  const untrackCreature = useTrackingStore((state) => state.untrackCreature);

  // Array of currently tracked IDs up to MAX_TRACKED
  const activeIds = Array.from(trackedIds).slice(0, MAX_TRACKED);

  // We need refs to the DOM elements to update them outside of React
  const nameRefs = useRef<(HTMLDivElement | null)[]>([]);
  const healthBarRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let animationFrameId: number;
    let isMounted = true;

    const pollWorldState = () => {
      if (!isMounted) return;

      activeIds.forEach((id, index) => {
        // Find creature in the engine
        const creature = worldRef.current.creatures.find(c => c.id === id);

        // Subagent Fix: Ghost Eviction
        // If the creature is gone (e.g., smited), untrack it to heal state
        if (!creature) {
          untrackCreature(id);
          return;
        }

        // Direct DOM mutations to prevent 60fps React renders
        if (nameRefs.current[index]) {
          nameRefs.current[index]!.innerText = creature.name || 'Unknown Species';
        }

        if (healthBarRefs.current[index]) {
          const hpPercent = Math.max(0, creature.health / creature.maxHealth) * 100;
          healthBarRefs.current[index]!.style.width = `${hpPercent}%`;
          healthBarRefs.current[index]!.style.backgroundColor = hpPercent > 40 ? 'var(--color-secondary)' : '#f44336';
        }
      });

      animationFrameId = requestAnimationFrame(pollWorldState);
    };

    animationFrameId = requestAnimationFrame(pollWorldState);

    return () => {
      isMounted = false;
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeIds, untrackCreature]); // Re-run effect only when activeIds array changes

  // Important for UX: only render the HUD if we actually have tracking capability visible
  // We'll always render it to show empty slots as an educational hint.
  return (
    <div className="active-research-hud">
      <div className="research-hud-header">
        <Target size={16} />
        <span>Active Research ({trackedIds.size}/{MAX_TRACKED})</span>
      </div>
      
      <div className="research-hud-slots">
        {activeIds.map((id, i) => (
          <div key={`tracked-${id}`} className="research-slot active">
            <div className="slot-info">
              <div 
                className="slot-name" 
                ref={(el) => { nameRefs.current[i] = el; }}
              >
                Loading...
              </div>
              <div className="slot-health-bg">
                <div 
                  className="slot-health-fill" 
                  ref={(el) => { healthBarRefs.current[i] = el; }}
                />
              </div>
            </div>
            <button 
              className="slot-untrack-btn" 
              onClick={() => untrackCreature(id)}
              aria-label="Untrack Creature"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

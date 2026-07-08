import React, { useEffect, useState } from 'react';
import { worldRef } from '../engine/worldRef';
import type { Creature } from '../types';
import { Flame, AlertTriangle, Moon, Smile, Meh, Search } from 'lucide-react';
import './CreatureInspector.css';
import { useUIStore } from '../store/useUIStore';

const getMoodIcon = (mood: string) => {
  switch (mood) {
    case 'HAPPY': return <Smile size={24} color="#2ecc71" />;
    case 'SCARED': return <AlertTriangle size={24} color="#f1c40f" />;
    case 'HUNGRY': return <Search size={24} color="#3498db" />;
    case 'SLEEPY': return <Moon size={24} color="#9b59b6" />;
    case 'ANGRY': return <Flame size={24} color="#e74c3c" />;
    default: return <Meh size={24} color="#ccc" />;
  }
}

export const CreatureInspector: React.FC = () => {
  const selectedCreatureId = useUIStore((s) => s.selectedCreatureId);
  const setSelectedCreatureId = useUIStore((s) => s.setSelectedCreatureId);
  const [creature, setCreature] = useState<Creature | null>(null);

  useEffect(() => {
    if (!selectedCreatureId) {
      setCreature(null);
      return;
    }

    let active = true;
    const poll = () => {
      if (!active) return;
      const found = worldRef.current.creatures.find(c => c.id === selectedCreatureId);
      if (found) {
        setCreature({ ...found });
      } else {
        setCreature(null);
        setSelectedCreatureId(null);
      }
      requestAnimationFrame(poll);
    };
    const frame = requestAnimationFrame(poll);
    return () => {
      active = false;
      cancelAnimationFrame(frame);
    };
  }, [selectedCreatureId, setSelectedCreatureId]);

  if (!creature) return null;

  const lifespanPct = Math.min(100, Math.max(0, Math.round((creature.age / creature.maxAge) * 100)));
  const healthPct = Math.min(100, Math.max(0, Math.round((creature.health / creature.maxHealth) * 100)));
  const staminaPct = Math.min(100, Math.max(0, Math.round((creature.stamina / creature.maxStamina) * 100)));

  // Calculate XP progress to next level using the exact quadratic formulas from simulate.ts
  let currentXp = 0;
  let xpNeeded = 1;
  let xpLabel = 'XP';
  
  const currentLvl = creature.level;
  const baseScore = Math.pow(currentLvl - 1, 2);
  const targetScore = Math.pow(currentLvl, 2);
  
  if (creature.diet === 'HERBIVORE') {
    const score = creature.foodEaten / 3;
    currentXp = Math.floor(score - baseScore);
    xpNeeded = targetScore - baseScore;
    xpLabel = 'Food (Scaled)';
  } else if (creature.diet === 'CARNIVORE') {
    const score = creature.kills;
    currentXp = score - baseScore;
    xpNeeded = targetScore - baseScore;
    xpLabel = 'Kills';
  } else {
    const score = (creature.kills * 1.5) + (creature.foodEaten / 6);
    currentXp = Math.floor(score - baseScore);
    xpNeeded = targetScore - baseScore;
    xpLabel = 'Omni-XP';
  }

  // Prevent divide by zero edge cases
  xpNeeded = Math.max(1, xpNeeded);
  currentXp = Math.max(0, currentXp);
  const xpPercent = Math.min(100, (currentXp / xpNeeded) * 100);

  return (
    <div className="inspector-panel">
      
      {/* Header */}
      <div className="inspector-header">
        <div>
          <h2 className="inspector-title">
            {creature.name}
            {creature.generation > 1 && (
              <span className="inspector-gen-badge">
                Gen {creature.generation}
              </span>
            )}
            {creature.kills > 0 && (
              <span className="inspector-veteran-badge">
                Veteran
              </span>
            )}
            {creature.level >= 5 && (
              <span className="inspector-boss-badge">
                BOSS
              </span>
            )}
          </h2>
          <p className="inspector-subtitle">
            {creature.diet} • {creature.movement} • Level {creature.level}
          </p>
          <div className="inspector-xp-bar">
             <div className="inspector-xp-fill" style={{ width: `${xpPercent}%` }} />
             <span className="inspector-xp-text">
               {currentXp} / {xpNeeded} {xpLabel}
             </span>
          </div>
        </div>
        <button 
          onClick={() => setSelectedCreatureId(null)}
          className="inspector-close"
        >
          ✕
        </button>
      </div>

      {/* Image Preview */}
      <div className="inspector-preview">
        <img 
          src={creature.drawingData} 
          alt={creature.name} 
          style={{
            filter: `${lifespanPct >= 80 ? 'contrast(0.7) brightness(1.2)' : 'none'} hue-rotate(${creature.hueShift || 0}deg)`,
            transform: `scale(${Math.min(1.5, Math.max(0.5, creature.currentScale))})`
          }}
        />
        <div className="inspector-mood-icon">
          {getMoodIcon(creature.mood)}
        </div>
      </div>
      
      {/* Inner Thoughts */}
      <div className="inspector-intent">
        "{creature.intent}"
      </div>

      {/* Stats */}
      <div className="inspector-stats">
        {/* State */}
        <div className="inspector-status">
          <span className="inspector-status-label">Status</span>
          <span className="inspector-status-value">{creature.behavior} ({creature.state})</span>
        </div>
        
        {/* Kills */}
        <div className="inspector-status">
          <span className="inspector-status-label">Kills</span>
          <span className="inspector-status-value">{creature.kills}</span>
        </div>

        {/* Age */}
        <div className="inspector-bar-group">
          <div className="inspector-bar-header">
            <span className="inspector-bar-label">Lifespan ({lifespanPct}%)</span>
            <span className="inspector-bar-text">{Math.round(creature.age)}s / {creature.maxAge}s</span>
          </div>
          <div className="inspector-bar-bg">
            <div 
              className="inspector-bar-fill lifespan" 
              style={{ width: `${lifespanPct}%` }}
            />
          </div>
        </div>

        {/* Health */}
        <div className="inspector-bar-group">
          <div className="inspector-bar-header">
            <span className="inspector-bar-label">Health</span>
            <span className="inspector-bar-text">{Math.round(creature.health)} / {Math.round(creature.maxHealth)}</span>
          </div>
          <div className="inspector-bar-bg">
            <div 
              className="inspector-bar-fill health" 
              style={{ width: `${healthPct}%` }}
            />
          </div>
        </div>

        {/* Stamina */}
        <div className="inspector-bar-group">
          <div className="inspector-bar-header">
            <span className="inspector-bar-label">Stamina</span>
            <span className="inspector-bar-text">{Math.round(creature.stamina)} / {Math.round(creature.maxStamina)}</span>
          </div>
          <div className="inspector-bar-bg">
            <div 
              className="inspector-bar-fill stamina" 
              style={{ width: `${staminaPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Genetics */}
      {creature.baseStats && (
        <div className="inspector-genetics">
          <h3 className="inspector-genetics-title">Genetics (Deviations from Base)</h3>
          <div className="inspector-genetics-grid">
            {Object.entries({
              Speed: { cur: creature.speed, base: creature.baseStats.speed },
              Sight: { cur: creature.sightRadius, base: creature.baseStats.sightRadius },
              Health: { cur: creature.maxHealth, base: creature.baseStats.maxHealth },
              Scale: { cur: creature.renderScale, base: creature.baseStats.renderScale },
              Drain: { cur: creature.hungerDrainRate, base: creature.baseDrainRate },
              Bravery: { cur: creature.bravery, base: 0.5 }
            }).map(([label, { cur, base }]) => {
              const diff = ((cur / base) - 1) * 100;
              const isPositive = diff > 0.5;
              const isNegative = diff < -0.5;
              let color = '#ccc';
              if (label === 'Drain') {
                if (isPositive) color = '#e74c3c'; // high drain is bad
                if (isNegative) color = '#2ecc71';
              } else {
                if (isPositive) color = '#2ecc71'; // high stats are good
                if (isNegative) color = '#e74c3c';
              }

              return (
                <div key={label} className="genetics-stat">
                  <span className="genetics-label">{label}</span>
                  <span className="genetics-value" style={{ color }}>
                    {cur.toFixed(label === 'Scale' || label === 'Drain' || label === 'Bravery' ? 2 : 0)} 
                    {Math.abs(diff) > 0.5 && ` (${diff > 0 ? '+' : ''}${diff.toFixed(1)}%)`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  );
};

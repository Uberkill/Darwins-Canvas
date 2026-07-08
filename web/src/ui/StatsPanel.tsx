import React, { useEffect, useState } from 'react';
import { Flame, Dna, Leaf, Sprout, Bone, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { worldRef } from '../engine/worldRef';
import { PopulationGraph } from './PopulationGraph';
import type { PopulationDataPoint } from '../types';
import './StatsPanel.css';

export function StatsPanel() {
  const isStatsOpen = useStore((s) => s.isStatsOpen);
  const closeStats = useStore((s) => s.closeStats);
  const [history, setHistory] = useState<PopulationDataPoint[]>([]);

  useEffect(() => {
    if (!isStatsOpen) return;

    // Initial load
    setHistory([...worldRef.current.populationHistory]);

    // Poll at 1Hz to decouple from the 60fps simulation
    const interval = setInterval(() => {
      setHistory([...worldRef.current.populationHistory]);
    }, 1000);

    return () => clearInterval(interval);
  }, [isStatsOpen]);

  if (!isStatsOpen) return null;

  // Get current snapshot
  const current = history.length > 0 
    ? history[history.length - 1] 
    : { carnivore: 0, omnivore: 0, herbivore: 0, plant: 0, meat: 0 };

  return (
    <div className="stats-panel-overlay" onClick={closeStats}>
      <div className="stats-panel-content" onClick={(e) => e.stopPropagation()}>
        <button className="stats-close-btn" onClick={closeStats}>
          <X size={24} />
        </button>
        
        <h2 className="stats-title">Ecosystem Statistics</h2>

        <div className="stats-layout">
          {/* Left Column: Real-time Stats */}
          <div className="stats-column-left">
            <div className="stat-card carnivore">
              <div className="stat-icon"><Flame size={32} /></div>
              <div className="stat-info">
                <h3>Carnivores</h3>
                <span className="stat-value">{current.carnivore}</span>
              </div>
            </div>

            <div className="stat-card omnivore">
              <div className="stat-icon"><Dna size={32} /></div>
              <div className="stat-info">
                <h3>Omnivores</h3>
                <span className="stat-value">{current.omnivore}</span>
              </div>
            </div>

            <div className="stat-card herbivore">
              <div className="stat-icon"><Leaf size={32} /></div>
              <div className="stat-info">
                <h3>Herbivores</h3>
                <span className="stat-value">{current.herbivore}</span>
              </div>
            </div>
            
            <div className="stat-card resources">
              <div className="stat-info-sm plant">
                <Sprout size={16} /> Plants: {current.plant}
              </div>
              <div className="stat-info-sm meat">
                <Bone size={16} /> Meat: {current.meat}
              </div>
            </div>
          </div>

          {/* Right Column: The Graph */}
          <div className="stats-column-right">
            <PopulationGraph history={history} />
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Flame, Dna, Leaf, Sprout, Bone, X, HelpCircle, Download } from 'lucide-react';
import { useStore } from '../store/useStore';
import { worldRef } from '../engine/worldRef';
import { PopulationGraph } from './PopulationGraph';
import type { EcosystemDataPoint } from '../types';
import './StatsPanel.css';

export function StatsPanel() {
  const isStatsOpen = useStore((s) => s.isStatsOpen);
  const closeStats = useStore((s) => s.closeStats);
  const [history, setHistory] = useState<EcosystemDataPoint[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (!isStatsOpen) return;

    // Initial load - safely slice 200 items to prevent UI lag on massive histories
    setHistory([...worldRef.current.analytics.history.slice(-200)]);

    // Poll at 1Hz to decouple from the 60fps simulation
    const interval = setInterval(() => {
      setHistory([...worldRef.current.analytics.history.slice(-200)]);
    }, 1000);

    return () => clearInterval(interval);
  }, [isStatsOpen]);

  const handleExport = () => {
    const fullHistory = worldRef.current.analytics.history;
    if (fullHistory.length === 0) return;

    const headers = ["Time", "Carnivore", "Omnivore", "Herbivore", "Plant", "Meat", "Births", "Starvations", "Hunted", "DamageDealt", "CaloriesConsumed", "MaxGeneration"];
    const rows = fullHistory.map(d => 
      [d.time, d.carnivore, d.omnivore, d.herbivore, d.plant, d.meat, d.births, d.starvationDeaths, d.huntedDeaths, Math.floor(d.damageDealt), Math.floor(d.caloriesConsumed), d.maxGeneration].join(",")
    );
    
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'darwin-analytics-export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isStatsOpen) return null;

  // Get current snapshot
  const current = history.length > 0 
    ? history[history.length - 1] 
    : { carnivore: 0, omnivore: 0, herbivore: 0, plant: 0, meat: 0, births: 0, starvationDeaths: 0, huntedDeaths: 0, damageDealt: 0, caloriesConsumed: 0, maxGeneration: 1 };

  return (
    <div className="stats-panel-overlay" onClick={closeStats}>
      <div className="stats-panel-content" onClick={(e) => e.stopPropagation()}>
        <button className="stats-close-btn" onClick={closeStats}>
          <X size={24} />
        </button>
        
        <div className="stats-header">
          <h2 className="stats-title">Ecosystem Statistics</h2>
          <button className="icon-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }} onClick={() => setShowHelp(!showHelp)} title="What do these mean?">
            <HelpCircle size={24} />
          </button>
          <button className="export-btn" onClick={handleExport}>
            <Download size={16} /> Export CSV
          </button>
        </div>

        {showHelp && (
          <div className="stats-help">
            <p><strong>Births:</strong> Creatures born in the last second.</p>
            <p><strong>Starvations:</strong> Creatures that died from hunger/old age.</p>
            <p><strong>Hunted:</strong> Creatures killed in combat.</p>
            <p><strong>Max Gen:</strong> Highest lineage depth alive.</p>
          </div>
        )}

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
            
            <div className="stat-card analytics">
              <div className="stat-info-sm">Births (1s): {current.births}</div>
              <div className="stat-info-sm">Starvations: {current.starvationDeaths}</div>
              <div className="stat-info-sm">Hunted: {current.huntedDeaths}</div>
              <div className="stat-info-sm">Max Gen: {current.maxGeneration}</div>
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

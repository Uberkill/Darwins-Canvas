import { useEffect, useState } from 'react';
import { Flame, Dna, Leaf, Sprout, Bone, X, HelpCircle, Download } from 'lucide-react';
import { useStore } from '../store/useStore';
import { worldRef } from '../engine/worldRef';
import { MetricsGraph, type GraphLine } from './MetricsGraph';
import type { EcosystemDataPoint } from '../types';
import './StatsPanel.css';

const graphLines: Record<string, GraphLine[]> = {
  POPULATION: [
    { key: 'plant', className: 'line-plant' },
    { key: 'meat', className: 'line-meat' },
    { key: 'herbivore', className: 'line-herbivore' },
    { key: 'omnivore', className: 'line-omnivore' },
    { key: 'carnivore', className: 'line-carnivore' },
  ],
  BIRTHS: [
    { key: 'birthsHerb', className: 'line-herbivore' },
    { key: 'birthsOmni', className: 'line-omnivore' },
    { key: 'birthsCarn', className: 'line-carnivore' },
  ],
  STARVATIONS: [
    { key: 'starvationHerb', className: 'line-herbivore' },
    { key: 'starvationOmni', className: 'line-omnivore' },
    { key: 'starvationCarn', className: 'line-carnivore' },
  ],
  HUNTED: [
    { key: 'huntedHerb', className: 'line-herbivore' },
    { key: 'huntedOmni', className: 'line-omnivore' },
    { key: 'huntedCarn', className: 'line-carnivore' },
  ],
  ENERGY: [
    { key: 'caloriesHerb', className: 'line-herbivore' },
    { key: 'caloriesOmni', className: 'line-omnivore' },
    { key: 'caloriesCarn', className: 'line-carnivore' },
  ],
};

export function StatsPanel() {
  const isStatsOpen = useStore((s) => s.isStatsOpen);
  const closeStats = useStore((s) => s.closeStats);
  const [history, setHistory] = useState<EcosystemDataPoint[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('POPULATION');

  useEffect(() => {
    if (!isStatsOpen) return;

    // Initial load - safely slice 300 items to prevent UI lag on massive histories
    setHistory([...worldRef.current.analytics.history.slice(-300)]);

    // Poll at 1Hz to decouple from the 60fps simulation
    const interval = setInterval(() => {
      setHistory([...worldRef.current.analytics.history.slice(-300)]);
    }, 1000);

    return () => clearInterval(interval);
  }, [isStatsOpen]);

  const handleExport = () => {
    const fullHistory = worldRef.current.analytics.history;
    if (fullHistory.length === 0) return;

    const headers = [
      "Time", "Carnivore", "Omnivore", "Herbivore", "Plant", "Meat",
      "BirthsCarn", "BirthsOmni", "BirthsHerb",
      "StarvationCarn", "StarvationOmni", "StarvationHerb",
      "HuntedCarn", "HuntedOmni", "HuntedHerb",
      "DamageCarn", "DamageOmni", "DamageHerb",
      "CaloriesCarn", "CaloriesOmni", "CaloriesHerb",
      "MaxGeneration"
    ];
    
    const rows = fullHistory.map(d => 
      [
        d.time, d.carnivore, d.omnivore, d.herbivore, d.plant, d.meat,
        d.birthsCarn, d.birthsOmni, d.birthsHerb,
        d.starvationCarn, d.starvationOmni, d.starvationHerb,
        d.huntedCarn, d.huntedOmni, d.huntedHerb,
        Math.floor(d.damageCarn), Math.floor(d.damageOmni), Math.floor(d.damageHerb),
        Math.floor(d.caloriesCarn), Math.floor(d.caloriesOmni), Math.floor(d.caloriesHerb),
        d.maxGeneration
      ].join(",")
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

  const current = history.length > 0 
    ? history[history.length - 1] 
    : { carnivore: 0, omnivore: 0, herbivore: 0, plant: 0, meat: 0, birthsCarn: 0, birthsOmni: 0, birthsHerb: 0, starvationCarn: 0, starvationOmni: 0, starvationHerb: 0, huntedCarn: 0, huntedOmni: 0, huntedHerb: 0, damageCarn: 0, damageOmni: 0, damageHerb: 0, caloriesCarn: 0, caloriesOmni: 0, caloriesHerb: 0, maxGeneration: 1 };

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
            <p>Switch tabs on the right to view graphs of these specific metrics over time, color-coded by diet!</p>
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
              <div className="stat-info-sm">Births (1s): {current.birthsCarn + current.birthsOmni + current.birthsHerb}</div>
              <div className="stat-info-sm">Starvations: {current.starvationCarn + current.starvationOmni + current.starvationHerb}</div>
              <div className="stat-info-sm">Hunted: {current.huntedCarn + current.huntedOmni + current.huntedHerb}</div>
              <div className="stat-info-sm">Max Gen: {current.maxGeneration}</div>
            </div>
          </div>

          {/* Right Column: The Graph */}
          <div className="stats-column-right">
            <div className="stats-tabs">
              <button className={activeTab === 'POPULATION' ? 'active' : ''} onClick={() => setActiveTab('POPULATION')}>Populations</button>
              <button className={activeTab === 'BIRTHS' ? 'active' : ''} onClick={() => setActiveTab('BIRTHS')}>Births</button>
              <button className={activeTab === 'STARVATIONS' ? 'active' : ''} onClick={() => setActiveTab('STARVATIONS')}>Starvations</button>
              <button className={activeTab === 'HUNTED' ? 'active' : ''} onClick={() => setActiveTab('HUNTED')}>Hunted</button>
              <button className={activeTab === 'ENERGY' ? 'active' : ''} onClick={() => setActiveTab('ENERGY')}>Calories</button>
            </div>
            <MetricsGraph history={history} lines={graphLines[activeTab]} />
          </div>
        </div>
      </div>
    </div>
  );
}

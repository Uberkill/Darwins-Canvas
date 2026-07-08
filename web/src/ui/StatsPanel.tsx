import { useEffect, useState } from 'react';
import { Drumstick, Utensils, Leaf, Sprout, Bone, X, Download, Egg, Ghost, Swords, FastForward } from 'lucide-react';

import { worldRef } from '../engine/worldRef';
import { MetricsGraph, type GraphLine } from './MetricsGraph';
import type { EcosystemDataPoint } from '../types';
import './StatsPanel.css';
import { useUIStore } from '../store/useUIStore';

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
  const isStatsOpen = useUIStore((s) => s.isStatsOpen);
  const closeStats = useUIStore((s) => s.closeStats);
  const [history, setHistory] = useState<EcosystemDataPoint[]>([]);
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
          <h2 className="stats-title">Ecosystem Analytics</h2>
          <button className="export-btn" onClick={handleExport}>
            <Download size={16} /> Export CSV
          </button>
        </div>

        <div className="stats-layout-new">
          {/* Top Row: KPIs */}
          <div className="stats-kpi-row">
            <div className="kpi-card herbivore">
              <Leaf size={32} />
              <div className="kpi-info">
                <span>Herbivores</span>
                <strong>{current.herbivore}</strong>
              </div>
            </div>
            <div className="kpi-card omnivore">
              <Utensils size={32} />
              <div className="kpi-info">
                <span>Omnivores</span>
                <strong>{current.omnivore}</strong>
              </div>
            </div>
            <div className="kpi-card carnivore">
              <Drumstick size={32} />
              <div className="kpi-info">
                <span>Carnivores</span>
                <strong>{current.carnivore}</strong>
              </div>
            </div>
          </div>

          {/* Middle Row: The Graph */}
          <div className="stats-graph-section">
            <div className="stats-tabs">
              <button className={activeTab === 'POPULATION' ? 'active' : ''} onClick={() => setActiveTab('POPULATION')}>Populations</button>
              <button className={activeTab === 'BIRTHS' ? 'active' : ''} onClick={() => setActiveTab('BIRTHS')}>Births</button>
              <button className={activeTab === 'STARVATIONS' ? 'active' : ''} onClick={() => setActiveTab('STARVATIONS')}>Starvations</button>
              <button className={activeTab === 'HUNTED' ? 'active' : ''} onClick={() => setActiveTab('HUNTED')}>Hunted</button>
              <button className={activeTab === 'ENERGY' ? 'active' : ''} onClick={() => setActiveTab('ENERGY')}>Calories</button>
            </div>
            <div className="graph-container-styled">
              <MetricsGraph history={history} lines={graphLines[activeTab]} />
            </div>
          </div>

          {/* Bottom Row: Analytics Pulse */}
          <div className="stats-pulse-row">
            <div className="pulse-badge plant"><Sprout size={16}/> {current.plant} Plants</div>
            <div className="pulse-badge meat"><Bone size={16}/> {current.meat} Meat</div>
            <div className="pulse-badge"><Egg size={16}/> {current.birthsCarn + current.birthsOmni + current.birthsHerb}/s Births</div>
            <div className="pulse-badge"><Ghost size={16}/> {current.starvationCarn + current.starvationOmni + current.starvationHerb}/s Starved</div>
            <div className="pulse-badge"><Swords size={16}/> {current.huntedCarn + current.huntedOmni + current.huntedHerb}/s Hunted</div>
            <div className="pulse-badge"><FastForward size={16}/> Gen {current.maxGeneration}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

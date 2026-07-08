import { useState } from 'react'
import { ColorPalette } from './ColorPalette'
import { BrushPicker } from './BrushPicker'
import { TraitPicker } from './TraitPicker'
import { SIZE_OPTIONS, MOVEMENT_OPTIONS, DIET_OPTIONS } from '../constants/traits'
import { calculateCreatureStats } from '../engine/creatureFactory'
import { Activity, ChevronDown, ChevronUp, Zap, Swords, Shield, Eye } from 'lucide-react'
import type { CreatureSize, MovementType, DietType } from '../types'
import type { useDrawingCanvas } from '../hooks/useDrawingCanvas'

interface CreationSettingsProps {
  brushSize: number
  setBrushSize: (size: number) => void
  brushColor: string
  setBrushColor: (color: string) => void
  size: CreatureSize
  setSize: (size: CreatureSize) => void
  movement: MovementType
  setMovement: (movement: MovementType) => void
  diet: DietType
  setDiet: (diet: DietType) => void
  drawing: ReturnType<typeof useDrawingCanvas>
  handleRelease: () => void
  isBaking: boolean
}

export function CreationSettings({
  brushSize, setBrushSize,
  brushColor, setBrushColor,
  size, setSize,
  movement, setMovement,
  diet, setDiet,
  drawing,
  handleRelease,
  isBaking
}: CreationSettingsProps) {
  const [showStats, setShowStats] = useState(false)

  return (
    <div className="modal-card col-settings">
      <div className="settings-scroll-area">
        <div className="section-title">Colors & Brush</div>
        <ColorPalette selectedColor={brushColor} onColorChange={setBrushColor} />
        <div style={{ marginTop: '16px' }}>
          <BrushPicker brushSize={brushSize} onBrushChange={setBrushSize} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', marginBottom: '16px' }}>
          <div className="section-title" style={{ margin: 0 }}>Traits</div>
          <div className={`dna-budget-badge ${drawing.decals.length > 10 ? 'over-budget' : ''}`}>
            <Activity size={16} className="dna-icon" />
            <span>{drawing.decals.length}/10 Points</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <TraitPicker label="Size" options={SIZE_OPTIONS} value={size} onChange={setSize} />
          <TraitPicker label="Movement" options={MOVEMENT_OPTIONS} value={movement} onChange={setMovement} />
          <TraitPicker label="Diet" options={DIET_OPTIONS} value={diet} onChange={setDiet} />
        </div>

        {/* Live Stats Collapsible Monitor */}
        <div className="stats-monitor-container">
          <button 
            className="stats-monitor-toggle" 
            onClick={() => setShowStats(!showStats)}
            aria-expanded={showStats}
          >
            <span>Live Stats Preview</span>
            {showStats ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          
          {showStats && (() => {
            const liveStats = calculateCreatureStats(size, movement, diet, drawing.decals);
            
            // Normalize for progress bars (0-100%)
            const pctSpeed = Math.min(100, (liveStats.speed / 240) * 100);
            const pctDamage = Math.min(100, (liveStats.damage / 150) * 100);
            const pctBravery = Math.min(100, liveStats.braveryBonus * 100);
            const pctSight = Math.min(100, (liveStats.sight / 800) * 100);
            const pctEfficiency = Math.max(0, 100 - (liveStats.drain / 10) * 100);

            return (
              <div className="stats-monitor">
                <div className="stat-row">
                  <div className="stat-label"><Zap size={14} /> Speed</div>
                  <div className="stat-bar-bg"><div className="stat-bar-fill" style={{ width: `${pctSpeed}%`, backgroundColor: 'var(--color-blue)' }} /></div>
                </div>
                <div className="stat-row">
                  <div className="stat-label"><Swords size={14} /> Damage</div>
                  <div className="stat-bar-bg"><div className="stat-bar-fill" style={{ width: `${pctDamage}%`, backgroundColor: 'var(--color-primary)' }} /></div>
                </div>
                <div className="stat-row">
                  <div className="stat-label"><Shield size={14} /> Bravery</div>
                  <div className="stat-bar-bg"><div className="stat-bar-fill" style={{ width: `${pctBravery}%`, backgroundColor: 'var(--color-tertiary)' }} /></div>
                </div>
                <div className="stat-row">
                  <div className="stat-label"><Eye size={14} /> Sight Range</div>
                  <div className="stat-bar-bg"><div className="stat-bar-fill" style={{ width: `${pctSight}%`, backgroundColor: 'var(--color-secondary)' }} /></div>
                </div>
                <div className="stat-row" title="Higher is better (slower starvation)">
                  <div className="stat-label"><Activity size={14} /> Efficiency</div>
                  <div className="stat-bar-bg"><div className="stat-bar-fill" style={{ width: `${pctEfficiency}%`, backgroundColor: 'var(--color-text-muted)' }} /></div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      <button 
        className="btn-action" 
        onClick={handleRelease}
        disabled={drawing.isEmpty || isBaking || drawing.decals.length > 10}
      >
        {isBaking ? 'Baking...' : drawing.decals.length > 10 ? 'Over DNA Budget!' : 'Release Creature'}
      </button>
    </div>
  )
}

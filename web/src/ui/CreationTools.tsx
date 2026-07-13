import { useState } from 'react'
import { Paintbrush, PaintBucket, Eraser, Undo2, Trash2, Eye, Smile, ChevronDown, Zap, Swords, Shield, Activity, Globe2 } from 'lucide-react'
import { Tooltip } from './Tooltip'
import { getDecalDataUrl } from '../renderer/decals'
import { DECAL_STATS } from '../constants'
import type { useDrawingCanvas } from '../hooks/useDrawingCanvas'

interface CreationToolsProps {
  drawing: ReturnType<typeof useDrawingCanvas>
  activeTab: 'CREATURE' | 'WORLD'
  setActiveTab: (tab: 'CREATURE' | 'WORLD') => void
}

export function CreationTools({ drawing, activeTab, setActiveTab }: CreationToolsProps) {
  const [activeCategory, setActiveCategory] = useState<'EYE' | 'MOUTH' | null>(null)

  return (
    <div className="col-tools-panel">
      {/* Tab Navigation Pill */}
      <button 
        className="tool-btn pill--primary"
        style={{ 
          padding: 'var(--space-md) var(--space-lg)',
          justifyContent: 'center',
          flexShrink: 0
        }} 
        onClick={() => setActiveTab('WORLD')}
      >
        <Globe2 size={24} />
        <span className="tool-label" style={{ fontSize: '18px' }}>World Sandbox</span>
      </button>

      {/* Main Tools Card */}
      <div className="modal-card col-tools" style={{ overflowY: 'auto', flex: 1 }}>
        <div>
          <div className="section-title">Tools</div>
          
          <button
            className={`tool-btn ${drawing.activeTool === 'BRUSH' && activeTab === 'CREATURE' ? 'active' : ''}`}
            onClick={() => { drawing.setActiveTool('BRUSH'); setActiveTab('CREATURE'); }}
          >
            <Paintbrush />
            <span className="tool-label">Draw</span>
          </button>
          
          <button
            className={`tool-btn tool-btn--spaced ${drawing.activeTool === 'FILL' ? 'active' : ''}`}
            onClick={() => drawing.setActiveTool('FILL')}
          >
            <PaintBucket />
            <span className="tool-label">Fill</span>
          </button>
          
          <button
            className={`tool-btn tool-btn--spaced ${drawing.activeTool === 'ERASER' ? 'active' : ''}`}
            onClick={() => { drawing.setActiveTool('ERASER'); drawing.setActiveStamp(null) }}
          >
            <Eraser />
            <span className="tool-label">Erase</span>
          </button>
        </div>

        <div>
          <div className="section-title">Features</div>
          
          <div className="feature-category-wrapper">
            <button
              className={`tool-btn ${activeCategory === 'EYE' ? 'active' : ''}`}
              onClick={() => setActiveCategory(prev => prev === 'EYE' ? null : 'EYE')}
            >
              <Eye />
              <span className="tool-label">Eyes</span>
              <ChevronDown className={`category-chevron ${activeCategory === 'EYE' ? 'open' : ''}`} size={18} />
            </button>
            
            {activeCategory === 'EYE' && (
              <div className="feature-flyout">
                {['CARNIVORE_EYE', 'HERBIVORE_EYE', 'INSECT_EYE', 'NOCTURNAL_EYE', 'AQUATIC_EYE'].map(style => (
                  <button 
                    key={style}
                    className={`flyout-item ${drawing.activeTool === 'STAMP' && drawing.activeStamp?.style === style ? 'active' : ''}`}
                    onClick={() => {
                      drawing.setActiveTool('STAMP');
                      drawing.setActiveStamp({ type: 'EYE', style });
                      setActiveCategory(null);
                    }}
                    aria-label={style.replace('_', ' ')}
                  >
                    <Tooltip
                      position="bottom"
                      content={
                        <>
                          <p className="decal-desc">{DECAL_STATS[style].desc}</p>
                          <div className="decal-stats">
                            {DECAL_STATS[style].stats.map((stat, i) => (
                              <div key={i} className={`decal-stat-row ${stat.isGood ? 'stat-good' : 'stat-bad'}`}>
                                {stat.label === 'Damage' && <Swords size={14} />}
                                {stat.label === 'Sight' && <Eye size={14} />}
                                {stat.label === 'Speed' && <Zap size={14} />}
                                {stat.label === 'Energy' && <Activity size={14} />}
                                {stat.label === 'Bravery' && <Shield size={14} />}
                                <span>{stat.value} {stat.label}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      }
                    >
                      <img src={getDecalDataUrl(style as any, 'OPEN')} width={32} height={32} alt={style} />
                    </Tooltip>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="feature-category-wrapper feature-category-wrapper--spaced">
            <button
              className={`tool-btn ${activeCategory === 'MOUTH' ? 'active' : ''}`}
              onClick={() => setActiveCategory(prev => prev === 'MOUTH' ? null : 'MOUTH')}
            >
              <Smile />
              <span className="tool-label">Mouths</span>
              <ChevronDown className={`category-chevron ${activeCategory === 'MOUTH' ? 'open' : ''}`} size={18} />
            </button>
            
            {activeCategory === 'MOUTH' && (
              <div className="feature-flyout">
                {['CARNIVORE_JAW', 'HERBIVORE_JAW', 'BEAK', 'PROBOSCIS', 'BALEEN'].map(style => (
                  <button 
                    key={style}
                    className={`flyout-item ${drawing.activeTool === 'STAMP' && drawing.activeStamp?.style === style ? 'active' : ''}`}
                    onClick={() => {
                      drawing.setActiveTool('STAMP');
                      drawing.setActiveStamp({ type: 'MOUTH', style });
                      setActiveCategory(null);
                    }}
                    aria-label={style.replace('_', ' ')}
                  >
                    <Tooltip
                      position="bottom"
                      content={
                        <>
                          <p className="decal-desc">{DECAL_STATS[style].desc}</p>
                          <div className="decal-stats">
                            {DECAL_STATS[style].stats.map((stat, i) => (
                              <div key={i} className={`decal-stat-row ${stat.isGood ? 'stat-good' : 'stat-bad'}`}>
                                {stat.label === 'Damage' && <Swords size={14} />}
                                {stat.label === 'Sight' && <Eye size={14} />}
                                {stat.label === 'Speed' && <Zap size={14} />}
                                {stat.label === 'Energy' && <Activity size={14} />}
                                {stat.label === 'Bravery' && <Shield size={14} />}
                                <span>{stat.value} {stat.label}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      }
                    >
                      <img src={getDecalDataUrl(style as any, 'OPEN')} width={32} height={32} alt={style} />
                    </Tooltip>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="section-title">Actions</div>
          <button 
            className="tool-btn" 
            onClick={drawing.undo} 
            disabled={!drawing.canUndo}
            style={{ opacity: drawing.canUndo ? 1 : 0.5 }}
          >
            <Undo2 />
            <span className="tool-label">Undo</span>
          </button>
          <button 
            className="tool-btn tool-btn--spaced" 
            onClick={drawing.clear}
          >
            <Trash2 />
            <span className="tool-label">Clear</span>
          </button>
        </div>
      </div>
    </div>
  )
}


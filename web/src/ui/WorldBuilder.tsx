import { useState, useEffect, useRef } from 'react'
import { X, Wand2, Save, Paintbrush, AlertCircle, Sprout, Pickaxe, Waves, Mountain, Globe2, Map, Dices } from 'lucide-react'
import { worldRef } from '../engine/worldRef'
import { type MapType } from '../utils/terrainGenerator'
import { useTerrainPainter } from '../hooks/useTerrainPainter'

type TerrainType = 'WATER' | 'DIRT' | 'GRASS' | 'ROCK';

const TERRAIN_COLORS: Record<TerrainType, string> = {
  WATER: '#4CA8D1',
  DIRT:  '#D6A675',
  GRASS: '#84C270',
  ROCK:  '#979A9E',
};

const TERRAIN_ICONS: Record<TerrainType, React.ElementType> = {
  GRASS: Sprout,
  DIRT:  Pickaxe,
  WATER: Waves,
  ROCK:  Mountain,
};

const MAP_TYPE_LABELS: Record<MapType, { label: string, Icon: React.ElementType }> = {
  pangaea:      { label: 'Pangaea', Icon: Globe2 },
  archipelago:  { label: 'Archipelago', Icon: Map },
  'great-lakes':{ label: 'Great Lakes', Icon: Waves },
  chaos:        { label: 'Chaos', Icon: Dices },
};

interface WorldBuilderTabProps {
  isVisible: boolean;
  closePanel: () => void;
  onSwitchToCreature: () => void;
}

export function WorldBuilderTab({ isVisible, closePanel, onSwitchToCreature }: WorldBuilderTabProps) {
  const [mapType, setMapType]         = useState<MapType>('pangaea');
  const [activeBrush, setActiveBrush] = useState<TerrainType>('GRASS');
  const [brushSize, setBrushSize]     = useState(3);
  const [showApplyTip, setShowApplyTip] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const multiplier   = worldRef.current.mapSizeMultiplier || 1;
  const minimapScale = 0.1 / multiplier;

  const [worldDims, setWorldDims] = useState(() => ({
    w: worldRef.current.worldWidth,
    h: worldRef.current.worldHeight,
  }));

  const {
    canvasRef,
    cursorRef,
    isDirty,
    isGenerating,
    generateProcedural,
    cancelGeneration,
    commitTerrain,
    isDirtyRef,
    handlers,
  } = useTerrainPainter({
    worldDims,
    minimapScale,
    activeBrush,
    brushSize,
    isPaintingAllowed: true
  });

  useEffect(() => {
    if (isVisible) {
      const syncDims = () => {
        setWorldDims({
          w: worldRef.current.worldWidth,
          h: worldRef.current.worldHeight,
        });
      };
      syncDims();
      window.addEventListener('resize', syncDims);
      return () => window.removeEventListener('resize', syncDims);
    } else {
      if (isDirtyRef.current) {
        commitTerrain();
      }
    }
  }, [isVisible, commitTerrain, isDirtyRef]);

  const handleApply = () => {
    commitTerrain();
    setShowApplyTip(true);
    setTimeout(() => setShowApplyTip(false), 2500);
  };

  return (
    <div style={{
      display: isVisible ? 'flex' : 'none',
      justifyContent: 'center',
      flex: 1,
      height: '100%',
      minWidth: 0,
      gap: '24px',
    }}>

      {/* ── LEFT SIDEBAR (Using Design System Classes) ──────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
        {/* Tab Navigation Pill */}
        <button
          className="tool-btn"
          onClick={onSwitchToCreature}
          style={{ 
            backgroundColor: 'white', 
            border: '4px solid var(--color-primary)', 
            color: 'var(--color-primary-shadow)',
            boxShadow: 'var(--shadow-btn-pink)',
            padding: '16px 24px',
            borderRadius: 'var(--radius-full)',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Paintbrush size={24} />
          <span className="tool-label" style={{ fontSize: '18px' }}>Creature Lab</span>
        </button>

        {/* Main Tools Card */}
        <div className="modal-card col-tools" style={{ overflowY: 'auto', flex: 1 }}>


        <div>
          <div className="section-title">Paint Terrain</div>
          {(['GRASS', 'DIRT', 'WATER', 'ROCK'] as TerrainType[]).map(t => {
            const active = activeBrush === t;
            const Icon = TERRAIN_ICONS[t];
            return (
              <button
                key={t}
                className={`tool-btn ${active ? 'active' : ''}`}
                onClick={() => setActiveBrush(t)}
                style={{
                  marginBottom: '8px',
                  ...(active ? { backgroundColor: TERRAIN_COLORS[t], borderColor: 'white', color: 'white' } : {})
                }}
              >
                <Icon size={20} />
                <span className="tool-label">{t.charAt(0) + t.slice(1).toLowerCase()}</span>
              </button>
            );
          })}

          <div style={{ marginTop: '16px' }}>
            <div className="section-title">Brush Size</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="range"
                min={1}
                max={8}
                value={brushSize}
                onChange={e => setBrushSize(Number(e.target.value))}
                style={{ flex: 1, accentColor: '#4A3B32' }}
              />
              <span style={{
                minWidth: '24px',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: 900,
                color: 'var(--color-text)',
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '4px',
                border: '2px solid #E2DDD5'
              }}>{brushSize}</span>
            </div>
          </div>
        </div>

        <div>
          <div className="section-title">Generate Map</div>
          <select
            value={mapType}
            onChange={e => setMapType(e.target.value as MapType)}
            disabled={isGenerating}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: '3px solid #E2DDD5',
              backgroundColor: isGenerating ? '#C8C4BD' : 'white',
              color: 'var(--color-text)',
              fontWeight: 800,
              fontSize: '14px',
              outline: 'none',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              marginBottom: '12px',
              fontFamily: 'var(--font-body)'
            }}
          >
            {(Object.entries(MAP_TYPE_LABELS) as [MapType, typeof MAP_TYPE_LABELS[MapType]][]).map(([val, {label}]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          <button
            className="tool-btn"
            onClick={() => isGenerating ? cancelGeneration() : generateProcedural(mapType)}
            style={{ backgroundColor: isGenerating ? '#E2DDD5' : 'var(--color-text)', color: isGenerating ? 'var(--color-text)' : 'white', borderColor: 'var(--color-text)' }}
          >
            <Wand2 size={20} />
            <span className="tool-label">{isGenerating ? 'Cancel' : 'Generate'}</span>
          </button>
        </div>

        <div>
          <div className="section-title">Apply to World</div>
          <button
            className="tool-btn"
            onClick={handleApply}
            disabled={!isDirty}
            style={{
              backgroundColor: isDirty ? 'var(--color-secondary)' : '#E2DDD5',
              color: isDirty ? 'white' : 'var(--color-text-muted)',
              borderColor: isDirty ? 'white' : '#E2DDD5',
              opacity: isDirty ? 1 : 0.6,
              boxShadow: isDirty ? 'var(--shadow-btn-green)' : 'none'
            }}
          >
            <Save size={20} />
            <span className="tool-label">Apply Changes</span>
          </button>

          {/* Unsaved changes badge */}
          {isDirty && !showApplyTip && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '12px',
              fontSize: '12px',
              fontWeight: 800,
              color: 'var(--color-danger)',
              padding: '8px',
              backgroundColor: '#FFE5E5',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--color-danger)',
            }}>
              <AlertCircle size={16} />
              Unsaved changes
            </div>
          )}

          {showApplyTip && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '12px',
              fontSize: '12px',
              fontWeight: 800,
              color: 'var(--color-secondary-shadow)',
              padding: '8px',
              backgroundColor: '#E8F5ED',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--color-secondary)',
            }}>
              <Save size={16} />
              Applied!
            </div>
          )}
        </div>
      </div>
    </div>

      {/* ── MAIN CANVAS AREA ──────────────────────────────────────── */}
      <div
        ref={canvasContainerRef}
        className="col-canvas"
        style={{
          flex: '0 1 auto',
          width: 'auto',
          height: '100%',
          aspectRatio: (worldDims.w / worldDims.h).toString(),
          maxWidth: 'calc(100% - 204px)',
          backgroundColor: '#FFFDF8',
          borderRadius: 'var(--radius-lg)',
          border: '4px solid var(--color-text)',
          boxShadow: 'var(--shadow-panel)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          /* Blueprint dotted background to fill empty space elegantly */
          backgroundImage: 'radial-gradient(#E2DDD5 15%, transparent 15%)',
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0',
          containerType: 'size'
        }}
      >
        {/*
          CRITICAL UI RULE (DO NOT REMOVE OR CHANGE):
          We MUST use `containerType: 'size'` on the parent and `100cqmin` on the child.
          This mathematically forces this div to be a PERFECT SQUARE equal to the smallest dimension of the screen.
          If this becomes a rectangle, `object-fit: contain` will letterbox the canvas, causing `getBoundingClientRect` 
          and `offsetX/Y` to be completely disjointed from the visual pixels, causing massive pointer drift when painting terrain.
          DO NOT USE `aspect-ratio: 1/1` here, it will fail due to flexbox rules.
        */}
        <div style={{
          position: 'relative',
          width: '100cqmin',
          height: '100cqmin',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: TERRAIN_COLORS.WATER,
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(74,59,50,0.15), 0 0 0 4px var(--color-text)',
          overflow: 'hidden'
        }}>
          <canvas
            ref={canvasRef}
            {...handlers}
            style={{
              cursor: 'none',
              touchAction: 'none',
              imageRendering: 'pixelated',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block'
            }}
          />
          
          {/* Brush cursor overlay */}
          <div
            ref={cursorRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              borderRadius: '50%',
              backgroundColor: TERRAIN_COLORS[activeBrush],
              opacity: 0,
              pointerEvents: 'none',
              zIndex: 10,
              boxShadow: '0 0 0 3px rgba(255,255,255,0.9), 0 0 0 6px rgba(0,0,0,0.3)',
              willChange: 'transform',
            }}
          />
        </div>

        {/* Generating overlay */}
        {isGenerating && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 253, 248, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 20,
            gap: '16px',
            pointerEvents: 'none',
          }}>
            <Globe2 size={64} color="var(--color-text)" style={{ animation: 'spin 3s linear infinite' }} />
            <div style={{ fontWeight: 900, color: 'var(--color-text)', fontSize: '24px', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Forging Terrain...
            </div>
          </div>
        )}

        {/* Close button */}
        <button
          className="btn-close"
          onClick={() => {
            if (isDirtyRef.current) commitTerrain();
            closePanel();
          }}
          aria-label="Close panel"
          style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 50 }}
        >
          <X size={24} />
        </button>

        {/* Canvas watermark label */}
        <div style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          fontSize: '14px',
          fontWeight: 900,
          color: 'var(--color-text-muted)',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          pointerEvents: 'none',
          backgroundColor: 'white',
          padding: '8px 16px',
          borderRadius: 'var(--radius-full)',
          border: '3px solid #E2DDD5',
          boxShadow: 'var(--shadow-btn-neutral)',
        }}>
          World Sandbox
        </div>
      </div>
    </div>
  );
}

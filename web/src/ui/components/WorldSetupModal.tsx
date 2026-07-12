import { useState, useEffect, useRef, useMemo } from 'react';
import { Check, X, Map, Droplets, Mountain, Globe2, Eraser, Loader2, Dices } from 'lucide-react';
import { type MapType } from '../../utils/terrainGenerator';
import { useTerrainPainter } from '../../hooks/useTerrainPainter';
import { worldRef } from '../../engine/worldRef';
import { TERRAIN_CELL_SIZE } from '../../engine/worldRef';
import { getWorldWidth, getWorldHeight } from '../../constants';
import { useUIStore } from '../../store/useUIStore';
import './WorldSetupModal.css';

interface WorldSetupModalProps {
  onStart: (multiplier: number, mapType: MapType | 'custom', mapName: string) => void;
  onClose: () => void;
}

type TerrainType = 'WATER' | 'DIRT' | 'GRASS' | 'ROCK';

export function WorldSetupModal({ onStart, onClose }: WorldSetupModalProps) {
  const [multiplier, setMultiplier] = useState<number>(2);
  const [mapType, setMapType] = useState<MapType | 'custom'>('pangaea');
  const [mapName, setMapName] = useState<string>('My Ecosystem');
  
  const [activeBrush, setActiveBrush] = useState<TerrainType>('GRASS');
  const [brushSize, setBrushSize] = useState<number>(3);

  // Compute dimensions based on multiplier — memoized so we don't create a new object
  // reference on every render (which would cause an infinite generation loop via useCallback deps)
  const worldDims = useMemo(() => ({
    w: getWorldWidth() * multiplier,
    h: getWorldHeight() * multiplier,
  }), [multiplier]);
  
  // Minimap scaling: epic maps shouldn't blow up the canvas element
  const minimapScale = 0.1 / multiplier; // keeps preview canvas size constant-ish

  const isPaintingAllowed = true;

  const {
    canvasRef,
    cursorRef,
    isDirtyRef,
    isGenerating,
    generateProcedural,
    cancelGeneration,
    clearCanvas,
    draftTerrainRef,
    handlers
  } = useTerrainPainter({
    worldDims,
    minimapScale,
    activeBrush,
    brushSize,
    isPaintingAllowed
  });

  // Keep stable refs to the latest versions of these callbacks.
  // This lets the useEffect depend only on [mapType, multiplier] so it doesn't
  // re-fire every time generateProcedural/clearCanvas get a new reference due to
  // worldDims changing — which caused isGenerating to get stuck at `true`.
  const generateProceduralRef = useRef(generateProcedural);
  generateProceduralRef.current = generateProcedural;
  const clearCanvasRef = useRef(clearCanvas);
  clearCanvasRef.current = clearCanvas;

  // Re-generate procedural map on scale or type change (unless custom)
  useEffect(() => {
    if (mapType !== 'custom') {
      // Force clean generate so we don't prompt on scale change for procedural maps
      generateProceduralRef.current(mapType as MapType, true);
    } else {
      clearCanvasRef.current();
    }
  }, [mapType, multiplier]);

  const handleStart = () => {
    // If painting, inject the custom map before starting
    if (draftTerrainRef.current) {
      // Directly assign draft to the scratchpad so that when TitleScreen initializes the game, it picks it up
      // Or we can let TitleScreen call TerrainGenerator for procedural... but since we generated a preview, 
      // we can just re-use the preview array for zero-loading screen start!
      // Actually, we must sync it to `worldRef` now so TitleScreen just sees it as "done".
      
      // We'll let TitleScreen do the formal updateWorldDimensions, but we'll stash the pre-generated terrain.
      // Wait, updateWorldDimensions re-initializes terrain. We need to pass the draft back to `onStart` or store it in `worldRef`.
      // Actually, in `TitleScreen`, it calls `updateWorldDimensions()` which creates a new `Uint8Array`.
      // So we should attach `preGeneratedTerrain` to worldRef temporarily, and `updateWorldDimensions` will consume it.
      
      (worldRef.current as any).preGeneratedTerrain = {
        data: draftTerrainRef.current,
        tw: Math.ceil(worldDims.w / TERRAIN_CELL_SIZE),
        th: Math.ceil(worldDims.h / TERRAIN_CELL_SIZE)
      };
    }
    onStart(multiplier, mapType, mapName || 'My Ecosystem');
  };

  const handleClose = () => {
    cancelGeneration();
    onClose();
  };

  const requestConfirm = useUIStore(s => s.requestConfirm);

  const handleTypeSelect = (type: MapType | 'custom') => {
    if (isDirtyRef.current && mapType !== type) {
      requestConfirm(
        "Switching maps will overwrite your hand-painted changes. Continue?",
        () => setMapType(type)
      );
      return;
    }
    setMapType(type);
  };

  const handleScaleSelect = (newMultiplier: number) => {
    if (multiplier === newMultiplier) return;
    if (isDirtyRef.current) {
      requestConfirm(
        "Changing world size will overwrite your hand-painted changes. Continue?",
        () => setMultiplier(newMultiplier)
      );
    } else {
      setMultiplier(newMultiplier);
    }
  };

  const handleReRoll = () => {
    if (isDirtyRef.current) {
      requestConfirm(
        "Re-rolling will overwrite your hand-painted changes. Continue?",
        () => generateProceduralRef.current(mapType as MapType, true)
      );
    } else {
      generateProceduralRef.current(mapType as MapType, true);
    }
  };

  return (
    <>
      <div className="world-setup-backdrop">
        <div className="world-setup-modal">
          
          <button className="close-modal-btn" onClick={handleClose}>
            <X size={24} />
          </button>

          {/* Left Panel: Preview */}
          <div className="world-setup-preview">
            <div className="world-setup-preview-header">
              {mapType === 'custom' ? 'Paint Your World' : 'Map Preview'}
            </div>
            
            <div className="world-setup-canvas-container">
              {isGenerating && (
                <div style={{ position: 'absolute', zIndex: 20, color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <Loader2 size={32} className="lucide-spin" style={{ animation: 'spin 2s linear infinite' }} />
                  <span style={{ fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Generating...</span>
                </div>
              )}
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* The wrapper perfectly letterboxes itself via aspect-ratio, making manual math obsolete */}
                <div style={{ 
                  position: 'relative', 
                  maxWidth: '100%', 
                  maxHeight: '100%', 
                  aspectRatio: `${worldDims.w} / ${worldDims.h}`,
                  height: '100%', // this forces the flex child to expand to fit
                  display: 'flex'
                }}>
                  <canvas 
                    ref={canvasRef}
                    {...handlers}
                    style={{ 
                      cursor: isPaintingAllowed ? 'none' : 'default',
                      touchAction: 'none',
                      imageRendering: 'pixelated',
                      width: '100%',
                      height: '100%',
                      display: 'block'
                    }}
                  />
                  <div 
                    ref={cursorRef}
                    style={{
                      position: 'absolute',
                      top: 0,
                    left: 0,
                    borderRadius: '50%',
                    backgroundColor: activeBrush === 'WATER' ? '#4CA8D1' : activeBrush === 'DIRT' ? '#D6A675' : activeBrush === 'GRASS' ? '#84C270' : '#979A9E',
                    opacity: 0,
                    pointerEvents: 'none',
                    zIndex: 10,
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.8), 0 0 0 2px rgba(0,0,0,0.5)',
                    willChange: 'transform',
                    display: isPaintingAllowed ? 'block' : 'none'
                  }}
                />
                </div>
                {mapType !== 'custom' && (
                  <button 
                    className="reroll-fab"
                    onClick={handleReRoll}
                    disabled={isGenerating}
                    title="Re-roll Map Seed"
                  >
                    <Dices size={24} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>
            
            {/* Game Tools Bar - Active for all maps now! */}
            <div className="world-setup-tools">
              <div className="brush-group">
                <button className={`setup-tool-btn ${activeBrush === 'GRASS' ? 'active' : ''}`} onClick={() => setActiveBrush('GRASS')}>
                  <div className="icon-circle icon-pangaea" style={{width:32,height:32}}><Map size={16}/></div>
                  Grass
                </button>
                <button className={`setup-tool-btn ${activeBrush === 'DIRT' ? 'active' : ''}`} onClick={() => setActiveBrush('DIRT')}>
                  <div className="icon-circle icon-custom" style={{width:32,height:32}}><Mountain size={16}/></div>
                  Dirt
                </button>
                <button className={`setup-tool-btn ${activeBrush === 'WATER' ? 'active' : ''}`} onClick={() => setActiveBrush('WATER')}>
                  <div className="icon-circle icon-archipelago" style={{width:32,height:32}}><Droplets size={16}/></div>
                  Water
                </button>
                <button className={`setup-tool-btn ${activeBrush === 'ROCK' ? 'active' : ''}`} onClick={() => setActiveBrush('ROCK')}>
                  <div className="icon-circle icon-lakes" style={{width:32,height:32}}><Eraser size={16}/></div>
                  Rock
                </button>
              </div>
              
              <div className="brush-size-group">
                <div className="brush-size-label">Brush Size: <span style={{ color: 'var(--color-text-muted)' }}>{brushSize}</span></div>
                <input 
                  type="range" 
                  className="brush-slider" 
                  min="1" max="15" 
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Right Panel: Controls */}
          <div className="world-setup-controls">
            <div className="world-setup-title">
              <h2>World Setup</h2>
              <p className="world-setup-subtitle">Configure your ecosystem</p>
            </div>
            
            <div className="world-setup-scroll">
              
              <div>
                <div className="section-label">Ecosystem Name</div>
                <input 
                  type="text" 
                  className="map-name-input"
                  value={mapName}
                  onChange={(e) => setMapName(e.target.value)}
                  placeholder="My Ecosystem"
                  maxLength={30}
                />
              </div>

              <div>
                <div className="section-label">1. Select Scale</div>
                <div className="scale-toggle-container">
                  <div className={`scale-tab ${multiplier === 1 ? 'active' : ''}`} onClick={() => handleScaleSelect(1)}>Small</div>
                  <div className={`scale-tab ${multiplier === 2 ? 'active' : ''}`} onClick={() => handleScaleSelect(2)}>Standard</div>
                  <div className={`scale-tab ${multiplier === 3 ? 'active' : ''}`} onClick={() => handleScaleSelect(3)}>Large</div>
                </div>
                <div className="size-context-box">
                  {multiplier === 1 && <><span>Max 250 Creatures.</span> A balanced environment. Good for focused observation.</>}
                  {multiplier === 2 && <><span>Max 1000 Creatures.</span> A massive continent. Perfect for diverse evolution.</>}
                  {multiplier === 3 && <><span>Max 2250 Creatures.</span> An entire world. Warning: High-end systems only!</>}
                </div>
              </div>

              <div>
                <div className="section-label">2. Select Terrain</div>
                <div className="map-type-list">
                  
                  <button className={`map-type-btn ${mapType === 'custom' ? 'active' : ''}`} onClick={() => handleTypeSelect('custom')}>
                    <div className="icon-circle icon-custom"><Eraser size={24} /></div>
                    <div>
                      <div className="btn-title">Blank Canvas</div>
                      <div className="btn-subtitle">Start from scratch on an empty plain</div>
                    </div>
                    {mapType === 'custom' && <Check className="check-icon" size={28} strokeWidth={3} />}
                  </button>

                  <button className={`map-type-btn ${mapType === 'great-lakes' ? 'active' : ''}`} onClick={() => handleTypeSelect('great-lakes')}>
                    <div className="icon-circle icon-lakes"><Droplets size={24} /></div>
                    <div>
                      <div className="btn-title">Great Lakes</div>
                      <div className="btn-subtitle">Large lakes surrounded by interconnected land</div>
                    </div>
                    {mapType === 'great-lakes' && <Check className="check-icon" size={28} strokeWidth={3} />}
                  </button>

                  <button className={`map-type-btn ${mapType === 'archipelago' ? 'active' : ''}`} onClick={() => handleTypeSelect('archipelago')}>
                    <div className="icon-circle icon-archipelago"><Map size={24} /></div>
                    <div>
                      <div className="btn-title">Archipelago</div>
                      <div className="btn-subtitle">Scattered islands surrounded by water</div>
                    </div>
                    {mapType === 'archipelago' && <Check className="check-icon" size={28} strokeWidth={3} />}
                  </button>

                  <button className={`map-type-btn ${mapType === 'pangaea' ? 'active' : ''}`} onClick={() => handleTypeSelect('pangaea')}>
                    <div className="icon-circle icon-pangaea"><Globe2 size={24} /></div>
                    <div>
                      <div className="btn-title">Pangaea</div>
                      <div className="btn-subtitle">One massive, continuous grassy landmass</div>
                    </div>
                    {mapType === 'pangaea' && <Check className="check-icon" size={28} strokeWidth={3} />}
                  </button>
                  
                  <button className={`map-type-btn ${mapType === 'chaos' ? 'active' : ''}`} onClick={() => handleTypeSelect('chaos')}>
                    <div className="icon-circle icon-chaos"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M2 12h20"/><path d="m4.9 4.9 14.2 14.2"/><path d="m4.9 19.1 14.2-14.2"/></svg></div>
                    <div>
                      <div className="btn-title">Chaos</div>
                      <div className="btn-subtitle">Scattered terrain of all types</div>
                    </div>
                    {mapType === 'chaos' && <Check className="check-icon" size={28} strokeWidth={3} />}
                  </button>

                </div>
              </div>

            </div>
            
            

            <button 
              className="start-simulation-btn" 
              onClick={handleStart}
              disabled={isGenerating}
            >
              Start Simulation
            </button>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}



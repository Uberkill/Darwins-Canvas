import { useState } from 'react'
import { useStore } from '../store/useStore'
import type { CreatureSize, MovementType, DietType } from '../types'
import { useDrawingCanvas } from '../hooks/useDrawingCanvas'
import { ColorPalette } from './ColorPalette'
import { BrushPicker } from './BrushPicker'
import { TraitPicker, SIZE_OPTIONS, MOVEMENT_OPTIONS, DIET_OPTIONS } from './TraitPicker'
import { Paintbrush, PaintBucket, Eraser, Undo2, Trash2, X, Dices } from 'lucide-react'
import { generateRandomName } from '../utils/nameGenerator'

export function CreationPanel() {
  const isPanelOpen   = useStore((s) => s.isPanelOpen)
  const closePanel    = useStore((s) => s.closePanel)
  const queueCreature = useStore((s) => s.queueCreature)

  // Settings state
  const [brushSize,  setBrushSize]  = useState(10)
  const [brushColor, setBrushColor] = useState('#4A3B32')

  // Trait state
  const [name,     setName]     = useState('')
  const [size,     setSize]     = useState<CreatureSize>('MEDIUM')
  const [movement, setMovement] = useState<MovementType>('CRAWLER')
  const [diet,     setDiet]     = useState<DietType>('HERBIVORE')

  // Drawing Canvas Hook (lifted to root of modal)
  const drawing = useDrawingCanvas(brushSize, brushColor)

  // Custom Cursor for Canvas
  const [showCursor, setShowCursor] = useState(false)
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 })

  function handleRelease() {
    if (drawing.isEmpty) return
    const dataURL = drawing.exportBase64()
    
    // Auto-generate name if left blank
    const finalName = name.trim() || generateRandomName()
    
    queueCreature({ drawingData: dataURL, size, movement, diet, name: finalName })
    drawing.clear()
    setName('') // reset name for next creature
    closePanel()
  }

  return (
    <div className={`creation-modal-overlay ${isPanelOpen ? 'open' : ''}`}>
      <div className="creation-modal-container">
        
        {/* Left Column: Tools */}
        <div className="modal-card col-tools">
          <div>
            <div className="section-title">Tools</div>
            
            <button
              className={`tool-btn ${drawing.activeTool === 'BRUSH' ? 'active' : ''}`}
              onClick={() => drawing.setActiveTool('BRUSH')}
            >
              <Paintbrush />
              <span className="tool-label">Draw</span>
            </button>
            
            <button
              className={`tool-btn ${drawing.activeTool === 'FILL' ? 'active' : ''}`}
              style={{ marginTop: '12px' }}
              onClick={() => drawing.setActiveTool('FILL')}
            >
              <PaintBucket />
              <span className="tool-label">Fill</span>
            </button>
            
            <button
              className={`tool-btn ${drawing.activeTool === 'ERASER' ? 'active' : ''}`}
              style={{ marginTop: '12px' }}
              onClick={() => drawing.setActiveTool('ERASER')}
            >
              <Eraser />
              <span className="tool-label">Erase</span>
            </button>
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
              className="tool-btn" 
              style={{ marginTop: '12px' }} 
              onClick={drawing.clear}
            >
              <Trash2 />
              <span className="tool-label">Clear</span>
            </button>
          </div>
        </div>

        {/* Center Column: Massive Canvas */}
        <div className="col-canvas-area" style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0, gap: '16px' }}>
          
          <div className="canvas-header" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', maxWidth: '400px' }}>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Name your creature..." 
                className="name-input"
                aria-label="Creature Name"
                style={{ textAlign: 'center', flex: 1 }}
              />
              <button 
                className="icon-btn" 
                onClick={() => setName(generateRandomName())}
                aria-label="Randomize Name"
                title="Randomize Name"
                style={{ backgroundColor: 'white', flexShrink: 0, padding: '12px', border: '3px solid #E2DDD5', borderRadius: '16px', cursor: 'pointer' }}
              >
                <Dices size={24} />
              </button>
            </div>
          </div>
          
          <button 
            className="btn-close" 
            onClick={closePanel} 
            aria-label="Close Creation Modal" 
            style={{ position: 'absolute', right: 0, top: 0, zIndex: 50 }}
          >
            <X />
          </button>

          <div 
            className="col-canvas"
            style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', flex: 1, minHeight: 0 }}
            onPointerEnter={(e) => {
              if (e.pointerType === 'mouse') setShowCursor(true)
            }}
            onPointerLeave={() => {
              setShowCursor(false)
              drawing.onPointerUp()
            }}
            onPointerMove={(e) => {
              if (e.pointerType === 'mouse') {
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
                if (!showCursor) setShowCursor(true)
              } else {
                if (showCursor) setShowCursor(false)
              }
              drawing.onPointerMove(e as any)
            }}
          >
            <canvas
            ref={drawing.canvasRef}
            className="drawing-canvas"
            style={{ cursor: 'none' }}
            onPointerDown={drawing.onPointerDown}
            onPointerUp={drawing.onPointerUp}
            aria-label="Drawing space"
          />

          {/* Custom Brush Cursor */}
          {showCursor && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                transform: `translate(${cursorPos.x - brushSize / 2}px, ${cursorPos.y - brushSize / 2}px)`,
                width: brushSize,
                height: brushSize,
                borderRadius: '50%',
                backgroundColor: drawing.activeTool === 'ERASER' ? 'white' : brushColor,
                border: drawing.activeTool === 'ERASER' ? '3px solid #E2DDD5' : 'none',
                opacity: drawing.activeTool === 'FILL' ? 0 : 0.8,
                zIndex: 10
              }}
            />
          )}
          </div>
        </div>

        {/* Right Column: Settings */}
        <div className="modal-card col-settings">
          <div>
            <div className="section-title">Colors & Brush</div>
            <ColorPalette selectedColor={brushColor} onColorChange={setBrushColor} />
            <div style={{ marginTop: '16px' }}>
              <BrushPicker brushSize={brushSize} onBrushChange={setBrushSize} />
            </div>

            <div className="section-title" style={{ marginTop: '24px' }}>Traits</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <TraitPicker label="Size" options={SIZE_OPTIONS} value={size} onChange={setSize} />
              <TraitPicker label="Movement" options={MOVEMENT_OPTIONS} value={movement} onChange={setMovement} />
              <TraitPicker label="Diet" options={DIET_OPTIONS} value={diet} onChange={setDiet} />
            </div>
          </div>

          <button 
            className="btn-action" 
            onClick={handleRelease}
            disabled={drawing.isEmpty}
          >
            Release Creature
          </button>
        </div>

      </div>
    </div>
  )
}

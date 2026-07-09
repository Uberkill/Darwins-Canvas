import { useState } from 'react'
import { Dices, X, PaintBucket } from 'lucide-react'
import { generateRandomName } from '../utils/nameGenerator'
import { getDecalDataUrl } from '../renderer/decals'
import type { useDrawingCanvas } from '../hooks/useDrawingCanvas'

interface CreationCanvasProps {
  name: string
  setName: (name: string) => void
  drawing: ReturnType<typeof useDrawingCanvas>
  uiScale: number
  brushSize: number
  brushColor: string
  closePanel: () => void
}

export function CreationCanvas({
  name, setName,
  drawing,
  uiScale,
  brushSize, brushColor,
  closePanel
}: CreationCanvasProps) {
  const [showCursor, setShowCursor] = useState(false)
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100, scale: 1 })

  return (
    <div className="col-canvas-area" style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0, gap: '16px' }}>
      
      <div className="canvas-header" style={{ display: 'flex', justifyContent: 'center', width: '100%', flexDirection: 'column', alignItems: 'center' }}>
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
        <div className="canvas-helper-text" style={{ marginTop: '8px', fontSize: '14px', color: '#66594C', fontWeight: 600, opacity: 0.8 }}>
          Draw your creature facing right! ➔
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
      >
        <div
          style={{ position: 'relative', aspectRatio: '1/1', maxHeight: '100%', maxWidth: '100%' }}
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
              const scale = (rect.width / uiScale) / 1024
              setCursorPos({ 
                x: (e.clientX - rect.left) / uiScale, 
                y: (e.clientY - rect.top) / uiScale, 
                scale 
              })
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
            style={{ cursor: 'none', display: 'block', width: '100%', height: '100%', touchAction: 'none' }}
            onPointerDown={drawing.onPointerDown}
            onPointerUp={drawing.onPointerUp}
            aria-label="Drawing space"
          />

          {/* Render Decals on top of canvas */}
          {drawing.decals.map((decal, i) => (
            <img
              key={i}
              src={getDecalDataUrl(decal.style as any, 'OPEN')}
              style={{
                position: 'absolute',
                top: `${(decal.y / 1024) * 100}%`,
                left: `${(decal.x / 1024) * 100}%`,
                width: `${(decal.scale / 1024) * 100}%`,
                height: `${(decal.scale / 1024) * 100}%`,
                transform: `translate(-50%, -50%) rotate(${decal.rotation}rad)`,
                pointerEvents: 'none',
                zIndex: 5
              }}
              alt="decal"
            />
          ))}

          {/* Custom Brush Cursor */}
          {showCursor && (() => {
            if (drawing.activeTool === 'FILL') {
              return (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    pointerEvents: 'none',
                    transform: `translate(${cursorPos.x - 12}px, ${cursorPos.y - 12}px)`,
                    color: brushColor,
                    filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))',
                    zIndex: 10
                  }}
                >
                  <PaintBucket size={24} />
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '2px',
                    width: '4px',
                    height: '4px',
                    backgroundColor: 'white',
                    border: '1px solid black',
                    borderRadius: '50%'
                  }} />
                </div>
              );
            }

            // If stamping, cursor should reflect stamp size
            const currentBrushSize = drawing.activeTool === 'STAMP' ? Math.max(120, brushSize * 6) : brushSize;
            const cssSize = currentBrushSize * cursorPos.scale;
            return (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  pointerEvents: 'none',
                  transform: `translate(${cursorPos.x - cssSize / 2}px, ${cursorPos.y - cssSize / 2}px)`,
                  width: cssSize,
                  height: cssSize,
                  borderRadius: '50%',
                  backgroundColor: drawing.activeTool === 'ERASER' ? 'white' : brushColor,
                  border: drawing.activeTool === 'ERASER' ? '3px solid #E2DDD5' : 'none',
                  boxShadow: drawing.activeTool !== 'ERASER' ? '0 0 0 1px white, 0 0 0 2px black' : 'none',
                  opacity: 0.8,
                  zIndex: 10
                }}
              />
            );
          })()}
        </div>
      </div>
    </div>
  )
}

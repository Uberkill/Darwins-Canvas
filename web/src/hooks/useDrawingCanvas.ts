import { useCallback, useEffect, useRef, useState } from 'react'
import { setupCanvas, getCanvasPoint } from '../renderer/canvasUtils'
import type { Decal } from '../types'
import { useCanvasHistory } from './useCanvasHistory'
import { applyBrushSettings, checkIsEmpty, floodFill, getPixelBounds, hexToRgb } from '../utils/drawingUtils'

const CANVAS_SIZE = 1024

type DrawingTool = 'BRUSH' | 'FILL' | 'ERASER' | 'STAMP'

export interface DrawingCanvasHandle {
  canvasRef:     React.RefObject<HTMLCanvasElement | null>
  isEmpty:       boolean
  activeTool:    DrawingTool
  setActiveTool: (tool: DrawingTool) => void
  activeStamp:   { type: 'EYE' | 'MOUTH', style: string } | null
  setActiveStamp: (stamp: { type: 'EYE' | 'MOUTH', style: string } | null) => void
  exportBase64:  () => { image: string; adjustedDecals: Decal[] }
  clear:         () => void
  undo:          () => void
  canUndo:       boolean
  onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void
  onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void
  onPointerUp:   () => void
  decals:        Decal[]
}

/**
 * useDrawingCanvas — manages all drawing state for the creation canvas.
 */
export function useDrawingCanvas(
  brushSize: number,
  brushColor: string,
): DrawingCanvasHandle {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const ctxRef       = useRef<CanvasRenderingContext2D | null>(null)
  const isDrawing    = useRef(false)
  const isDirtyRef   = useRef(false) // tracks if pixels changed this stroke — avoids mid-stroke setState
  
  const { saveSnapshot, undo: doUndo, canUndo, clearHistory } = useCanvasHistory()
  
  const [isEmpty,    setIsEmpty]    = useState(true)
  const [activeTool, setActiveTool] = useState<DrawingTool>('BRUSH')
  const [activeStamp, setActiveStamp] = useState<{ type: 'EYE' | 'MOUTH', style: string } | null>(null)
  const [decals,     setDecals]     = useState<Decal[]>([])

  // ─── Mount: setup transparent canvas ─────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    // CRITICAL: Force DPR to 1 to prevent 36MB RAM explosion on mobile Retina screens
    const ctx = setupCanvas(canvas, CANVAS_SIZE, CANVAS_SIZE, 1)
    ctxRef.current = ctx
    // setupCanvas injects inline pixel values (style.width="1024px", style.height="1024px")
    // that fight against our CSS layout. We must clear them so CSS width/height: 100% takes
    // back control of the canvas's visual size.  The *buffer* size (canvas.width=1024) is
    // kept as-is — only the CSS presentation layer is cleared here.
    canvas.style.width  = ''
    canvas.style.height = ''
    applyBrushSettings(ctx, brushSize, brushColor)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Update brush settings when props change ──────────────────────────────
  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    applyBrushSettings(ctx, brushSize, brushColor)
  }, [brushSize, brushColor])

  // ─── Pointer: DOWN ────────────────────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const ctx    = ctxRef.current
    if (!canvas || !ctx) return

    canvas.setPointerCapture(e.pointerId)

    // Force customDpr=1 to match setupCanvas
    const pt = getCanvasPoint(canvas, e.nativeEvent, 1)

    if (activeTool === 'STAMP' && activeStamp) {
      saveSnapshot(canvas, decals)
      // Stamps need to be much larger than a standard brush stroke to be visible on a 1024x1024 canvas.
      const size = Math.max(120, brushSize * 6)
      const newDecal: Decal = {
        type: activeStamp.type,
        style: activeStamp.style,
        x: pt.x,
        y: pt.y,
        scale: size,
        rotation: 0
      }
      setDecals(prev => {
        const next = [...prev, newDecal]
        return next
      })
      setIsEmpty(false)
      return
    }

    saveSnapshot(canvas, decals)

    if (activeTool === 'FILL') {
      // ── Fill bucket: flood fill at tap point ──
      const physX     = Math.round(pt.x)
      const physY     = Math.round(pt.y)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const [fr, fg, fb] = hexToRgb(brushColor)
      floodFill(imageData.data, physX, physY, fr, fg, fb, canvas.width, canvas.height)
      ctx.putImageData(imageData, 0, 0)
      setIsEmpty(false)
      return
    }

    // ── Brush or Eraser: start stroke ──
    isDrawing.current = true

    const pressure = e.pointerType === 'pen' ? e.pressure : 1
    const normalizedPressure = pressure === 0 ? 0.5 : Math.max(0.1, pressure)
    const currentSize = activeTool === 'ERASER' ? brushSize * 2 : brushSize * (0.2 + normalizedPressure * 1.5)

    if (activeTool === 'ERASER') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
      ctx.fillStyle   = 'rgba(0,0,0,1)'
      ctx.lineWidth   = currentSize
    } else {
      ctx.globalCompositeOperation = 'source-over'
      applyBrushSettings(ctx, brushSize, brushColor)
      ctx.lineWidth = currentSize
    }

    ctx.beginPath()
    ctx.arc(pt.x, pt.y, ctx.lineWidth / 2, 0, Math.PI * 2)
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(pt.x, pt.y)

    if (activeTool !== 'ERASER') {
      isDirtyRef.current = true // mark dirty — state update deferred to pointerUp
    }
  }, [activeTool, activeStamp, brushSize, brushColor, decals, saveSnapshot])

  // ─── Pointer: MOVE ────────────────────────────────────────────────────────
  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return
    const canvas = canvasRef.current
    const ctx    = ctxRef.current
    if (!canvas || !ctx) return

    const pt = getCanvasPoint(canvas, e.nativeEvent, 1)
    const pressure = e.pointerType === 'pen' ? e.pressure : 1
    const normalizedPressure = pressure === 0 ? 0.5 : Math.max(0.1, pressure)
    ctx.lineWidth = activeTool === 'ERASER' ? brushSize * 2 : brushSize * (0.2 + normalizedPressure * 1.5)

    ctx.lineTo(pt.x, pt.y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(pt.x, pt.y)

    if (activeTool !== 'ERASER') {
      isDirtyRef.current = true // mark dirty — state update deferred to pointerUp
    }
  }, [activeTool, brushSize])

  // ─── Pointer: UP ─────────────────────────────────────────────────────────
  const onPointerUp = useCallback(() => {
    const ctx = ctxRef.current
    if (ctx) ctx.globalCompositeOperation = 'source-over'
    isDrawing.current = false

    // Flush the dirty flag — single setState here instead of on every move event
    if (isDirtyRef.current) {
      setIsEmpty(false)
      isDirtyRef.current = false
    }

    if (activeTool === 'ERASER') {
      const canvas = canvasRef.current
      if (canvas && ctx) {
        const empty = checkIsEmpty(ctx, canvas)
        setIsEmpty(empty)
      }
    }
  }, [activeTool])

  // ─── Controls ─────────────────────────────────────────────────────────────
  const clear = useCallback(() => {
    const canvas = canvasRef.current
    const ctx    = ctxRef.current
    if (!canvas || !ctx) return
    ctx.globalCompositeOperation = 'source-over'
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    applyBrushSettings(ctx, brushSize, brushColor)
    setIsEmpty(true)
    clearHistory()
    setDecals([])
  }, [brushSize, brushColor, clearHistory])

  const undo = useCallback(() => {
    const canvas = canvasRef.current
    const ctx    = ctxRef.current
    if (!canvas || !ctx) return
    
    const snapshot = doUndo(canvas, ctx, setDecals)
    if (snapshot) {
      const empty = checkIsEmpty(ctx, canvas)
      // If there are decals, it's technically not empty
      setIsEmpty(empty && snapshot.decals.length === 0)
    }
  }, [doUndo])

  // ─── Zero-Cost Auto-Crop Export ──────────────────────────────────────────────
  const exportBase64 = useCallback((): { image: string; adjustedDecals: Decal[] } => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return { image: '', adjustedDecals: [] }

    // Calculate exact pixel bounding box
    const bounds = getPixelBounds(ctx, canvas.width, canvas.height, decals)
    
    // If perfectly empty or bounds are invalid, return empty
    const { minX, minY, maxX, maxY } = bounds
    if (minX >= maxX || minY >= maxY) return { image: canvas.toDataURL('image/png'), adjustedDecals: decals }

    // Add slight padding to the bounds
    const padding = 10
    const cropX = Math.max(0, Math.floor(minX - padding))
    const cropY = Math.max(0, Math.floor(minY - padding))
    const cropW = Math.min(CANVAS_SIZE - cropX, Math.ceil(maxX - minX + padding * 2))
    const cropH = Math.min(CANVAS_SIZE - cropY, Math.ceil(maxY - minY + padding * 2))

    const maxDim = Math.max(cropW, cropH)

    // Create an offscreen canvas specifically sized to a perfect square
    const offscreen = document.createElement('canvas')
    offscreen.width = maxDim
    offscreen.height = maxDim
    const octx = offscreen.getContext('2d')
    if (!octx) return { image: '', adjustedDecals: [] }

    // BOTTOM-CENTER ALIGNMENT: 
    // X is centered. Y is pushed to the bottom so wobble/squash pivots correctly at the feet.
    const offsetX = Math.floor((maxDim - cropW) / 2)
    const offsetY = maxDim - cropH

    // Draw only the cropped portion from the main canvas
    octx.drawImage(canvas, cropX, cropY, cropW, cropH, offsetX, offsetY, cropW, cropH)
    
    // Shift decals by the crop offset
    const adjustedDecals = decals.map(d => ({
      ...d,
      x: d.x - cropX + offsetX,
      y: d.y - cropY + offsetY
    }))

    const result = { image: offscreen.toDataURL('image/png'), adjustedDecals }
    
    // Explicitly zero the buffer to release GPU memory on iOS/Safari
    offscreen.width = 0
    offscreen.height = 0
    
    return result
  }, [decals])

  return {
    canvasRef,
    isEmpty,
    activeTool,
    setActiveTool,
    activeStamp,
    setActiveStamp,
    exportBase64,
    clear,
    undo,
    canUndo,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    decals,
  }
}


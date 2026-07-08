import { useCallback, useEffect, useRef, useState } from 'react'
import { setupCanvas, getCanvasPoint } from '../renderer/canvasUtils'
import type { Decal } from '../types'

const CANVAS_SIZE = 1024
const MAX_UNDO_STEPS = 10

type DrawingTool = 'BRUSH' | 'FILL' | 'ERASER' | 'STAMP'

interface UndoSnapshot {
  snapshotCanvas: HTMLCanvasElement
  decals: Decal[]
}

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
  const undoStack    = useRef<UndoSnapshot[]>([])
  
  const [isEmpty,    setIsEmpty]    = useState(true)
  const [canUndo,    setCanUndo]    = useState(false)
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
    applyBrushSettings(ctx, brushSize, brushColor)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Update brush settings when props change ──────────────────────────────
  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    applyBrushSettings(ctx, brushSize, brushColor)
  }, [brushSize, brushColor])

  // Save undo snapshot helper
  const saveSnapshot = useCallback((currentDecals: Decal[]) => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return
    const snapshotCanvas = document.createElement('canvas')
    snapshotCanvas.width = canvas.width
    snapshotCanvas.height = canvas.height
    snapshotCanvas.getContext('2d')!.drawImage(canvas, 0, 0)
    undoStack.current.push({ snapshotCanvas, decals: [...currentDecals] })
    if (undoStack.current.length > MAX_UNDO_STEPS) {
      const removed = undoStack.current.shift()
      if (removed && removed.snapshotCanvas) {
        removed.snapshotCanvas.width = 0
        removed.snapshotCanvas.height = 0
      }
    }
    setCanUndo(true)
  }, [])

  // ─── Pointer: DOWN ────────────────────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const ctx    = ctxRef.current
    if (!canvas || !ctx) return

    canvas.setPointerCapture(e.pointerId)

    // Force customDpr=1 to match setupCanvas
    const pt = getCanvasPoint(canvas, e.nativeEvent, 1)

    if (activeTool === 'STAMP' && activeStamp) {
      saveSnapshot(decals)
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

    saveSnapshot(decals)

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
      setIsEmpty(false)
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
      setIsEmpty(false)
    }
  }, [activeTool, brushSize])

  // ─── Pointer: UP ─────────────────────────────────────────────────────────
  const onPointerUp = useCallback(() => {
    const ctx = ctxRef.current
    if (ctx) ctx.globalCompositeOperation = 'source-over'
    isDrawing.current = false
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
    setCanUndo(false)
    undoStack.current = []
    setDecals([])
  }, [brushSize, brushColor])

  const undo = useCallback(() => {
    const canvas = canvasRef.current
    const ctx    = ctxRef.current
    if (!canvas || !ctx || undoStack.current.length === 0) return
    
    const snapshot = undoStack.current.pop()!
    ctx.globalCompositeOperation = 'source-over'
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(snapshot.snapshotCanvas, 0, 0)
    setDecals(snapshot.decals)
    
    setCanUndo(undoStack.current.length > 0)
    const empty = checkIsEmpty(ctx, canvas)
    // If there are decals, it's technically not empty
    setIsEmpty(empty && snapshot.decals.length === 0)
  }, [])

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function applyBrushSettings(ctx: CanvasRenderingContext2D, size: number, color: string) {
  ctx.globalCompositeOperation = 'source-over'
  ctx.strokeStyle = color
  ctx.fillStyle   = color
  ctx.lineWidth   = size
  ctx.lineCap     = 'round'
  ctx.lineJoin    = 'round'
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

/**
 * Iterative flood fill — BFS on physical pixel buffer.
 * Uses Uint8Array for visited tracking (fast, zero GC).
 * tolerance=30 handles anti-aliased stroke edges so fills don't leak.
 */
function floodFill(
  data: Uint8ClampedArray,
  startX: number,
  startY: number,
  fr: number, fg: number, fb: number,
  width: number,
  height: number,
  tolerance = 30,
): void {
  if (startX < 0 || startX >= width || startY < 0 || startY >= height) return

  const startIdx = (startY * width + startX) * 4
  const tr = data[startIdx]
  const tg = data[startIdx + 1]
  const tb = data[startIdx + 2]
  const ta = data[startIdx + 3]

  // Don't fill if target is already the fill color
  if (tr === fr && tg === fg && tb === fb && ta === 255) return

  const visited = new Uint8Array(width * height)
  const stack: number[] = [startY * width + startX]

  while (stack.length > 0) {
    const pos = stack.pop()!
    if (visited[pos]) continue

    const x = pos % width
    const y = (pos / width) | 0
    const idx = pos * 4

    // Check if this pixel matches the target color within tolerance
    if (
      Math.abs(data[idx]     - tr) > tolerance ||
      Math.abs(data[idx + 1] - tg) > tolerance ||
      Math.abs(data[idx + 2] - tb) > tolerance ||
      Math.abs(data[idx + 3] - ta) > tolerance
    ) continue

    visited[pos] = 1
    data[idx]     = fr
    data[idx + 1] = fg
    data[idx + 2] = fb
    data[idx + 3] = 255  // fully opaque

    if (x > 0)           stack.push(pos - 1)
    if (x < width - 1)   stack.push(pos + 1)
    if (y > 0)           stack.push(pos - width)
    if (y < height - 1)  stack.push(pos + width)
  }

  // --- Dilation Pass (Anti-Aliasing Fix) ---
  // Expand the fill area by 2 pixels to bleed UNDER the semi-transparent stroke edges.
  // This matches professional software "Expand Fill" features.
  const edges1 = new Uint8Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const pos = y * width + x;
      if (visited[pos] === 1) {
        if (visited[pos - 1] === 0) edges1[pos - 1] = 1;
        if (visited[pos + 1] === 0) edges1[pos + 1] = 1;
        if (visited[pos - width] === 0) edges1[pos - width] = 1;
        if (visited[pos + width] === 0) edges1[pos + width] = 1;
        if (visited[pos - 1 - width] === 0) edges1[pos - 1 - width] = 1;
        if (visited[pos + 1 - width] === 0) edges1[pos + 1 - width] = 1;
        if (visited[pos - 1 + width] === 0) edges1[pos - 1 + width] = 1;
        if (visited[pos + 1 + width] === 0) edges1[pos + 1 + width] = 1;
      }
    }
  }
  
  const edges2 = new Uint8Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const pos = y * width + x;
      if (edges1[pos] === 1) {
        if (visited[pos - 1] === 0 && edges1[pos - 1] === 0) edges2[pos - 1] = 1;
        if (visited[pos + 1] === 0 && edges1[pos + 1] === 0) edges2[pos + 1] = 1;
        if (visited[pos - width] === 0 && edges1[pos - width] === 0) edges2[pos - width] = 1;
        if (visited[pos + width] === 0 && edges1[pos + width] === 0) edges2[pos + width] = 1;
      }
    }
  }

  // Composite the fill color UNDER the anti-aliased edge pixels
  for (let pos = 0; pos < width * height; pos++) {
    if (edges1[pos] === 1 || edges2[pos] === 1) {
       const idx = pos * 4;
       const tr = data[idx];
       const tg = data[idx+1];
       const tb = data[idx+2];
       const ta = data[idx+3];
       
       const alpha = ta / 255;
       data[idx]   = tr * alpha + fr * (1 - alpha);
       data[idx+1] = tg * alpha + fg * (1 - alpha);
       data[idx+2] = tb * alpha + fb * (1 - alpha);
       data[idx+3] = 255;
    }
  }
}

function checkIsEmpty(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
): boolean {
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  for (let i = 3; i < data.length; i += 4 * 17) {
    if (data[i] > 0) return false;
  }
  return true;
}

function getPixelBounds(ctx: CanvasRenderingContext2D, width: number, height: number, decals: Decal[]) {
  const data = ctx.getImageData(0, 0, width, height).data;
  let minX = width, minY = height, maxX = 0, maxY = 0;
  
  // Scan drawn pixels
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Factor in decals
  for (const d of decals) {
    const half = d.scale / 2;
    if (d.x - half < minX) minX = d.x - half;
    if (d.x + half > maxX) maxX = d.x + half;
    if (d.y - half < minY) minY = d.y - half;
    if (d.y + half > maxY) maxY = d.y + half;
  }
  
  return { minX, minY, maxX, maxY };
}

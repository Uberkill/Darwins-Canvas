import { useCallback, useEffect, useRef, useState } from 'react'
import { setupCanvas, getCanvasPoint } from '../renderer/canvasUtils'

const CANVAS_SIZE = 1024

type DrawingTool = 'BRUSH' | 'FILL' | 'ERASER'

export interface DrawingCanvasHandle {
  canvasRef:     React.RefObject<HTMLCanvasElement | null>
  isEmpty:       boolean
  activeTool:    DrawingTool
  setActiveTool: (tool: DrawingTool) => void
  exportBase64:  () => string
  clear:         () => void
  undo:          () => void
  canUndo:       boolean
  onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void
  onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void
  onPointerUp:   () => void
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
  const lastSnapshot = useRef<ImageData | null>(null)
  
  // Dynamic Bounding Box Tracking (Zero-cost crop)
  const bounds       = useRef({ minX: CANVAS_SIZE, minY: CANVAS_SIZE, maxX: 0, maxY: 0 })

  const [isEmpty,    setIsEmpty]    = useState(true)
  const [canUndo,    setCanUndo]    = useState(false)
  const [activeTool, setActiveTool] = useState<DrawingTool>('BRUSH')

  // Helper to expand bounds
  const expandBounds = useCallback((x: number, y: number, radius: number) => {
    bounds.current.minX = Math.max(0, Math.min(bounds.current.minX, x - radius))
    bounds.current.minY = Math.max(0, Math.min(bounds.current.minY, y - radius))
    bounds.current.maxX = Math.min(CANVAS_SIZE, Math.max(bounds.current.maxX, x + radius))
    bounds.current.maxY = Math.min(CANVAS_SIZE, Math.max(bounds.current.maxY, y + radius))
  }, [])

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

  // ─── Pointer: DOWN ────────────────────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const ctx    = ctxRef.current
    if (!canvas || !ctx) return

    canvas.setPointerCapture(e.pointerId)

    // Save undo snapshot before any action
    lastSnapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setCanUndo(true)

    // Force customDpr=1 to match setupCanvas
    const pt = getCanvasPoint(canvas, e.nativeEvent, 1)

    if (activeTool === 'FILL') {
      // ── Fill bucket: flood fill at tap point ──
      const physX     = Math.round(pt.x)
      const physY     = Math.round(pt.y)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const [fr, fg, fb] = hexToRgb(brushColor)
      floodFill(imageData.data, physX, physY, fr, fg, fb, canvas.width, canvas.height)
      ctx.putImageData(imageData, 0, 0)
      setIsEmpty(false)
      // Fill technically spans the whole filled region, we just max out the bounds for safety
      bounds.current = { minX: 0, minY: 0, maxX: CANVAS_SIZE, maxY: CANVAS_SIZE }
      return
    }

    // ── Brush or Eraser: start stroke ──
    isDrawing.current = true

    if (activeTool === 'ERASER') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
      ctx.fillStyle   = 'rgba(0,0,0,1)'
    } else {
      ctx.globalCompositeOperation = 'source-over'
      applyBrushSettings(ctx, brushSize, brushColor)
      expandBounds(pt.x, pt.y, brushSize / 2)
    }

    ctx.beginPath()
    ctx.arc(pt.x, pt.y, ctx.lineWidth / 2, 0, Math.PI * 2)
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(pt.x, pt.y)

    if (activeTool !== 'ERASER') {
      setIsEmpty(false)
    }
  }, [activeTool, brushSize, brushColor, expandBounds])

  // ─── Pointer: MOVE ────────────────────────────────────────────────────────
  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return
    const canvas = canvasRef.current
    const ctx    = ctxRef.current
    if (!canvas || !ctx) return

    const pt = getCanvasPoint(canvas, e.nativeEvent, 1)
    
    if (activeTool !== 'ERASER') {
      expandBounds(pt.x, pt.y, brushSize / 2)
    }

    ctx.lineTo(pt.x, pt.y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(pt.x, pt.y)

    if (activeTool !== 'ERASER') {
      setIsEmpty(false)
    }
  }, [activeTool, brushSize, expandBounds])

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
        if (empty) bounds.current = { minX: CANVAS_SIZE, minY: CANVAS_SIZE, maxX: 0, maxY: 0 }
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
    lastSnapshot.current = null
    bounds.current = { minX: CANVAS_SIZE, minY: CANVAS_SIZE, maxX: 0, maxY: 0 }
  }, [brushSize, brushColor])

  const undo = useCallback(() => {
    const canvas = canvasRef.current
    const ctx    = ctxRef.current
    if (!canvas || !ctx || !lastSnapshot.current) return
    ctx.globalCompositeOperation = 'source-over'
    ctx.putImageData(lastSnapshot.current, 0, 0)
    lastSnapshot.current = null
    setCanUndo(false)
    const empty = checkIsEmpty(ctx, canvas)
    setIsEmpty(empty)
    if (empty) {
      bounds.current = { minX: CANVAS_SIZE, minY: CANVAS_SIZE, maxX: 0, maxY: 0 }
    } else {
      bounds.current = { minX: 0, minY: 0, maxX: CANVAS_SIZE, maxY: CANVAS_SIZE }
    }
  }, [])

  // ─── Zero-Cost Auto-Crop Export ───────────────────────────────────────────
  const exportBase64 = useCallback((): string => {
    const canvas = canvasRef.current
    if (!canvas) return ''

    // If perfectly empty or bounds are invalid, return empty
    const { minX, minY, maxX, maxY } = bounds.current
    if (minX >= maxX || minY >= maxY) return canvas.toDataURL('image/png')

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
    if (!octx) return ''

    // BOTTOM-CENTER ALIGNMENT: 
    // X is centered. Y is pushed to the bottom so wobble/squash pivots correctly at the feet.
    const offsetX = Math.floor((maxDim - cropW) / 2)
    const offsetY = maxDim - cropH

    // Draw only the cropped portion from the main canvas
    octx.drawImage(canvas, cropX, cropY, cropW, cropH, offsetX, offsetY, cropW, cropH)
    return offscreen.toDataURL('image/png')
  }, [])

  return {
    canvasRef,
    isEmpty,
    activeTool,
    setActiveTool,
    exportBase64,
    clear,
    undo,
    canUndo,
    onPointerDown,
    onPointerMove,
    onPointerUp,
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

import { CAMERA_TILT } from '../constants';
/**
 * canvasUtils.ts
 *
 * Two critical helpers needed on every canvas in the project:
 *
 * 1. setupCanvas — scales the canvas buffer for HiDPI/Retina displays.
 *    Without this, both the ecosystem and drawing canvas look blurry on
 *    MacBooks, iPhones, and any device with devicePixelRatio > 1.
 *
 * 2. getCanvasPoint — converts pointer event coordinates (CSS pixels) to
 *    canvas coordinates, correcting for devicePixelRatio and any CSS scaling.
 *    Without this, brush strokes draw at the wrong position on mobile.
 */

/**
 * Set up a canvas element for HiDPI / Retina rendering.
 * Call this on mount and again whenever the canvas is resized.
 *
 * @param canvas  The HTMLCanvasElement to configure
 * @param width   Desired CSS width in px
 * @param height  Desired CSS height in px
 * @returns       A pre-scaled 2D rendering context
 */
export function setupCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  customDpr?: number
): CanvasRenderingContext2D {
  const dpr = customDpr || window.devicePixelRatio || 1;

  // Set the actual pixel buffer to physical pixels
  canvas.width  = Math.round(width  * dpr);
  canvas.height = Math.round(height * dpr);

  // CSS size stays at logical pixels so layout is unaffected
  canvas.style.width  = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // Scale all draw operations so 1 unit = 1 CSS pixel
  ctx.scale(dpr, dpr);

  return ctx;
}

/**
 * Convert a pointer event position to canvas-local coordinates.
 * Accounts for devicePixelRatio AND any CSS transform / scale on the canvas.
 *
 * @param canvas  The target canvas element
 * @param e       The pointer event
 * @param customDpr Optional manual DPR
 * @returns       { x, y } in canvas coordinate space
 */
export function getCanvasPoint(
  canvas: HTMLCanvasElement,
  e: PointerEvent | MouseEvent | Touch,
  customDpr?: number
): { x: number; y: number } {
  const rect   = canvas.getBoundingClientRect();
  const dpr    = customDpr || window.devicePixelRatio || 1;

  // How much the canvas CSS size differs from its natural buffer size
  const scaleX = (canvas.width  / dpr) / rect.width;
  const scaleY = (canvas.height / dpr) / rect.height;

  // DRIFT GUARD (dev only): if the canvas is ever non-square, scaleX ≠ scaleY
  // and every pointer coordinate will be wrong. This fires immediately so you
  // never spend hours debugging mysterious brush drift.
  // Root cause is almost always: .canvas-inner-wrapper lost `container-type: size`,
  // or the `100cqmin` width/height constraint was removed from its child div.
  if (import.meta.env.DEV && Math.abs(scaleX - scaleY) > 0.01) {
    console.warn(
      `[getCanvasPoint] ⚠️ POINTER DRIFT DETECTED: canvas is not square.\n` +
      `  scaleX=${scaleX.toFixed(3)}, scaleY=${scaleY.toFixed(3)}\n` +
      `  rect: ${rect.width.toFixed(1)}×${rect.height.toFixed(1)}px\n` +
      `  Fix: ensure .canvas-inner-wrapper has container-type:size in CSS\n` +
      `  and its child div keeps { width:'100cqmin', height:'100cqmin' }.`
    );
  }

  const clientX = 'clientX' in e ? e.clientX : (e as Touch).clientX;
  const clientY = 'clientY' in e ? e.clientY : (e as Touch).clientY;

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top)  * scaleY,
  };
}

/**
 * Converts a raw canvas-local coordinate into a world coordinate,
 * applying the inverse camera matrix.
 */
export function getWorldPoint(
  canvasX: number,
  canvasY: number,
  canvasWidth: number, // physical buffer width
  canvasHeight: number, // physical buffer height
  camera: { x: number; y: number; zoom: number },
  dpr: number = window.devicePixelRatio || 1
): { x: number; y: number } {
  // 1. Center offset based on logical size
  const logicalW = canvasWidth / dpr;
  const logicalH = canvasHeight / dpr;
  
  // 2. Inverse matrix calculation
  return {
    x: (canvasX - logicalW / 2) / camera.zoom + camera.x,
    // camera.y is in visual space. The visual y of a world entity is (entity.y * CAMERA_TILT).
    // To get world y from screen y: first get visual y, then divide by CAMERA_TILT.
    y: (((canvasY - logicalH / 2) / camera.zoom) + camera.y) / CAMERA_TILT,
  };
}

import type { WorldState, Creature, Plant } from '../types'
import { drawPlant } from './drawPlant'
import { drawCreature, drawCreatureShadow, drawTrackingMarker } from './drawCreature'
import { BASE_RENDER_SIZE, CAMERA_TILT } from '../constants'
import { useEngineStore } from '../store/useEngineStore';
import { useTrackingStore } from '../features/tracking/useTrackingStore';
import { drawEnvironment } from './drawEnvironment'
import { drawEffects } from './drawEffects'

/**
 * GameRenderer strictly paints pixels. It does not mutate world state.
 * It uses a pre-allocated renderBuffer to prevent Garbage Collection (GC)
 * micro-stutters during the 60fps loop.
 */
export class GameRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private dpr: number

  // Zero-GC buffer: Avoids allocating a new array via .filter() or .concat() every frame
  private renderBuffer: (Creature | Plant)[]
  private entityCount: number = 0

  // Ghost image cache to prevent allocating 60 Image objects per second
  private pendingGhostImg: HTMLImageElement | null = null;
  private pendingGhostDataSrc: string | null = null;

  constructor(canvas: HTMLCanvasElement, dpr: number = window.devicePixelRatio || 1) {
    this.canvas = canvas
    this.dpr = dpr
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get 2D context')
    this.ctx = ctx

    // Pre-allocate buffer for up to 2000 entities
    this.renderBuffer = new Array(2000)
    for (let i = 0; i < 2000; i++) this.renderBuffer[i] = null as any

    // Initial resize to setup context
    this.resize(window.innerWidth, window.innerHeight)
  }

  /**
   * Resizes the physical canvas while maintaining logical CSS bounds.
   */
  public resize(logicalWidth: number, logicalHeight: number) {
    this.canvas.style.width = `${logicalWidth}px`
    this.canvas.style.height = `${logicalHeight}px`
    this.canvas.width = logicalWidth * this.dpr
    this.canvas.height = logicalHeight * this.dpr
  }

  /**
   * Paints the world state. 
   * The signature enforces Readonly so we don't accidentally mutate physics.
   */
  public draw(world: Readonly<WorldState>) {
    const { worldWidth, worldHeight, camera } = world

    // 1. Clear physical canvas background
    this.ctx.save();
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); // reset to physical
    this.ctx.fillStyle = '#1e1e1e'; // void color
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();

    this.ctx.save();
    
    // Apply camera matrix
    const logicalW = this.canvas.width / this.dpr;
    const logicalH = this.canvas.height / this.dpr;
    this.ctx.scale(this.dpr, this.dpr); // Scale for high-DPI screens first
    this.ctx.translate(logicalW / 2, logicalH / 2);
    this.ctx.scale(camera.zoom, camera.zoom);
    this.ctx.translate(-camera.x, -camera.y);

    // 2. Draw the tilted 2.5D ground plane inside a squished context
    this.ctx.save();
    this.ctx.scale(1, CAMERA_TILT);
    this.ctx.clearRect(0, 0, worldWidth, worldHeight);

    // ── 2a. Floor Base Gradient ───────────────────────────────────────────────
    // Far end (top) = cooler, slightly darker. Near end (bottom) = warm, bright.
    const floorGrad = this.ctx.createLinearGradient(0, 0, 0, worldHeight);
    floorGrad.addColorStop(0.0, '#ccc4aa'); // far horizon — more muted
    floorGrad.addColorStop(0.4, '#d8d0ba');
    floorGrad.addColorStop(1.0, '#ece6d8'); // near — warm, bright
    this.ctx.fillStyle = floorGrad;
    this.ctx.fillRect(0, 0, worldWidth, worldHeight);

    // ── 2b. Sky / Horizon Strip at the very top ───────────────────────────────
    // DST always has a pale sky visible above the top of the ground plane.
    // We draw it in the top 12% of the world, fading into the floor color.
    const skyH = worldHeight * 0.12;
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, skyH);
    skyGrad.addColorStop(0.0, 'rgba(180, 205, 220, 0.85)'); // sky blue
    skyGrad.addColorStop(0.6, 'rgba(200, 215, 210, 0.35)');
    skyGrad.addColorStop(1.0, 'rgba(204, 196, 176, 0.00)'); // fades to floor
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, worldWidth, skyH);

    // ── 2c. Converging Grid Lines (Perspective) ───────────────────────────────
    // Vertical lines fan out from a vanishing point at top-center.
    // Horizontal lines are drawn normally (squished by CAMERA_TILT).
    // Together they create the illusion of a receding ground plane.
    const vp = camera.x; // vanishing point X moves with the camera for perfect 3D parallax!
    this.ctx.strokeStyle = 'rgba(0,0,0,0.10)';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();

    // Vertical converging lines: at y=0 they converge to vp, at y=worldHeight they are evenly spaced
    // Scale the number of lines by worldWidth so they don't get sparse on big maps
    const colCount = Math.max(14, Math.floor(worldWidth / 140));
    
    // The grid must converge at the exact same rate the creatures shrink!
    // Creature near scale = 1.10, far scale = 0.65. Ratio = 0.65/1.10 = 0.59.
    // If the grid uses 0.08, the floor looks infinitely deep while creatures look flat, causing parallax nausea.
    const convergenceRatio = 0.59; 

    for (let col = 0; col <= colCount; col++) {
      const tNear = col / colCount;                       // 0→1 across the bottom
      const xNear = tNear * worldWidth;                   // evenly spread at the bottom
      const xFar  = vp + (xNear - vp) * convergenceRatio; // converge tightly at camera's horizon
      this.ctx.moveTo(xFar,  0);
      this.ctx.lineTo(xNear, worldHeight);
    }

    // Horizontal lines — uneven spacing: denser at top to fake depth foreshortening
    // Scale by worldHeight to keep density consistent on large maps
    const rowCount = Math.max(16, Math.floor(worldHeight / 60));
    for (let row = 0; row <= rowCount; row++) {
      // Gentle exponential spacing to match the 0.59 depth compression
      const t = Math.pow(row / rowCount, 1.2); 
      const y = t * worldHeight;
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(worldWidth, y);
    }
    this.ctx.stroke();

    // ── 2d. Atmospheric Depth Fog ─────────────────────────────────────────────
    // Overlays a warm-haze gradient that washes out the far end of the map.
    // This is the single most powerful depth cue: far = washed out, near = clear.
    const fogGrad = this.ctx.createLinearGradient(0, 0, 0, worldHeight);
    fogGrad.addColorStop(0.0, 'rgba(195, 188, 165, 0.52)'); // heavy haze at horizon
    fogGrad.addColorStop(0.3, 'rgba(205, 198, 178, 0.25)');
    fogGrad.addColorStop(0.7, 'rgba(220, 215, 195, 0.06)');
    fogGrad.addColorStop(1.0, 'rgba(235, 228, 210, 0.00)'); // clear foreground
    this.ctx.fillStyle = fogGrad;
    this.ctx.fillRect(0, 0, worldWidth, worldHeight);

    this.ctx.restore();


    // 3. Zero-GC buffer copy
    this.entityCount = 0
    
    // Copy plants
    for (let i = 0; i < world.plants.length; i++) {
      if (this.entityCount < this.renderBuffer.length) {
        this.renderBuffer[this.entityCount++] = world.plants[i]
      }
    }
    
    // Copy creatures
    for (let i = 0; i < world.creatures.length; i++) {
      if (this.entityCount < this.renderBuffer.length) {
        this.renderBuffer[this.entityCount++] = world.creatures[i]
      }
    }

    // Null trailing indices to release dead references
    for (let i = this.entityCount; i < this.renderBuffer.length; i++) {
      if (this.renderBuffer[i] === null) break // already clean
      this.renderBuffer[i] = null as any
    }

    // 4. Zero-GC Insertion Sort by Y coordinate (O(N) for nearly sorted data)
    for (let i = 1; i < this.entityCount; i++) {
      const current = this.renderBuffer[i]
      let j = i - 1
      while (j >= 0 && this.renderBuffer[j].y > current.y) {
        this.renderBuffer[j + 1] = this.renderBuffer[j]
        j--
      }
      this.renderBuffer[j + 1] = current
    }

    // 4.5 Draw Lure (if active)
    if (world.activeLure) {
      const { x, y, timer } = world.activeLure
      
      this.ctx.save()
      this.ctx.translate(x, y * CAMERA_TILT)
      
      this.ctx.beginPath()
      // Pulsating ring effect
      const pulse = 1 + Math.sin(world.totalTime * 10) * 0.2
      // Because we translate, we draw at 0,0. To make the ring tilted, we scale just this context
      this.ctx.scale(1, CAMERA_TILT)
      this.ctx.arc(0, 0, 30 * pulse, 0, Math.PI * 2)
      this.ctx.strokeStyle = `rgba(236, 72, 153, ${Math.min(1, timer / 2)})` // Pink glowing fade out
      this.ctx.lineWidth = 4 / CAMERA_TILT // compensate for line width squish
      this.ctx.stroke()
      
      this.ctx.beginPath()
      this.ctx.arc(0, 0, 10, 0, Math.PI * 2)
      this.ctx.fillStyle = `rgba(236, 72, 153, ${Math.min(1, timer / 2)})`
      this.ctx.fill()
      this.ctx.restore()
    }

    // 5. Draw Entities (Back to Front)
    for (let i = 0; i < this.entityCount; i++) {
      const entity = this.renderBuffer[i]
      if ('growthStage' in entity) {
        drawPlant(this.ctx, entity as Plant, worldHeight)
      } else {
        const creature = entity as Creature
        drawCreatureShadow(this.ctx, creature, worldHeight)
        drawCreature(this.ctx, creature, worldHeight)
        
        // Draw Health Bar if damaged or hovered
        if (creature.health < creature.maxHealth || creature.id === world.hoveredEntityId) {
          this.drawHealthBar(creature, worldHeight)
        }
      }
    }

    // 5.5. Draw Tracking Markers (Two-Pass Render for Z-Index)
    // Hoist the timestamp and Zustand state exactly once per frame
    const trackedIds = useTrackingStore.getState().trackedIds;
    if (trackedIds.size > 0) {
      const now = performance.now();
      for (let i = 0; i < this.entityCount; i++) {
        const entity = this.renderBuffer[i];
        if (!('growthStage' in entity)) {
          const creature = entity as Creature;
          if (trackedIds.has(creature.id)) {
            drawTrackingMarker(this.ctx, creature, now, worldHeight);
          }
        }
      }
    }

    // 6. Draw Tooltip (Removed in favor of React HoverOverlay)

    // 7. Draw Pending Creature Ghost
    const pending = useEngineStore.getState().pendingCreature;
    if (pending) {
      this.ctx.save();
      this.ctx.globalAlpha = 0.5;
      
      // FYI: we hold this single image in memory on purpose. It's a 1-item cache.
      // If we don't, the game micro-stutters every time you toggle the spawn preview. 
      // It's not a memory leak!
      if (this.pendingGhostDataSrc !== pending.drawingData) {
        this.pendingGhostImg = new Image();
        this.pendingGhostImg.src = pending.drawingData;
        this.pendingGhostDataSrc = pending.drawingData;
      }
      
      const img = this.pendingGhostImg;
      if (img && img.complete) {
        // Base scale matches spawn logic in buildCreature
        let scale = 1.0;
        if (pending.size === 'SMALL') scale = 0.6;
        if (pending.size === 'LARGE') scale = 1.5;

        // "Baby" scale factor on spawn is 0.5
        const currentScale = 0.5 * scale;
        const renderSize = 64 * currentScale;

        this.ctx.translate(world.mouseX, world.mouseY * CAMERA_TILT);
        this.ctx.drawImage(img, -renderSize / 2, -renderSize, renderSize, renderSize);
      }
      this.ctx.restore();
    }

    // 8. Draw Weather and Day/Night Overlays
    drawEnvironment(this.ctx, world);

    // 9. Draw Visual Effects (Lightning, Heal, Spawn)
    if (world.visualEffects) {
      drawEffects(this.ctx, world.visualEffects);
    }

    // Restore context scaling and camera matrix
    this.ctx.restore()
  }

  private drawHealthBar(creature: Creature, worldHeight: number = 900) {
    const barWidth = 40;
    const barHeight = 6;
    const size = BASE_RENDER_SIZE * creature.renderScale * (creature.currentScale || 1.0);
    // Match the depth scale used by drawCreature so bar appears over the right spot
    const depthScale = 0.65 + (1.10 - 0.65) * Math.max(0, Math.min(1, creature.y / worldHeight));
    const scaledSize = size * depthScale;
    const cx = creature.x - (barWidth * depthScale) / 2;
    const cy = (creature.y * CAMERA_TILT) - creature.z - scaledSize - 15 * depthScale;
    
    const healthPercent = Math.max(0, creature.health / creature.maxHealth);
    const scaledBarW = barWidth * depthScale;
    const scaledBarH = barHeight * depthScale;


    this.ctx.save();
    // Background (empty)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.ctx.beginPath();
    if (this.ctx.roundRect) this.ctx.roundRect(cx, cy, scaledBarW, scaledBarH, 3); 
    else this.ctx.rect(cx, cy, scaledBarW, scaledBarH);
    this.ctx.fill();

    this.ctx.fillStyle = creature.health > 40 ? '#4CAF50' : '#f44336';
    this.ctx.beginPath();
    if (this.ctx.roundRect) this.ctx.roundRect(cx, cy, scaledBarW * healthPercent, scaledBarH, 3);
    else this.ctx.rect(cx, cy, scaledBarW * healthPercent, scaledBarH);
    this.ctx.fill();
    this.ctx.restore();
  }



  public dispose() {
    this.ctx = null as any
    this.canvas = null as any
    this.renderBuffer = []
  }
}

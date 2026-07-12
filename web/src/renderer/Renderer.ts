import type { WorldState, Creature, Plant } from '../types'
import { drawPlant } from './drawPlant'
import { drawCreature, drawCreatureShadow, drawTrackingMarker } from './drawCreature'
import { BASE_RENDER_SIZE, CAMERA_TILT } from '../constants'
import { useEngineStore } from '../store/useEngineStore';
import { useTrackingStore } from '../features/tracking/useTrackingStore';
import { drawEnvironment } from './drawEnvironment'
import { drawEffects } from './drawEffects'
import { getNightAlpha } from './lighting'

const WIND_DIR = 0.3;

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

  // Global Illumination
  private lightingCanvas: HTMLCanvasElement;
  private lightCtx: CanvasRenderingContext2D;
  private lightGradientCache: Map<string, CanvasGradient> = new Map();

  // Atmosphere
  private dustCanvas: HTMLCanvasElement;
  private dustCtx: CanvasRenderingContext2D;
  private dustParticles: { sx: number, sy: number, speed: number, size: number, depth: number, alpha: number, phaseX: number, phaseY: number }[] = [];
  private lastTotalTime: number = 0;

  // Terrain Baking
  private terrainCanvas: HTMLCanvasElement;
  private terrainCtx: CanvasRenderingContext2D;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private thresholdCanvas: HTMLCanvasElement;
  private thresholdCtx: CanvasRenderingContext2D;
  private isTerrainBaked: boolean = false;

  private fogGradCache: CanvasGradient | null = null;
  private vignetteGradCache: CanvasGradient | null = null;
  private noisePatternCache: CanvasPattern | null = null;

  constructor(canvas: HTMLCanvasElement, dpr: number = window.devicePixelRatio || 1) {
    this.canvas = canvas
    this.dpr = dpr
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get 2D context')
    this.ctx = ctx

    // Pre-allocate buffer for up to 10000 entities
    this.renderBuffer = new Array(10000)
    for (let i = 0; i < 10000; i++) this.renderBuffer[i] = null as any

    this.lightingCanvas = document.createElement('canvas');
    this.lightCtx = this.lightingCanvas.getContext('2d') as CanvasRenderingContext2D;

    for (let i = 0; i < 150; i++) {
      this.dustParticles.push({
        sx: Math.random() * 2000,
        sy: Math.random() * 2000,
        speed: 20 + Math.random() * 30,
        size: 1 + Math.random() * 3,
        depth: Math.random(),
        alpha: 0.12 + Math.random() * 0.13,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2
      });
    }

    // Initialize offscreen canvas for dust particles (DPR aware)
    this.dustCanvas = document.createElement('canvas');
    this.dustCanvas.width = 32 * this.dpr;
    this.dustCanvas.height = 32 * this.dpr;
    this.dustCtx = this.dustCanvas.getContext('2d') as CanvasRenderingContext2D;
    this.dustCtx.scale(this.dpr, this.dpr);

    // Initialize offscreen canvas for terrain
    this.terrainCanvas = document.createElement('canvas');
    this.terrainCtx = this.terrainCanvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { alpha: true }) as CanvasRenderingContext2D;
    this.thresholdCanvas = document.createElement('canvas');
    this.thresholdCtx = this.thresholdCanvas.getContext('2d', { alpha: true }) as CanvasRenderingContext2D;

    this._injectSVGFilter();

    // Initial resize to setup context
    this.resize(window.innerWidth, window.innerHeight)
  }

  private _injectSVGFilter() {
    if (document.getElementById('terrain-svg-filters')) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'terrain-svg-filters';
    svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
    svg.innerHTML = `<filter id="terrain-metaball-filter">
      <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur"/>
      <feColorMatrix in="blur" type="matrix"
        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 50 -20"
        result="threshold"/>
    </filter>`;
    document.body.appendChild(svg);
  }

  /**
   * Resizes the physical canvas while maintaining logical CSS bounds.
   */
  public resize(logicalWidth: number, logicalHeight: number) {
    this.canvas.style.width = `${logicalWidth}px`
    this.canvas.style.height = `${logicalHeight}px`
    this.canvas.width = logicalWidth * this.dpr
    this.canvas.height = logicalHeight * this.dpr
    
    this.lightingCanvas.width = logicalWidth * this.dpr;
    this.lightingCanvas.height = logicalHeight * this.dpr;
    this.lightCtx = this.lightingCanvas.getContext('2d') as CanvasRenderingContext2D;
    this.lightGradientCache.clear();

    // Cache Screen-Space Atmospheric Fog (top 20% of screen)
    // Needs to multiply by dpr for Retina/High-DPI screens!
    this.fogGradCache = this.ctx.createLinearGradient(0, 0, 0, logicalHeight * this.dpr * 0.20);
    this.fogGradCache.addColorStop(0.0, 'rgba(239, 230, 213, 0.15)'); // Tuned down from 0.35 to 0.15
    this.fogGradCache.addColorStop(1.0, 'rgba(239, 230, 213, 0.0)');

    // Cache Screen-Space Macro-Lens Vignette
    const cx = (logicalWidth * this.dpr) / 2;
    const cy = (logicalHeight * this.dpr) / 2;
    const radius = Math.max(logicalWidth, logicalHeight) * this.dpr * 0.8;
    this.vignetteGradCache = this.ctx.createRadialGradient(cx, cy, radius * 0.4, cx, cy, radius);
    this.vignetteGradCache.addColorStop(0, 'rgba(0, 0, 0, 0.0)');
    this.vignetteGradCache.addColorStop(1, 'rgba(20, 10, 0, 0.10)'); // Tuned down from 0.30 to 0.10
  }

  /**
   * Paints the world state. 
   */
  public draw(world: WorldState) {
    const { worldWidth, worldHeight, camera } = world
    const dt = Math.min(0.1, (world.totalTime - this.lastTotalTime) || 0);
    this.lastTotalTime = world.totalTime;

    // 1. Clear physical canvas background
    this.ctx.save();
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); // reset to physical
    this.ctx.fillStyle = '#1e1e1e'; // void color
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();

    // Check if we need to bake terrain
    if (!this.isTerrainBaked || world.flags.terrainChanged) {
      this.bakeTerrain(world);
      world.flags.terrainChanged = false; // Safe: draw() now accepts mutable WorldState
    }

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

    // ── 2a. Floor Base Gradient & Terrain ───────────────────────────────────────
    // Draw the pre-baked terrain directly as the floor
    this.ctx.drawImage(this.terrainCanvas, 0, 0, worldWidth, worldHeight);

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

    this.drawDust(dt, true, logicalW, logicalH, world);

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
    
    this.drawDust(dt, false, logicalW, logicalH, world);

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

    // Restore context scaling and camera matrix from the world space
    // So we can draw Screen-Space effects
    this.ctx.restore()

    // 6. Draw Screen-Space 3D Depth Cues (Fog & Vignette)
    // We draw this here so entities fade into the distance, but the Day/Night and UI overlays don't.
    this.ctx.save();
    try {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset entirely to physical screen coords
      
      if (this.fogGradCache) {
        this.ctx.fillStyle = this.fogGradCache;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }
      
      if (this.vignetteGradCache) {
        this.ctx.globalCompositeOperation = 'multiply';
        this.ctx.fillStyle = this.vignetteGradCache;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }
    } finally {
      this.ctx.restore();
    }

    // Re-apply camera matrix for the remaining effects that exist in world-space
    this.ctx.save();
    this.ctx.scale(this.dpr, this.dpr);
    this.ctx.translate(logicalW / 2, logicalH / 2);
    this.ctx.scale(camera.zoom, camera.zoom);
    this.ctx.translate(-camera.x, -camera.y);

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

    // 10. Global Illumination Pass
    const nightAlpha = getNightAlpha(world.timeOfDay);
    if (nightAlpha > 0.01) {
      this.drawLightingPass(world, nightAlpha, logicalW, logicalH, camera);
    }
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



  private drawDust(dt: number, isBackground: boolean, logicalW: number, logicalH: number, world: Readonly<WorldState>) {
    this.ctx.save();
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); // Raw screen space
    
    // Time of day tint calculation (once per frame)
    // Day = Golden Pollen, Sunset = Orange/Purple, Night = Blue
    let r = 255, g = 235, b = 180; // Daytime
    const t = world.timeOfDay;
    
    if (t >= 0.5 && t < 0.6) {
      // Dusk
      const mix = (t - 0.5) / 0.1;
      r = 255 - (75 * mix);  // 255 -> 180
      g = 235 - (55 * mix);  // 235 -> 180
      b = 180 + (75 * mix);  // 180 -> 255
    } else if (t >= 0.6 && t < 0.9) {
      // Full Night
      r = 180; g = 180; b = 255;
    } else if (t >= 0.9 && t <= 1.0) {
      // Dawn
      const mix = (t - 0.9) / 0.1;
      r = 180 + (75 * mix);
      g = 180 + (55 * mix);
      b = 255 - (75 * mix);
    }

    const rgb = `${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}`;

    // Re-bake the dust sprite once per frame for the current color
    // A 32x32 canvas bake is virtually free compared to drawing 150*3 arcs on the main canvas
    this.dustCtx.clearRect(0, 0, 32, 32);
    
    // 1. Draw Tiny Drop Shadow
    this.dustCtx.beginPath();
    this.dustCtx.arc(16, 17.5, 3, 0, Math.PI * 2);
    this.dustCtx.fillStyle = `rgba(0, 0, 0, 0.5)`;
    this.dustCtx.fill();
    
    // 2. Draw Core Mote
    this.dustCtx.beginPath();
    this.dustCtx.arc(16, 16, 3, 0, Math.PI * 2);
    this.dustCtx.fillStyle = `rgba(${rgb}, 1.0)`;
    this.dustCtx.fill();
    
    // 3. Foreground soft blur effect
    if (!isBackground) {
      this.dustCtx.beginPath();
      this.dustCtx.arc(16, 16, 9, 0, Math.PI * 2);
      this.dustCtx.fillStyle = `rgba(${rgb}, 0.2)`;
      this.dustCtx.fill();
    }

    for (let i = 0; i < this.dustParticles.length; i++) {
      const p = this.dustParticles[i];
      if (isBackground ? p.depth <= 0.5 : p.depth > 0.5) continue;
      
      // Update with Brownian motion
      p.sx += (p.speed * WIND_DIR * dt) + Math.sin(world.totalTime * 2 + p.phaseX) * 0.5;
      p.sy -= (p.speed * 0.3 * dt) + Math.cos(world.totalTime * 1.5 + p.phaseY) * 0.2;
      
      // Boundary wrap
      if (p.sx > logicalW + 50) p.sx = -50;
      else if (p.sx < -50) p.sx = logicalW + 50;
      
      if (p.sy < -50) p.sy = logicalH + 50;
      else if (p.sy > logicalH + 50) p.sy = -50;
      
      // Parallax Scale
      const parallaxScale = 0.5 + p.depth * 0.5;
      const actualSize = p.size * parallaxScale;

      // Twinkling alpha
      const pulse = Math.abs(Math.sin(world.totalTime * 0.8 + p.phaseY));
      const currentAlpha = p.alpha * pulse;
      
      this.ctx.globalAlpha = currentAlpha;
      // actualSize is typically around 1 to 4. Our baked core radius is 3.
      // We scale the 32x32 image to match actualSize.
      const scale = actualSize / 3;
      const renderSize = 32 * scale;
      this.ctx.drawImage(this.dustCanvas, p.sx - renderSize / 2, p.sy - renderSize / 2, renderSize, renderSize);
    }
    
    // Explicitly reset globalAlpha to prevent context state leaks
    this.ctx.globalAlpha = 1.0;
    this.ctx.restore();
  }

  private getGradient(key: string, createFn: () => CanvasGradient): CanvasGradient {
    let grad = this.lightGradientCache.get(key);
    if (!grad) {
      grad = createFn();
      this.lightGradientCache.set(key, grad);
    }
    return grad;
  }

  private drawLightingPass(world: Readonly<WorldState>, nightAlpha: number, logicalW: number, logicalH: number, camera: Readonly<WorldState['camera']>) {
    // 1. Clear and fill darkness
    this.lightCtx.clearRect(0, 0, this.lightingCanvas.width, this.lightingCanvas.height);
    this.lightCtx.fillStyle = `rgba(10, 10, 40, ${nightAlpha})`;
    this.lightCtx.fillRect(0, 0, this.lightingCanvas.width, this.lightingCanvas.height);
    
    this.lightCtx.save();
    this.lightCtx.globalCompositeOperation = 'destination-out';
    // We scale lightCtx by dpr so we can draw in logical coordinates
    this.lightCtx.scale(this.dpr, this.dpr);
    
    // Draw Lure Glow
    if (world.activeLure) {
      const { x, y } = world.activeLure;
      const screenX = (x - camera.x) * camera.zoom + logicalW / 2;
      const screenY = (y * CAMERA_TILT - camera.y) * camera.zoom + logicalH / 2;
      
      const radius = 100 * camera.zoom;
      const grad = this.getGradient(`lure_${radius.toFixed(1)}`, () => {
        const g = this.lightCtx.createRadialGradient(0, 0, 0, 0, 0, radius);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        return g;
      });
      this.lightCtx.translate(screenX, screenY);
      this.lightCtx.fillStyle = grad;
      this.lightCtx.beginPath();
      this.lightCtx.arc(0, 0, radius, 0, Math.PI * 2);
      this.lightCtx.fill();
      this.lightCtx.translate(-screenX, -screenY);
    }

    // Draw Creature Glows
    for (let i = 0; i < world.creatures.length; i++) {
      const creature = world.creatures[i];
      if (creature.level >= 5 || creature.diet === 'CARNIVORE') {
        const screenX = (creature.x - camera.x) * camera.zoom + logicalW / 2;
        const screenY = (creature.y * CAMERA_TILT - creature.z - camera.y) * camera.zoom + logicalH / 2;
        const size = BASE_RENDER_SIZE * creature.renderScale * (creature.currentScale || 1.0) * camera.zoom;
        
        if (creature.level >= 5) {
          const radius = size * 2;
          const grad = this.getGradient(`boss_${radius.toFixed(1)}`, () => {
            const g = this.lightCtx.createRadialGradient(0, 0, 0, 0, 0, radius);
            g.addColorStop(0, 'rgba(255,255,255,1)');
            g.addColorStop(1, 'rgba(255,255,255,0)');
            return g;
          });
          this.lightCtx.translate(screenX, screenY - size / 2);
          this.lightCtx.fillStyle = grad;
          this.lightCtx.beginPath();
          this.lightCtx.arc(0, 0, radius, 0, Math.PI * 2);
          this.lightCtx.fill();
          this.lightCtx.translate(-screenX, -(screenY - size / 2));
        } else if (creature.diet === 'CARNIVORE') {
          const radius = size * 0.4;
          const grad = this.getGradient(`carn_${radius.toFixed(1)}`, () => {
            const g = this.lightCtx.createRadialGradient(0, 0, 0, 0, 0, radius);
            g.addColorStop(0, 'rgba(255,255,255,0.8)');
            g.addColorStop(1, 'rgba(255,255,255,0)');
            return g;
          });
          const eyeOffset = size * 0.15;
          const headY = screenY - size * 0.7;
          
          this.lightCtx.fillStyle = grad;
          this.lightCtx.translate(screenX - eyeOffset, headY);
          this.lightCtx.beginPath(); this.lightCtx.arc(0, 0, radius, 0, Math.PI*2); this.lightCtx.fill();
          this.lightCtx.translate(eyeOffset * 2, 0);
          this.lightCtx.beginPath(); this.lightCtx.arc(0, 0, radius, 0, Math.PI*2); this.lightCtx.fill();
          this.lightCtx.translate(-(screenX + eyeOffset), -headY);
        }
      }
    }
    
    this.lightCtx.restore();

    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // physical
    this.ctx.drawImage(this.lightingCanvas, 0, 0);
    this.ctx.restore();
  }

  public dispose() {
    this.ctx = null as any;
    this.canvas = null as any;
    this.renderBuffer = [];
    this.lightingCanvas = null as any;
    this.lightCtx = null as any;
    this.dustParticles = [];
    this.lightGradientCache.clear();
    this.terrainCanvas = null as any;
    this.terrainCtx = null as any;
    this.offscreenCanvas = null as any;
    this.offscreenCtx = null as any;
    this.thresholdCanvas = null as any;
    this.thresholdCtx = null as any;
    document.getElementById('terrain-svg-filters')?.remove();
  }

  /**
   * Bakes the Uint8Array terrain data into a soft, blurred, painterly canvas.
   * This runs O(N) where N is map cells, but only executes when terrain is updated.
   */
  private bakeTerrain(world: Readonly<WorldState>) {
    const { worldWidth, worldHeight } = world;
    const terrain = world.scratchpad.terrain;
    const tw = world.scratchpad.terrainWidth;
    const th = world.scratchpad.terrainHeight;
    
    // We render at 1x resolution. The physical zoom will scale it.
    if (this.terrainCanvas.width !== worldWidth || this.terrainCanvas.height !== worldHeight) {
      this.terrainCanvas.width = worldWidth;
      this.terrainCanvas.height = worldHeight;
      this.offscreenCanvas.width = worldWidth;
      this.offscreenCanvas.height = worldHeight;
      this.thresholdCanvas.width = worldWidth;
      this.thresholdCanvas.height = worldHeight;
    }

    if (!terrain || !tw || !th) {
      // Fallback if terrain is not initialized
      const floorGrad = this.terrainCtx.createLinearGradient(0, 0, 0, worldHeight);
      floorGrad.addColorStop(0.0, '#ccc4aa');
      floorGrad.addColorStop(0.4, '#d8d0ba');
      floorGrad.addColorStop(1.0, '#ece6d8');
      this.terrainCtx.fillStyle = floorGrad;
      this.terrainCtx.fillRect(0, 0, worldWidth, worldHeight);
      this.isTerrainBaked = true;
      return;
    }

    // TERRAIN_COLORS mapping: 0=Water, 1=Dirt, 2=Grass, 3=Rock
    const colors = ['#4CA8D1', '#D6A675', '#84C270', '#979A9E'];
    const highlightColors = ['#45A3CC', '#CF6A48', '#2AB35B', '#42494F'];

    // 1. Fill entire base with Water (index 0) 
    this.terrainCtx.fillStyle = colors[0];
    this.terrainCtx.fillRect(0, 0, worldWidth, worldHeight);

    // Filter fallback for older Safari
    const supportsFilter = typeof this.terrainCtx.filter === 'string';

    const CELL_SIZE = 100;
    
    // Seeded random no longer needed here since we removed getJitteredVertex

    // 2. Render Dirt, Grass, Rock
    for (let layerIdx = 1; layerIdx <= 3; layerIdx++) {
      this.offscreenCtx.clearRect(0, 0, worldWidth, worldHeight);
      this.thresholdCtx.clearRect(0, 0, worldWidth, worldHeight);

      this.offscreenCtx.fillStyle = '#FFFFFF';
      
      // Step A: Draw slightly oversized blocks so neighbors overlap
      this.offscreenCtx.beginPath();
      for (let y = 0; y < th; y++) {
        for (let x = 0; x < tw; x++) {
          if (terrain[y * tw + x] >= layerIdx) {
            this.offscreenCtx.fillRect(x * CELL_SIZE - 5, y * CELL_SIZE - 5, CELL_SIZE + 10, CELL_SIZE + 10);
          }
        }
      }

      // Step B: Melt & Snap using GPU
      if (supportsFilter) {
        this.thresholdCtx.filter = 'url(#terrain-metaball-filter)';
      }
      this.thresholdCtx.drawImage(this.offscreenCanvas, 0, 0);
      if (supportsFilter) {
        this.thresholdCtx.filter = 'none';
      }

      // Color the shape
      this.thresholdCtx.globalCompositeOperation = 'source-in';
      this.thresholdCtx.fillStyle = colors[layerIdx];
      this.thresholdCtx.fillRect(0, 0, worldWidth, worldHeight);
      this.thresholdCtx.globalCompositeOperation = 'source-over';
      
      // Step C & D: Draw to main canvas with GPU Bevels & Shadows!
      // To maintain the 3D diorama pop WITHOUT drawing any jagged grid lines,
      // we use a clever dual drop-shadow technique.
      this.terrainCtx.save();
      if (supportsFilter) {
        // Pass 1: The Top-Edge Bevel Highlight
        // We draw the shape with an upwards-pointing drop shadow in the highlight color.
        this.terrainCtx.filter = `drop-shadow(0px -3px 0px ${highlightColors[layerIdx]})`;
        this.terrainCtx.drawImage(this.thresholdCanvas, 0, 0);

        // Pass 2: The Main Elevation Shadow
        // We draw the shape AGAIN exactly on top, with a massive downwards drop shadow.
        // This covers the main body of Pass 1, leaving only the top highlight exposed!
        const shadowY = layerIdx * 10;
        this.terrainCtx.filter = `drop-shadow(0px ${shadowY}px 0px rgba(0,0,0,0.6))`;
        this.terrainCtx.drawImage(this.thresholdCanvas, 0, 0);
      } else {
        this.terrainCtx.drawImage(this.thresholdCanvas, 0, 0);
      }
      this.terrainCtx.restore();
    }

    // Bake Global Noise Texture
    if (!this.noisePatternCache) {
      const noiseCanvas = document.createElement('canvas');
      noiseCanvas.width = 64; 
      noiseCanvas.height = 64;
      const nCtx = noiseCanvas.getContext('2d');
      if (nCtx) {
        const nData = nCtx.createImageData(64, 64);
        for (let i = 0; i < nData.data.length; i += 4) {
          const val = Math.random() * 255;
          nData.data[i] = val;
          nData.data[i+1] = val;
          nData.data[i+2] = val;
          nData.data[i+3] = 15; // Extremely subtle 6% opacity
        }
        nCtx.putImageData(nData, 0, 0);
        this.noisePatternCache = this.terrainCtx.createPattern(noiseCanvas, 'repeat');
      }
    }

    if (this.noisePatternCache) {
      this.terrainCtx.save();
      try {
        this.terrainCtx.globalCompositeOperation = 'multiply';
        this.terrainCtx.fillStyle = this.noisePatternCache;
        this.terrainCtx.fillRect(0, 0, worldWidth, worldHeight);
      } finally {
        this.terrainCtx.restore();
      }
    }

    this.isTerrainBaked = true;
  }
}

import type { WorldState, Creature, Plant } from '../types'
import { drawPlant } from './drawPlant'
import { drawCreature, drawCreatureShadow } from './drawCreature'
import { BASE_RENDER_SIZE } from '../constants'
import { useEngineStore } from '../store/useEngineStore';
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

    // 2. Clear & Draw Background
    this.ctx.clearRect(0, 0, worldWidth, worldHeight)
    const floor = this.ctx.createLinearGradient(0, 0, 0, worldHeight)
    floor.addColorStop(0, '#ece6d8')
    floor.addColorStop(1, '#d4c9b0')
    this.ctx.fillStyle = floor
    this.ctx.fillRect(0, 0, worldWidth, worldHeight)

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
      this.ctx.beginPath()
      // Pulsating ring effect
      const pulse = 1 + Math.sin(world.totalTime * 10) * 0.2
      this.ctx.arc(x, y, 30 * pulse, 0, Math.PI * 2)
      this.ctx.strokeStyle = `rgba(236, 72, 153, ${Math.min(1, timer / 2)})` // Pink glowing fade out
      this.ctx.lineWidth = 4
      this.ctx.stroke()
      
      this.ctx.beginPath()
      this.ctx.arc(x, y, 10, 0, Math.PI * 2)
      this.ctx.fillStyle = `rgba(236, 72, 153, ${Math.min(1, timer / 2)})`
      this.ctx.fill()
    }

    // 5. Draw Entities (Back to Front)
    for (let i = 0; i < this.entityCount; i++) {
      const entity = this.renderBuffer[i]
      if ('growthStage' in entity) {
        drawPlant(this.ctx, entity as Plant)
      } else {
        const creature = entity as Creature
        drawCreatureShadow(this.ctx, creature)
        drawCreature(this.ctx, creature)
        
        // Draw Health Bar if damaged or hovered
        if (creature.health < creature.maxHealth || creature.id === world.hoveredEntityId) {
          this.drawHealthBar(creature)
        }
      }
    }

    // 6. Draw Tooltip (Removed in favor of React HoverOverlay)

    // 7. Draw Pending Creature Ghost
    const pending = useEngineStore.getState().pendingCreature;
    if (pending) {
      this.ctx.save();
      this.ctx.globalAlpha = 0.5;
      
      const img = new Image();
      img.src = pending.drawingData;
      // Note: In a real app we'd want this cached, but for a simple ghost it's okay, 
      // or we can just draw a placeholder bounding box if we don't want to load it synchronously.
      // Since it's a data URL, it loads instantly in most browsers.
      if (img.complete) {
        // Base scale matches spawn logic in buildCreature
        let scale = 1.0;
        if (pending.size === 'SMALL') scale = 0.6;
        if (pending.size === 'LARGE') scale = 1.5;

        // "Baby" scale factor on spawn is 0.5
        const currentScale = 0.5 * scale;
        const renderSize = 64 * currentScale;

        this.ctx.translate(world.mouseX, world.mouseY);
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

  private drawHealthBar(creature: Creature) {
    const barWidth = 40;
    const barHeight = 6;
    const cx = creature.x - barWidth / 2;
    const size = BASE_RENDER_SIZE * creature.renderScale * (creature.currentScale || 1.0);
    const cy = creature.y - creature.z - size - 15;
    
    const healthPercent = Math.max(0, creature.health / creature.maxHealth);

    this.ctx.save();
    // Background (empty)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.ctx.beginPath();
    if (this.ctx.roundRect) this.ctx.roundRect(cx, cy, barWidth, barHeight, 3); 
    else this.ctx.rect(cx, cy, barWidth, barHeight);
    this.ctx.fill();

    this.ctx.fillStyle = creature.health > 40 ? '#4CAF50' : '#f44336';
    this.ctx.beginPath();
    if (this.ctx.roundRect) this.ctx.roundRect(cx, cy, barWidth * healthPercent, barHeight, 3);
    else this.ctx.rect(cx, cy, barWidth * healthPercent, barHeight);
    this.ctx.fill();
    this.ctx.restore();
  }



  public dispose() {
    this.ctx = null as any
    this.canvas = null as any
    this.renderBuffer = []
  }
}

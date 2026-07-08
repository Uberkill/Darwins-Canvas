import type { WorldState } from '../../types';
import { BASE_RENDER_SIZE } from '../../constants';

export class InteractionSystem {
  /**
   * Updates hit detection for mouse hovering.
   * Runs exactly once per frame (not tied to physics timestep).
   */
  static update(world: WorldState) {
    world.hoveredEntityId = null;
    let highestY = -Infinity;
    
    for (let i = world.creatures.length - 1; i >= 0; i--) {
      const entity = world.creatures[i];
      // Use currentScale so babies don't have adult hitboxes
      const radius = (BASE_RENDER_SIZE * entity.renderScale * (entity.currentScale || 1.0)) / 2;
      
      // Apple HIG / Material Design dictates minimum tap target of ~48px
      // We scale the padding by inverse zoom, and ensure the final physical radius on-screen is easily tappable
      let hitRadius = radius + (25 / world.camera.zoom);
      hitRadius = Math.max(48 / world.camera.zoom, hitRadius);
      
      // Offset the Y by radius so we hit the chest, not the feet.
      const visualCenterY = (entity.y - entity.z) - radius;
      const distSq = (entity.x - world.mouseX) ** 2 + (visualCenterY - world.mouseY) ** 2;
      
      if (distSq < hitRadius ** 2) {
        if (entity.y > highestY) {
          highestY = entity.y;
          world.hoveredEntityId = entity.id;
        }
      }
    }
  }
}

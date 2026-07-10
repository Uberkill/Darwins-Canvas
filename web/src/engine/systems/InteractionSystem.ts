import type { WorldState } from '../../types';
import { BASE_RENDER_SIZE, CAMERA_TILT, DEPTH_SCALE_FAR, DEPTH_SCALE_NEAR } from '../../constants';

export class InteractionSystem {
  /**
   * Updates hit detection for mouse hovering.
   * Runs exactly once per frame (not tied to physics timestep).
   *
   * Hit box uses the same depth scale as drawCreature so that clicking a
   * visually-smaller (far) creature still feels accurate.
   */
  static update(world: WorldState) {
    world.hoveredEntityId = null;
    let highestY = -Infinity;
    
    for (let i = world.creatures.length - 1; i >= 0; i--) {
      const entity = world.creatures[i];
      const size = BASE_RENDER_SIZE * entity.renderScale * (entity.currentScale || 1.0);

      // Depth scale: match the visual scale used by drawCreature
      const t = Math.max(0, Math.min(1, entity.y / world.worldHeight));
      const depthScale = DEPTH_SCALE_FAR + (DEPTH_SCALE_NEAR - DEPTH_SCALE_FAR) * t;
      const scaledSize = size * depthScale;
      const radius = scaledSize / 2;
      
      // Apple HIG / Material Design dictates minimum tap target of ~48px
      let hitRadius = radius + (25 / world.camera.zoom);
      hitRadius = Math.max(48 / world.camera.zoom, hitRadius);
      
      // 2.5D Bounding Box (AABB) hit testing
      // The visual sprite goes from its feet (y * CAMERA_TILT) up by `scaledSize`
      // We pad all 4 sides by hitRadius to ensure the tap target is always large enough
      const visualMouseY = world.mouseY * CAMERA_TILT;
      const bottomY = (entity.y * CAMERA_TILT) - entity.z + hitRadius;
      const topY = (entity.y * CAMERA_TILT) - entity.z - scaledSize - hitRadius;
      const leftX = entity.x - hitRadius;
      const rightX = entity.x + hitRadius;
      
      if (world.mouseX >= leftX && world.mouseX <= rightX && visualMouseY >= topY && visualMouseY <= bottomY) {
        if (entity.y > highestY) {
          highestY = entity.y;
          world.hoveredEntityId = entity.id;
        }
      }
    }
  }
}

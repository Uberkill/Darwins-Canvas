import type { UIStore, WorldState } from '../../types';
import { CAMERA_TILT } from '../../constants';

export class CameraSystem {
  static update(world: WorldState, uiState: UIStore, dtRealSec: number, canvasWidth: number, canvasHeight: number, dpr: number) {
    const cam = world.camera;

    // Smooth zoom
    cam.zoom += (uiState.targetZoom - cam.zoom) * (1 - Math.exp(-dtRealSec * 5));

    if (uiState.cameraMode === 'TRACKING' && uiState.selectedCreatureId) {
      const target = world.creatures.find(c => c.id === uiState.selectedCreatureId);
      if (target) {
        // Track target smoothly.
        // camera.y is in VISUAL space (y * CAMERA_TILT), so we must project target.y too.
        cam.x += (target.x - cam.x) * (1 - Math.exp(-dtRealSec * 5));
        cam.y += ((target.y * CAMERA_TILT) - cam.y) * (1 - Math.exp(-dtRealSec * 5));
      } else {
        // Target died/despawned — Fallback to FREE mode exactly where they vanished
        uiState.setCameraMode('FREE');
        uiState.setSelectedCreatureId(null);
      }
    } else {
      // FREE MODE: Keyboard Panning
      // cam.y is in visual space, so we pan by screen-pixel amounts directly.
      const panAmount = uiState.panSpeed * dtRealSec;
      if (uiState.keys.up) cam.y -= panAmount;
      if (uiState.keys.down) cam.y += panAmount;
      if (uiState.keys.left) cam.x -= panAmount;
      if (uiState.keys.right) cam.x += panAmount;
    }

    // Frustum Clamping
    // camera.y is in VISUAL space (world coords * CAMERA_TILT).
    // The visual floor spans 0 to (worldHeight * CAMERA_TILT).
    const visibleW = (canvasWidth / dpr) / cam.zoom;
    const visibleH = (canvasHeight / dpr) / cam.zoom;
    const visualFloorHeight = world.worldHeight * CAMERA_TILT;

    let minX = visibleW / 2;
    let maxX = world.worldWidth - visibleW / 2;
    let minY = visibleH / 2;
    let maxY = visualFloorHeight - visibleH / 2;

    if (minX > maxX) { minX = world.worldWidth / 2; maxX = world.worldWidth / 2; }
    if (minY > maxY) { minY = visualFloorHeight / 2; maxY = visualFloorHeight / 2; }

    // Clamp
    cam.x = Math.max(minX, Math.min(maxX, cam.x));
    cam.y = Math.max(minY, Math.min(maxY, cam.y));
  }
}

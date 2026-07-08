import type { UIStore, WorldState } from '../../types';

export class CameraSystem {
  static update(world: WorldState, uiState: UIStore, dtRealSec: number, canvasWidth: number, canvasHeight: number, dpr: number) {
    const cam = world.camera;

    // Smooth zoom
    cam.zoom += (uiState.targetZoom - cam.zoom) * (1 - Math.exp(-dtRealSec * 5));

    if (uiState.cameraMode === 'TRACKING' && uiState.selectedCreatureId) {
      const target = world.creatures.find(c => c.id === uiState.selectedCreatureId);
      if (target) {
        // Track target smoothly
        cam.x += (target.x - cam.x) * (1 - Math.exp(-dtRealSec * 5));
        cam.y += (target.y - cam.y) * (1 - Math.exp(-dtRealSec * 5));
      } else {
        // Target died/despawned — Fallback to FREE mode exactly where they vanished
        uiState.setCameraMode('FREE');
        uiState.setSelectedCreatureId(null);
      }
    } else {
      // FREE MODE: Keyboard Panning
      const panAmount = uiState.panSpeed * dtRealSec;
      if (uiState.keys.up) cam.y -= panAmount;
      if (uiState.keys.down) cam.y += panAmount;
      if (uiState.keys.left) cam.x -= panAmount;
      if (uiState.keys.right) cam.x += panAmount;
    }

    // Frustum Clamping
    const visibleW = (canvasWidth / dpr) / cam.zoom;
    const visibleH = (canvasHeight / dpr) / cam.zoom;
    
    let minX = visibleW / 2;
    let maxX = world.worldWidth - visibleW / 2;
    let minY = visibleH / 2;
    let maxY = world.worldHeight - visibleH / 2;

    if (minX > maxX) { minX = world.worldWidth / 2; maxX = world.worldWidth / 2; }
    if (minY > maxY) { minY = world.worldHeight / 2; maxY = world.worldHeight / 2; }

    // Clamp
    cam.x = Math.max(minX, Math.min(maxX, cam.x));
    cam.y = Math.max(minY, Math.min(maxY, cam.y));
  }
}

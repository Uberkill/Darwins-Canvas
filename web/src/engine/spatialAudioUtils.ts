export function calculateSpatialGain(x: number, y: number, camX: number, camY: number, camZoom: number): { distanceGain: number, isCulled: boolean } {
  // We assume max view width is ~2000px at zoom 1. We cull at distance 1500 (squared = 2250000).
  // The culling distance scales with zoom: zoom in (zoom=2) means we cull closer (dist 750).
  const cullDist = 1500 / camZoom;
  const dx = camX - x;
  const dy = camY - y;
  const distSq = dx * dx + dy * dy;
  
  if (distSq > cullDist * cullDist) {
    return { distanceGain: 0, isCulled: true };
  }
  
  let distanceGain = 1.0;
  if (distSq > 0 && cullDist > 0) {
    const distance = Math.sqrt(distSq);
    distanceGain = Math.max(0.01, 1.0 - (distance / cullDist));
  }
  
  return { distanceGain, isCulled: false };
}

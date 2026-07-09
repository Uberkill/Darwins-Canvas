import type { Creature, Plant } from '../types'

/**
 * A highly optimized 2D Spatial Hash Grid for O(N) physics queries.
 * Prevents O(N^2) lag spikes during Boids and Collision phases.
 * Uses zero-allocation array clearing (length = 0) to avoid GC pauses.
 */
export class SpatialGrid {
  public cellSize: number;
  public cols: number;
  public rows: number;
  public creatureCells: Creature[][];
  public plantCells: Plant[][];

  constructor(width: number, height: number, cellSize: number) {
    this.cellSize = cellSize;
    this.cols = Math.max(1, Math.ceil(width / cellSize));
    this.rows = Math.max(1, Math.ceil(height / cellSize));
    const numCells = this.cols * this.rows;
    this.creatureCells = new Array(numCells);
    this.plantCells = new Array(numCells);
    for (let i = 0; i < numCells; i++) {
      this.creatureCells[i] = [];
      this.plantCells[i] = [];
    }
  }

  public resize(width: number, height: number) {
    const newCols = Math.max(1, Math.ceil(width / this.cellSize));
    const newRows = Math.max(1, Math.ceil(height / this.cellSize));
    if (newCols === this.cols && newRows === this.rows) return;
    
    this.cols = newCols;
    this.rows = newRows;
    const numCells = this.cols * this.rows;
    this.creatureCells = new Array(numCells);
    this.plantCells = new Array(numCells);
    for (let i = 0; i < numCells; i++) {
      this.creatureCells[i] = [];
      this.plantCells[i] = [];
    }
  }

  public clear() {
    for (let i = 0; i < this.creatureCells.length; i++) {
      this.creatureCells[i].length = 0;
      this.plantCells[i].length = 0;
    }
  }

  private getCellIndex(x: number, y: number): number {
    if (Number.isNaN(x) || Number.isNaN(y)) return 0;
    const col = Math.max(0, Math.min(this.cols - 1, Math.floor(x / this.cellSize)));
    const row = Math.max(0, Math.min(this.rows - 1, Math.floor(y / this.cellSize)));
    return col + row * this.cols;
  }

  public insertCreature(c: Creature) {
    const idx = this.getCellIndex(c.x, c.y);
    this.creatureCells[idx].push(c);
  }

  public insertPlant(p: Plant) {
    const idx = this.getCellIndex(p.x, p.y);
    this.plantCells[idx].push(p);
  }

  /**
   * Retrieves all creatures within the bounding box of the search radius.
   * `out` array is mutated in-place to prevent memory allocations.
   */
  public getNearbyCreatures(x: number, y: number, searchRadius: number, out: Creature[]): void {
    out.length = 0;
    const minCol = Math.max(0, Math.floor((x - searchRadius) / this.cellSize));
    const maxCol = Math.min(this.cols - 1, Math.floor((x + searchRadius) / this.cellSize));
    const minRow = Math.max(0, Math.floor((y - searchRadius) / this.cellSize));
    const maxRow = Math.min(this.rows - 1, Math.floor((y + searchRadius) / this.cellSize));

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const cell = this.creatureCells[col + row * this.cols];
        for (let i = 0; i < cell.length; i++) {
          out.push(cell[i]);
        }
      }
    }
  }

  /**
   * Retrieves all plants within the bounding box of the search radius.
   * `out` array is mutated in-place to prevent memory allocations.
   */
  public getNearbyPlants(x: number, y: number, searchRadius: number, out: Plant[]): void {
    out.length = 0;
    const minCol = Math.max(0, Math.floor((x - searchRadius) / this.cellSize));
    const maxCol = Math.min(this.cols - 1, Math.floor((x + searchRadius) / this.cellSize));
    const minRow = Math.max(0, Math.floor((y - searchRadius) / this.cellSize));
    const maxRow = Math.min(this.rows - 1, Math.floor((y + searchRadius) / this.cellSize));

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const cell = this.plantCells[col + row * this.cols];
        for (let i = 0; i < cell.length; i++) {
          out.push(cell[i]);
        }
      }
    }
  }
}

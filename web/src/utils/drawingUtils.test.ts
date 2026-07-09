import { describe, it, expect } from 'vitest';
import { hexToRgb, floodFill } from './drawingUtils';

describe('drawingUtils', () => {
  describe('hexToRgb', () => {
    it('converts basic hex colors to RGB correctly', () => {
      expect(hexToRgb('#000000')).toEqual([0, 0, 0]);
      expect(hexToRgb('#FFFFFF')).toEqual([255, 255, 255]);
      expect(hexToRgb('#FF0000')).toEqual([255, 0, 0]);
    });
  });

  describe('floodFill', () => {
    it('correctly fills a bounded area in a Uint8ClampedArray buffer', () => {
      const width = 4;
      const height = 4;
      // 4x4 canvas, 4 bytes per pixel (RGBA) = 64 bytes
      const data = new Uint8ClampedArray(width * height * 4);
      
      // Draw a vertical boundary line at x=2 with alpha=255
      for (let y = 0; y < height; y++) {
        const idx = (y * width + 2) * 4;
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 255;
      }

      // Flood fill at (0,0) with red (255, 0, 0)
      floodFill(data, 0, 0, 255, 0, 0, width, height, 30);

      // Verify (0,0) is red
      expect(data[0]).toBe(255);
      expect(data[1]).toBe(0);
      expect(data[2]).toBe(0);
      expect(data[3]).toBe(255);

      // Verify (1,0) is red
      expect(data[4]).toBe(255);
      expect(data[5]).toBe(0);
      expect(data[6]).toBe(0);
      
      // Verify boundary (2,0) is untouched (black)
      expect(data[8]).toBe(0);
      expect(data[9]).toBe(0);
      expect(data[10]).toBe(0);

      // Verify beyond boundary (3,0) is untouched (transparent)
      expect(data[12]).toBe(0);
      expect(data[13]).toBe(0);
      expect(data[14]).toBe(0);
      expect(data[15]).toBe(0);
    });
  });
});

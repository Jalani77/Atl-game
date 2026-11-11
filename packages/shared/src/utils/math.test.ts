import { describe, it, expect } from 'vitest';
import {
  distance2D,
  distance3D,
  normalize2D,
  lerp,
  lerpVec3,
  clamp,
  pointInRect,
  pointInCircle,
  snapToGrid,
  generateId,
} from './math';

describe('math utilities', () => {
  describe('distance2D', () => {
    it('calculates distance between two points ignoring Y', () => {
      const a = { x: 0, y: 5, z: 0 };
      const b = { x: 3, y: 10, z: 4 };
      expect(distance2D(a, b)).toBe(5);
    });

    it('returns 0 for same point', () => {
      const p = { x: 5, y: 5, z: 5 };
      expect(distance2D(p, p)).toBe(0);
    });
  });

  describe('distance3D', () => {
    it('calculates 3D distance', () => {
      const a = { x: 0, y: 0, z: 0 };
      const b = { x: 1, y: 2, z: 2 };
      expect(distance3D(a, b)).toBe(3);
    });
  });

  describe('normalize2D', () => {
    it('normalizes a vector to unit length', () => {
      const v = { x: 3, y: 0, z: 4 };
      const n = normalize2D(v);
      expect(n.x).toBeCloseTo(0.6);
      expect(n.z).toBeCloseTo(0.8);
      expect(n.y).toBe(0);
    });

    it('returns zero vector for zero input', () => {
      const v = { x: 0, y: 0, z: 0 };
      const n = normalize2D(v);
      expect(n.x).toBe(0);
      expect(n.z).toBe(0);
    });
  });

  describe('lerp', () => {
    it('interpolates between two values', () => {
      expect(lerp(0, 10, 0)).toBe(0);
      expect(lerp(0, 10, 1)).toBe(10);
      expect(lerp(0, 10, 0.5)).toBe(5);
    });
  });

  describe('lerpVec3', () => {
    it('interpolates between two vectors', () => {
      const a = { x: 0, y: 0, z: 0 };
      const b = { x: 10, y: 20, z: 30 };
      const result = lerpVec3(a, b, 0.5);
      expect(result.x).toBe(5);
      expect(result.y).toBe(10);
      expect(result.z).toBe(15);
    });
  });

  describe('clamp', () => {
    it('clamps value within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('pointInRect', () => {
    it('detects point inside rectangle', () => {
      const center = { x: 0, y: 0, z: 0 };
      const inside = { x: 2, y: 0, z: 2 };
      const outside = { x: 10, y: 0, z: 10 };
      expect(pointInRect(inside, center, 10, 10, 0)).toBe(true);
      expect(pointInRect(outside, center, 10, 10, 0)).toBe(false);
    });
  });

  describe('pointInCircle', () => {
    it('detects point inside circle', () => {
      const center = { x: 0, y: 0, z: 0 };
      const inside = { x: 3, y: 0, z: 4 };
      const outside = { x: 10, y: 0, z: 10 };
      expect(pointInCircle(inside, center, 5)).toBe(true);
      expect(pointInCircle(outside, center, 5)).toBe(false);
    });
  });

  describe('snapToGrid', () => {
    it('snaps values to grid', () => {
      expect(snapToGrid(2.3, 1)).toBe(2);
      expect(snapToGrid(2.7, 1)).toBe(3);
      expect(snapToGrid(4.1, 2)).toBe(4);
      expect(snapToGrid(5.1, 2)).toBe(6);
    });
  });

  describe('generateId', () => {
    it('generates unique ids', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(100);
    });
  });
});

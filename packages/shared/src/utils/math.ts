import type { Vec3 } from '../config/world';

export function distance2D(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

export function distance3D(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function normalize2D(v: Vec3): Vec3 {
  const len = Math.sqrt(v.x * v.x + v.z * v.z);
  if (len === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / len, y: 0, z: v.z / len };
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function pointInRect(
  point: Vec3,
  center: Vec3,
  width: number,
  depth: number,
  rotation: number = 0
): boolean {
  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);
  const dx = point.x - center.x;
  const dz = point.z - center.z;
  const localX = dx * cos - dz * sin;
  const localZ = dx * sin + dz * cos;
  return Math.abs(localX) <= width / 2 && Math.abs(localZ) <= depth / 2;
}

export function pointInCircle(point: Vec3, center: Vec3, radius: number): boolean {
  return distance2D(point, center) <= radius;
}

export function rectsOverlap(
  c1: Vec3, w1: number, d1: number, r1: number,
  c2: Vec3, w2: number, d2: number, r2: number
): boolean {
  const dist = distance2D(c1, c2);
  const maxDist = Math.sqrt(w1 * w1 + d1 * d1) / 2 + Math.sqrt(w2 * w2 + d2 * d2) / 2;
  if (dist > maxDist) return false;
  
  const corners1 = getRectCorners(c1, w1, d1, r1);
  const corners2 = getRectCorners(c2, w2, d2, r2);
  
  for (const corner of corners1) {
    if (pointInRect(corner, c2, w2, d2, r2)) return true;
  }
  for (const corner of corners2) {
    if (pointInRect(corner, c1, w1, d1, r1)) return true;
  }
  
  return false;
}

function getRectCorners(center: Vec3, width: number, depth: number, rotation: number): Vec3[] {
  const hw = width / 2;
  const hd = depth / 2;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return [
    { x: center.x + hw * cos - hd * sin, y: 0, z: center.z + hw * sin + hd * cos },
    { x: center.x - hw * cos - hd * sin, y: 0, z: center.z - hw * sin + hd * cos },
    { x: center.x - hw * cos + hd * sin, y: 0, z: center.z - hw * sin - hd * cos },
    { x: center.x + hw * cos + hd * sin, y: 0, z: center.z + hw * sin - hd * cos },
  ];
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

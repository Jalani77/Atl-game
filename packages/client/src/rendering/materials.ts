import * as THREE from 'three';
import type { SchoolId } from '@campus-rivals/shared';

export interface CampusPalette {
  wall: number;
  trim: number;
  roof: number;
  accent: number;
  glass: number;
  stone: number;
  metal: number;
  roofStyle: 'flat' | 'pitch' | 'saw';
}

export const PALETTES: Record<SchoolId, CampusPalette> = {
  metro: {
    wall: 0xf3f0ea,
    trim: 0x2f6f95,
    roof: 0x31485a,
    accent: 0x3aa0e0,
    glass: 0xb7e3f5,
    stone: 0xd5dbe0,
    metal: 0x9aa7b2,
    roofStyle: 'flat',
  },
  foundry: {
    wall: 0xd8c3a5,
    trim: 0x8a5a32,
    roof: 0x5e564c,
    accent: 0xe2b23a,
    glass: 0xd7e7c8,
    stone: 0xb7a48a,
    metal: 0x8e969c,
    roofStyle: 'saw',
  },
  redcrest: {
    wall: 0xc26555,
    trim: 0xf4e7d4,
    roof: 0x6d4034,
    accent: 0xa33b32,
    glass: 0xf2e2c4,
    stone: 0xe7d7c3,
    metal: 0x8d735c,
    roofStyle: 'pitch',
  },
};

const cache = new Map<string, THREE.MeshStandardMaterial>();

export function mat(
  color: number,
  opts: { roughness?: number; metalness?: number; emissive?: number; opacity?: number } = {},
): THREE.MeshStandardMaterial {
  const key = `${color}:${opts.roughness ?? 0.7}:${opts.metalness ?? 0}:${opts.emissive ?? 0}:${opts.opacity ?? 1}`;
  let material = cache.get(key);
  if (!material) {
    material = new THREE.MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? 0.72,
      metalness: opts.metalness ?? 0,
      emissive: opts.emissive ?? 0x000000,
      emissiveIntensity: opts.emissive ? 0.35 : 0,
      transparent: (opts.opacity ?? 1) < 1,
      opacity: opts.opacity ?? 1,
    });
    cache.set(key, material);
  }
  return material;
}

export function addBox(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  opts: { shadow?: boolean; occlude?: boolean } = {},
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = opts.shadow !== false;
  mesh.receiveShadow = true;
  if (opts.occlude) mesh.userData.occlude = true;
  parent.add(mesh);
  return mesh;
}

export function labelTexture(title: string, subtitle: string, accent: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#1c2430';
  roundRect(ctx, 8, 8, 496, 240, 28);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.fillRect(8, 8, 18, 240);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 46px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 268, 110);
  ctx.fillStyle = '#d5deea';
  ctx.font = '600 36px Inter, sans-serif';
  ctx.fillText(subtitle, 268, 170);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

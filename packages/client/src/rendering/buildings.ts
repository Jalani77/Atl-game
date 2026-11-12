import * as THREE from 'three';
import type { SchoolId } from '@campus-rivals/shared';
import { BUILDINGS } from '@campus-rivals/shared';
import { PALETTES, addBox, mat, type CampusPalette } from './materials';

export function createCampusBuilding(buildingId: string, school: SchoolId): THREE.Group {
  const config = BUILDINGS[buildingId];
  const palette = PALETTES[school];
  const group = new THREE.Group();
  const w = config?.footprint.width ?? 4;
  const d = config?.footprint.depth ?? 4;
  const floors = buildingId === 'dormitory' ? 3 : buildingId === 'stadium' ? 2 : Math.max(1, Math.round((config?.height ?? 2) / 1.4));

  addBox(group, w + 0.4, 0.25, d + 0.4, mat(palette.stone, { roughness: 0.9 }), 0, 0.12, 0, { occlude: true });
  addBox(group, w * 0.45, 0.18, 0.9, mat(palette.stone), 0, 0.22, d / 2 + 0.15, { shadow: false });

  const wallH = 1.15 * floors + 0.4;
  addBox(group, w, wallH, d, mat(palette.wall), 0, 0.25 + wallH / 2, 0, { occlude: true });
  addBox(group, w + 0.08, 0.12, d + 0.08, mat(palette.trim), 0, 0.25 + wallH - 0.02, 0, { shadow: false });

  addWindows(group, buildingId, w, d, floors, palette);
  addDoor(group, d, palette);
  addRoof(group, buildingId, w, d, 0.25 + wallH, palette);
  addSign(group, labelFor(buildingId, school), d, palette);

  if (buildingId === 'dining') addDiningExtras(group, w, d, palette);
  if (buildingId === 'recreation') addCourt(group, w, d, palette);
  if (buildingId === 'stadium') addStands(group, w, d, palette);
  if (buildingId === 'president') addBanners(group, w, palette);
  if (buildingId === 'library') addColumns(group, d, palette);
  if (buildingId === 'specialty') addSpecialty(group, school, w, d, palette);

  group.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  });
  return group;
}

function addWindows(group: THREE.Group, id: string, w: number, d: number, floors: number, palette: CampusPalette) {
  const glass = mat(palette.glass, { roughness: 0.15, metalness: 0.05, emissive: palette.glass });
  const frame = mat(palette.trim, { roughness: 0.5 });
  const cols = id === 'dormitory' ? 4 : id === 'library' ? 2 : 3;
  const winW = id === 'library' ? 0.7 : 0.46;
  const winH = id === 'library' ? 1.3 : 0.62;
  for (let floor = 0; floor < floors; floor++) {
    for (let col = 0; col < cols; col++) {
      const x = (col - (cols - 1) / 2) * (w / (cols + 0.4));
      const y = 0.85 + floor * 1.15;
      if (Math.abs(x) < 0.35 && floor === 0) continue;
      addBox(group, winW + 0.08, winH + 0.08, 0.08, frame, x, y, d / 2 + 0.02, { shadow: false });
      addBox(group, winW, winH, 0.06, glass, x, y, d / 2 + 0.05, { shadow: false });
    }
  }
}

function addDoor(group: THREE.Group, d: number, palette: CampusPalette) {
  addBox(group, 0.7, 1.15, 0.12, mat(0x4a3428, { roughness: 0.6 }), 0, 0.82, d / 2 + 0.04);
  addBox(group, 1.5, 0.12, 0.7, mat(palette.accent), 0, 1.55, d / 2 + 0.28, { shadow: true });
  addBox(group, 0.1, 1.2, 0.1, mat(palette.trim), -0.7, 0.9, d / 2 + 0.28, { shadow: false });
  addBox(group, 0.1, 1.2, 0.1, mat(palette.trim), 0.7, 0.9, d / 2 + 0.28, { shadow: false });
}

function addRoof(group: THREE.Group, id: string, w: number, d: number, y: number, palette: CampusPalette) {
  const roof = mat(palette.roof, { roughness: 0.85 });
  if (palette.roofStyle === 'pitch' || id === 'library' || id === 'president') {
    const geom = new THREE.ConeGeometry(Math.max(w, d) * 0.72, 1.3, 4);
    const mesh = new THREE.Mesh(geom, roof);
    mesh.position.y = y + 0.55;
    mesh.rotation.y = Math.PI / 4;
    mesh.castShadow = true;
    mesh.userData.occlude = true;
    group.add(mesh);
    return;
  }
  if (palette.roofStyle === 'saw' || id === 'specialty') {
    addBox(group, w + 0.3, 0.28, d + 0.3, roof, 0, y + 0.14, 0, { occlude: true });
    addBox(group, w * 0.7, 0.7, 0.35, mat(palette.metal, { metalness: 0.4, roughness: 0.4 }), -w * 0.1, y + 0.5, 0);
    return;
  }
  addBox(group, w + 0.35, 0.28, d + 0.35, roof, 0, y + 0.12, 0, { occlude: true });
  addBox(group, 0.8, 0.45, 0.8, mat(palette.accent), w * 0.28, y + 0.4, -d * 0.2, { shadow: false });
}

function addSign(group: THREE.Group, text: string, d: number, palette: CampusPalette) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f7f4ee';
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = '#' + palette.accent.toString(16).padStart(6, '0');
  ctx.fillRect(0, 0, 512, 10);
  ctx.fillStyle = '#243040';
  ctx.font = '700 48px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 70);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 0.55),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.6 }),
  );
  board.position.set(0, 2.05, d / 2 + 0.42);
  group.add(board);
}

function labelFor(id: string, school: SchoolId): string {
  if (id === 'specialty') {
    if (school === 'metro') return 'Innovation Hub';
    if (school === 'foundry') return 'Maker Workshop';
    return 'Grand Hall';
  }
  return BUILDINGS[id]?.name ?? 'Campus Hall';
}

function addDiningExtras(group: THREE.Group, w: number, d: number, palette: CampusPalette) {
  for (const side of [-1, 1]) {
    addBox(group, 0.8, 0.08, 0.8, mat(palette.stone), side * (w / 2 + 1.1), 0.7, d * 0.1);
    addBox(group, 0.7, 0.06, 0.7, mat(0x6d8f72), side * (w / 2 + 1.1), 0.78, d * 0.1, { shadow: false });
  }
}

function addCourt(group: THREE.Group, w: number, d: number, palette: CampusPalette) {
  addBox(group, 3.2, 0.06, 2.2, mat(0xe8d7a8, { roughness: 0.9 }), w / 2 + 2.2, 0.08, 0, { shadow: false });
  addBox(group, 0.08, 1.6, 0.08, mat(palette.trim), w / 2 + 2.2, 0.9, 0, { shadow: false });
}

function addStands(group: THREE.Group, w: number, d: number, palette: CampusPalette) {
  addBox(group, w + 1, 0.08, d + 1.4, mat(0x3f8f4a), 0, 0.08, 0, { shadow: false });
  addBox(group, 0.5, 1.1, d, mat(palette.accent), -w / 2 - 0.2, 0.7, 0);
  addBox(group, 0.5, 1.1, d, mat(palette.accent), w / 2 + 0.2, 0.7, 0);
}

function addBanners(group: THREE.Group, w: number, palette: CampusPalette) {
  for (const side of [-1, 1]) {
    addBox(group, 0.08, 1.6, 0.08, mat(0x6b5344), side * (w / 2 + 0.4), 1.3, 0.4);
    addBox(group, 0.06, 0.9, 0.55, mat(palette.accent), side * (w / 2 + 0.55), 1.5, 0.4, { shadow: false });
  }
}

function addColumns(group: THREE.Group, d: number, palette: CampusPalette) {
  for (const x of [-0.9, 0.9]) {
    addBox(group, 0.18, 1.5, 0.18, mat(palette.trim), x, 1.0, d / 2 + 0.35);
  }
}

function addSpecialty(group: THREE.Group, school: SchoolId, w: number, d: number, palette: CampusPalette) {
  if (school === 'metro') {
    addBox(group, 1.2, 0.12, 1.2, mat(palette.glass, { opacity: 0.85, roughness: 0.1 }), 0, 3.1, 0, { shadow: false });
  } else if (school === 'foundry') {
    addBox(group, 0.7, 0.7, 0.7, mat(palette.metal, { metalness: 0.5, roughness: 0.35 }), w * 0.2, 2.4, -d * 0.1);
  } else {
    addBox(group, 0.4, 1.4, 0.4, mat(palette.trim), 0, 2.6, 0);
  }
}

export function createStarterKiosk(school: SchoolId): THREE.Group {
  const group = createCampusBuilding('admissions', school);
  group.scale.setScalar(0.72);
  return group;
}

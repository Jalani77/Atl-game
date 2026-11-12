import * as THREE from 'three';
import { DISTRICTS, PLOTS, PROTECTED_AREAS, SCHOOLS, type PlotConfig, type SchoolId } from '@campus-rivals/shared';
import { PALETTES, addBox, labelTexture, mat } from './materials';
import { createCharacter, animateCharacter } from './character';
import { createStarterKiosk } from './buildings';

export interface AmbientWalker {
  mesh: THREE.Group;
  points: THREE.Vector3[];
  cursor: number;
}

export function buildCampusEnvironment(scene: THREE.Scene): AmbientWalker[] {
  const walkers: AmbientWalker[] = [];
  addGround(scene);
  addRoads(scene);
  addPlaza(scene);
  addHorizon(scene);
  for (const plot of PLOTS) dressPlot(scene, plot, walkers);
  for (const school of Object.keys(DISTRICTS) as SchoolId[]) addDistrictLandmark(scene, school);
  for (const area of PROTECTED_AREAS) addSpawnCourtyard(scene, area.center, area.school === 'neutral' ? 0xd9e2ea : SCHOOLS[area.school].colorHex);
  return walkers;
}

export function updateWalkers(walkers: AmbientWalker[], dt: number, now: number): void {
  for (const walker of walkers) {
    const target = walker.points[walker.cursor];
    const pos = walker.mesh.position;
    const dx = target.x - pos.x;
    const dz = target.z - pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.2) {
      walker.cursor = (walker.cursor + 1) % walker.points.length;
    } else {
      const step = Math.min(1.6 * dt, dist);
      pos.x += (dx / dist) * step;
      pos.z += (dz / dist) * step;
      walker.mesh.rotation.y = Math.atan2(dx, dz);
    }
    animateCharacter(walker.mesh, dt, true, now);
  }
}

function addGround(scene: THREE.Scene) {
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(210, 64),
    mat(0x7cbc62, { roughness: 0.95 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.08;
  ground.receiveShadow = true;
  scene.add(ground);

  const lawn = new THREE.Mesh(
    new THREE.CircleGeometry(150, 48),
    mat(0x8dcc70, { roughness: 0.92 }),
  );
  lawn.rotation.x = -Math.PI / 2;
  lawn.receiveShadow = true;
  scene.add(lawn);
}

function addRoads(scene: THREE.Scene) {
  const asphalt = mat(0x4e555d, { roughness: 0.88 });
  const walk = mat(0xe7e1d6, { roughness: 0.8 });
  const curb = mat(0xc8c2b6, { roughness: 0.75 });
  const ns = new THREE.Mesh(new THREE.PlaneGeometry(9, 280), asphalt);
  ns.rotation.x = -Math.PI / 2;
  ns.position.y = 0.02;
  ns.receiveShadow = true;
  scene.add(ns);
  const ew = new THREE.Mesh(new THREE.PlaneGeometry(280, 9), asphalt);
  ew.rotation.x = -Math.PI / 2;
  ew.position.y = 0.02;
  ew.receiveShadow = true;
  scene.add(ew);
  for (const offset of [-6.2, 6.2]) {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 280), walk);
    side.rotation.x = -Math.PI / 2;
    side.position.set(offset, 0.035, 0);
    side.receiveShadow = true;
    scene.add(side);
    const other = new THREE.Mesh(new THREE.PlaneGeometry(280, 2.4), walk);
    other.rotation.x = -Math.PI / 2;
    other.position.set(0, 0.035, offset);
    other.receiveShadow = true;
    scene.add(other);
    const curbMesh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 280), curb);
    curbMesh.position.set(offset > 0 ? 4.7 : -4.7, 0.08, 0);
    scene.add(curbMesh);
  }
  for (const z of [-40, -20, 20, 40]) {
    addLamp(scene, 8, z, 0xf2e2b0);
    addBench(scene, -8.5, z, 0);
  }
}

function addPlaza(scene: THREE.Scene) {
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 0.12, 8), mat(0xe5dccb, { roughness: 0.82 }));
  plaza.position.y = 0.06;
  plaza.receiveShadow = true;
  scene.add(plaza);

  const basin = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.6, 0.7, 8), mat(0xd9d3c8));
  basin.position.y = 0.45;
  basin.castShadow = true;
  scene.add(basin);
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(2.7, 2.7, 0.18, 16),
    mat(0x79c7e3, { roughness: 0.2, opacity: 0.85, emissive: 0x2a6f8a }),
  );
  water.position.y = 0.72;
  water.name = 'fountain-water';
  scene.add(water);
  addBox(scene, 0.45, 2.4, 0.45, mat(0xf4f1ea), 0, 1.7, 0);
  for (const [x, z, color] of [[1.1, 0, 0x3aa0e0], [-0.7, 0.9, 0xe2b23a], [-0.7, -0.9, 0xc26555]] as const) {
    addBox(scene, 0.35, 0.9, 0.35, mat(color), x, 2.5, z, { shadow: false });
  }

  addTree(scene, 10, 10, 0);
  addTree(scene, -10, 8, 1);
  addTree(scene, 9, -11, 2);
  addTree(scene, -11, -9, 0);
  addFlowerBed(scene, 6, 0);
  addFlowerBed(scene, -6, 1);
  addNotice(scene, 12, -2);
  addBikeRack(scene, -12, 2);
}

function addHorizon(scene: THREE.Scene) {
  const hillMat = mat(0x6eaf62, { roughness: 1 });
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const hill = new THREE.Mesh(new THREE.SphereGeometry(18 + (i % 3) * 6, 8, 6), hillMat);
    hill.position.set(Math.cos(angle) * 185, -8, Math.sin(angle) * 185);
    scene.add(hill);
    addTree(scene, Math.cos(angle) * 150, Math.sin(angle) * 150, i);
  }
}

function dressPlot(scene: THREE.Scene, plot: PlotConfig, walkers: AmbientWalker[]) {
  const palette = PALETTES[plot.school];
  const lawn = new THREE.Mesh(
    new THREE.PlaneGeometry(plot.size.width - 1.2, plot.size.depth - 1.2),
    mat(plot.school === 'metro' ? 0x86c56a : plot.school === 'foundry' ? 0x8fba68 : 0x7eb85f, { roughness: 0.93 }),
  );
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.set(plot.center.x, 0.015, plot.center.z);
  lawn.receiveShadow = true;
  scene.add(lawn);

  const toward = new THREE.Vector3(-plot.center.x, 0, -plot.center.z).normalize();
  const gate = new THREE.Vector3(
    plot.center.x + toward.x * (plot.size.width / 2 - 1),
    0,
    plot.center.z + toward.z * (plot.size.depth / 2 - 1),
  );
  const yaw = Math.atan2(toward.x, toward.z);

  const pathEnd = gate.clone().add(toward.clone().multiplyScalar(14));
  const path = new THREE.Mesh(new THREE.PlaneGeometry(2.6, plot.size.depth * 0.95), mat(palette.stone, { roughness: 0.8 }));
  path.rotation.x = -Math.PI / 2;
  path.rotation.z = -yaw;
  path.position.set((plot.center.x + pathEnd.x) / 2, 0.04, (plot.center.z + pathEnd.z) / 2);
  path.receiveShadow = true;
  scene.add(path);

  hedgeRing(scene, plot, gate, palette.accent);
  cornerPosts(scene, plot, palette.accent);

  const kiosk = createStarterKiosk(plot.school);
  kiosk.position.set(plot.center.x + toward.x * 6, 0, plot.center.z + toward.z * 6);
  kiosk.rotation.y = yaw + Math.PI;
  scene.add(kiosk);

  const sign = new THREE.Sprite(new THREE.SpriteMaterial({
    map: labelTexture(SCHOOLS[plot.school].shortName.toUpperCase(), 'CAMPUS GATE', cssHex(palette.accent)),
    transparent: true,
  }));
  sign.position.set(gate.x, 2.3, gate.z);
  sign.scale.set(3.4, 1.7, 1);
  scene.add(sign);

  addLamp(scene, gate.x + 1.6, gate.z, palette.accent);
  addBench(scene, plot.center.x - toward.z * 4, plot.center.z + toward.x * 4, yaw);
  addTree(scene, plot.center.x - 10, plot.center.z - 8, plot.index);
  addTree(scene, plot.center.x + 9, plot.center.z - 9, plot.index + 1);
  addFlowerBed(scene, plot.center.x + 8, plot.center.z + 6);

  const walker = createCharacter({ school: plot.school, variant: plot.index, role: 'student' });
  const home = new THREE.Vector3(plot.center.x, 0, plot.center.z);
  walker.position.copy(home);
  scene.add(walker);
  walkers.push({
    mesh: walker,
    cursor: 0,
    points: [
      home.clone(),
      new THREE.Vector3(plot.center.x + 6, 0, plot.center.z - 4),
      new THREE.Vector3(plot.center.x - 5, 0, plot.center.z + 5),
    ],
  });
}

function hedgeRing(scene: THREE.Scene, plot: PlotConfig, gate: THREE.Vector3, accent: number) {
  const hedge = mat(0x6fbf63, { roughness: 0.8 });
  const halfW = plot.size.width / 2;
  const halfD = plot.size.depth / 2;
  const edges = [
    { x: 0, z: halfD - 0.4, w: plot.size.width, d: 0.45 },
    { x: 0, z: -halfD + 0.4, w: plot.size.width, d: 0.45 },
    { x: halfW - 0.4, z: 0, w: 0.45, d: plot.size.depth },
    { x: -halfW + 0.4, z: 0, w: 0.45, d: plot.size.depth },
  ];
  for (const edge of edges) {
    const mesh = addBox(scene, edge.w, 0.55, edge.d, hedge, plot.center.x + edge.x, 0.32, plot.center.z + edge.z);
    const dx = mesh.position.x - gate.x;
    const dz = mesh.position.z - gate.z;
    if (Math.hypot(dx, dz) < 8) scene.remove(mesh);
  }
  addBox(scene, 0.35, 0.2, 0.35, mat(accent), plot.center.x + halfW - 1, 0.15, plot.center.z + halfD - 1, { shadow: false });
}

function cornerPosts(scene: THREE.Scene, plot: PlotConfig, color: number) {
  const halfW = plot.size.width / 2 - 0.6;
  const halfD = plot.size.depth / 2 - 0.6;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addBox(scene, 0.28, 0.7, 0.28, mat(color), plot.center.x + sx * halfW, 0.35, plot.center.z + sz * halfD);
    }
  }
}

function addDistrictLandmark(scene: THREE.Scene, school: SchoolId) {
  const district = DISTRICTS[school];
  const palette = PALETTES[school];
  const group = new THREE.Group();
  group.position.set(district.center.x, 0, district.center.z);
  if (school === 'metro') {
    addBox(group, 6, 8, 6, mat(palette.wall), 0, 4, 0, { occlude: true });
    addBox(group, 5.2, 6.4, 0.12, mat(palette.glass, { roughness: 0.12, emissive: palette.glass }), 0, 4.2, 3.06, { shadow: false });
    addBox(group, 6.4, 0.3, 6.4, mat(palette.accent), 0, 8.15, 0);
  } else if (school === 'foundry') {
    addBox(group, 8, 4, 5, mat(0xb5653d), 0, 2, 0, { occlude: true });
    addBox(group, 8.4, 0.4, 5.4, mat(palette.metal, { metalness: 0.45, roughness: 0.4 }), 0, 4.2, 0);
    addBox(group, 1.2, 2.2, 1.2, mat(palette.accent), 2.4, 5.2, 0);
  } else {
    addBox(group, 8, 4.5, 5, mat(palette.wall), 0, 2.25, 0, { occlude: true });
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.2, 4), mat(palette.roof));
    roof.position.y = 5.4;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);
  }
  const sign = new THREE.Sprite(new THREE.SpriteMaterial({
    map: labelTexture(SCHOOLS[school].shortName.toUpperCase(), 'DISTRICT', cssHex(palette.accent)),
    transparent: true,
  }));
  sign.position.y = school === 'metro' ? 10 : 7;
  sign.scale.set(5, 2.5, 1);
  group.add(sign);
  scene.add(group);
  addTree(scene, district.center.x + 8, district.center.z + 6, 1);
  addTree(scene, district.center.x - 7, district.center.z + 5, 2);
}

function addSpawnCourtyard(scene: THREE.Scene, center: { x: number; z: number }, color: number) {
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.4, 0.1, 6), mat(0xf3eee6, { roughness: 0.85 }));
  pad.position.set(center.x, 0.05, center.z);
  pad.receiveShadow = true;
  scene.add(pad);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    addBox(scene, 0.22, 0.85, 0.22, mat(color), center.x + Math.cos(a) * 4.2, 0.45, center.z + Math.sin(a) * 4.2);
  }
}

function addTree(scene: THREE.Scene, x: number, z: number, variant: number) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.name = 'tree';
  addBox(group, 0.35, 1.5, 0.35, mat(0x7a5436), 0, 0.75, 0);
  const leaf = mat(variant % 2 === 0 ? 0x3e9a45 : 0x2f7d43, { roughness: 0.85 });
  if (variant % 3 === 0) {
    addBox(group, 1.8, 1.5, 1.8, leaf, 0, 2.1, 0);
  } else if (variant % 3 === 1) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.15, 2.2, 6), leaf);
    cone.position.y = 2.3;
    cone.castShadow = true;
    group.add(cone);
  } else {
    addBox(group, 1.5, 0.7, 1.5, leaf, 0, 1.8, 0);
    addBox(group, 1.1, 0.7, 1.1, leaf, 0, 2.45, 0);
  }
  scene.add(group);
}

function addLamp(scene: THREE.Scene, x: number, z: number, glow: number) {
  addBox(scene, 0.12, 2.2, 0.12, mat(0x4d5560, { metalness: 0.4, roughness: 0.4 }), x, 1.1, z);
  addBox(scene, 0.45, 0.28, 0.45, mat(glow, { emissive: glow, roughness: 0.4 }), x, 2.25, z, { shadow: false });
}

function addBench(scene: THREE.Scene, x: number, z: number, yaw: number) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = yaw;
  addBox(group, 1.3, 0.1, 0.42, mat(0x8b5a32), 0, 0.48, 0);
  addBox(group, 1.3, 0.4, 0.08, mat(0x8b5a32), 0, 0.7, -0.18);
  addBox(group, 0.08, 0.48, 0.4, mat(0x3d4650), -0.58, 0.24, 0, { shadow: false });
  addBox(group, 0.08, 0.48, 0.4, mat(0x3d4650), 0.58, 0.24, 0, { shadow: false });
  scene.add(group);
}

function addFlowerBed(scene: THREE.Scene, x: number, z: number) {
  addBox(scene, 1.6, 0.22, 0.7, mat(0x6b4a32), x, 0.12, z);
  for (const [ox, color] of [[-0.4, 0xe07a9a], [0, 0xf2d15a], [0.4, 0x7eb6e0]] as const) {
    addBox(scene, 0.22, 0.28, 0.22, mat(color), x + ox, 0.32, z, { shadow: false });
  }
}

function addNotice(scene: THREE.Scene, x: number, z: number) {
  addBox(scene, 0.1, 1.4, 0.1, mat(0x6b5344), x - 0.5, 0.7, z);
  addBox(scene, 0.1, 1.4, 0.1, mat(0x6b5344), x + 0.5, 0.7, z);
  addBox(scene, 1.3, 0.9, 0.08, mat(0xf4efe4), x, 1.15, z);
}

function addBikeRack(scene: THREE.Scene, x: number, z: number) {
  for (let i = 0; i < 3; i++) {
    addBox(scene, 0.08, 0.55, 0.4, mat(0x8d9399, { metalness: 0.5, roughness: 0.35 }), x + i * 0.45, 0.35, z);
  }
}

function cssHex(color: number): string {
  return '#' + color.toString(16).padStart(6, '0');
}

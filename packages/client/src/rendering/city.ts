import * as THREE from 'three';
import { addBox, mat } from './materials';

export function addCityDistrict(scene: THREE.Scene): void {
  const block = new THREE.Group();
  block.position.set(34, 0, -28);

  addBox(block, 16, 0.08, 22, mat(0x3d4652), 0, 0.04, 0);
  addBox(block, 14.4, 0.12, 0.8, mat(0xc9c3b6), 0, 0.12, -10.2);
  addBox(block, 14.4, 0.12, 0.8, mat(0xc9c3b6), 0, 0.12, 10.2);
  addBox(block, 0.8, 0.12, 20, mat(0xc9c3b6), -7.6, 0.12, 0);
  addBox(block, 0.8, 0.12, 20, mat(0xc9c3b6), 7.6, 0.12, 0);

  for (let i = -3; i <= 3; i++) {
    addBox(block, 0.7, 0.02, 1.4, mat(0xf2efe8), 0, 0.09, i * 2.2);
  }

  const cafe = storefront(0xc46a4a, 0xf3e2c8, 'Peach Cart');
  cafe.position.set(-4.2, 0, -4);
  block.add(cafe);
  const books = storefront(0x3e6f8a, 0xe7f1f6, 'Shelf Stop');
  books.position.set(4.2, 0, -4);
  block.add(books);

  const deck = new THREE.Group();
  for (let level = 0; level < 3; level++) {
    addBox(deck, 6.5, 0.25, 8, mat(0x8d93a0), 0, 0.8 + level * 1.35, 5);
    addBox(deck, 6.2, 0.7, 0.15, mat(0x6e7684), 0, 1.2 + level * 1.35, 1.2);
  }
  block.add(deck);

  const shelter = new THREE.Group();
  addBox(shelter, 2.4, 0.12, 1.2, mat(0x2f3b4a), 0, 2.1, 0);
  addBox(shelter, 0.08, 2, 0.08, mat(0x2f3b4a), -1, 1, 0.4);
  addBox(shelter, 0.08, 2, 0.08, mat(0x2f3b4a), 1, 1, 0.4);
  addBox(shelter, 1.6, 0.9, 0.05, mat(0x9fd0ea), 0, 1.15, 0.45);
  shelter.position.set(0, 0, 9.2);
  block.add(shelter);

  scene.add(block);

  const skyline = [
    { x: -120, z: -140, h: 28, w: 10, color: 0x8ea4b8 },
    { x: -90, z: -155, h: 42, w: 8, color: 0xb7c6d4 },
    { x: 110, z: -150, h: 36, w: 12, color: 0x9aa7b5 },
    { x: 150, z: -120, h: 24, w: 9, color: 0xc3b7a4 },
    { x: 140, z: 130, h: 30, w: 11, color: 0x8f8680 },
    { x: -140, z: 120, h: 22, w: 10, color: 0xaeb8c4 },
  ];
  for (const tower of skyline) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(tower.w, tower.h, tower.w * 0.7),
      mat(tower.color, { roughness: 0.7 }),
    );
    mesh.position.set(tower.x, tower.h / 2, tower.z);
    scene.add(mesh);
  }

  const car = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 3.2), mat(0xd8573a));
  car.name = 'city-car';
  car.position.set(3.2, 0.5, -40);
  scene.add(car);
}

export function updateCity(scene: THREE.Scene, dt: number): void {
  const car = scene.getObjectByName('city-car');
  if (!car) return;
  car.position.z += dt * 6;
  if (car.position.z > 70) car.position.z = -70;
}

function storefront(wall: number, awning: number, name: string): THREE.Group {
  const group = new THREE.Group();
  addBox(group, 4.2, 3.2, 4.2, mat(wall), 0, 1.6, 0);
  addBox(group, 3.4, 0.2, 1.2, mat(awning), 0, 2.5, 2.2);
  addBox(group, 1.2, 1.8, 0.1, mat(0x6ec1e0), -0.8, 1.5, 2.12);
  addBox(group, 1.1, 2.1, 0.1, mat(0x243044), 1, 1.05, 2.12);
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#243044';
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = '#f7f1e4';
  ctx.font = '700 28px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name, 128, 42);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 0.5),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas) }),
  );
  sign.position.set(0, 2.9, 2.16);
  group.add(sign);
  return group;
}

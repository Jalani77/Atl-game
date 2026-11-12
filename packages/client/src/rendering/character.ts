import * as THREE from 'three';
import type { SchoolId } from '@campus-rivals/shared';
import { PALETTES, addBox, mat } from './materials';

export interface CharacterOptions {
  school: SchoolId | null;
  variant?: number;
  role?: 'student' | 'president' | 'defender';
}

const SKIN = [0xf0c7a4, 0xd9a67a, 0x8d5a3c, 0xf6d3b0];
const HAIR = [0x2b211c, 0x5a3828, 0xc4552a, 0x1d2430, 0xe6c36a];
const SHIRTS = [0xf7f4ef, 0x4e6270, 0xefe6d6, 0x6d7a72];

export function createCharacter(options: CharacterOptions): THREE.Group {
  const group = new THREE.Group();
  const variant = options.variant ?? 0;
  const role = options.role ?? 'student';
  const palette = options.school ? PALETTES[options.school] : null;
  const accent = palette?.accent ?? 0x8aa0b2;
  const president = role === 'president';
  const scale = president ? 1.15 : 1;

  const skin = mat(SKIN[variant % SKIN.length], { roughness: 0.65 });
  const hair = mat(HAIR[(variant + 1) % HAIR.length], { roughness: 0.55 });
  const shirtColor = president ? 0xf7f1e6 : SHIRTS[variant % SHIRTS.length];
  const shirt = mat(shirtColor, { roughness: 0.8 });
  const pants = mat(president ? 0x2c3440 : 0x3d4654, { roughness: 0.85 });
  const shoes = mat(0x24282e, { roughness: 0.5 });
  const accentMat = mat(accent, { roughness: 0.45 });

  const leftLeg = new THREE.Group();
  const rightLeg = new THREE.Group();
  leftLeg.position.set(-0.16 * scale, 0.72 * scale, 0);
  rightLeg.position.set(0.16 * scale, 0.72 * scale, 0);
  addBox(leftLeg, 0.22 * scale, 0.62 * scale, 0.24 * scale, pants, 0, -0.22 * scale, 0);
  addBox(rightLeg, 0.22 * scale, 0.62 * scale, 0.24 * scale, pants, 0, -0.22 * scale, 0);
  addBox(leftLeg, 0.24 * scale, 0.12 * scale, 0.34 * scale, shoes, 0, -0.52 * scale, 0.04);
  addBox(rightLeg, 0.24 * scale, 0.12 * scale, 0.34 * scale, shoes, 0, -0.52 * scale, 0.04);
  group.add(leftLeg, rightLeg);

  const torso = new THREE.Group();
  torso.position.y = 0.95 * scale;
  addBox(torso, 0.62 * scale, 0.62 * scale, 0.34 * scale, shirt, 0, 0.18 * scale, 0);
  addBox(torso, 0.66 * scale, 0.1 * scale, 0.36 * scale, accentMat, 0, 0.46 * scale, 0, { shadow: false });
  if (president) {
    addBox(torso, 0.7 * scale, 0.78 * scale, 0.16 * scale, mat(accent, { roughness: 0.6 }), 0, 0.12 * scale, -0.18 * scale);
    addBox(torso, 0.12 * scale, 0.7 * scale, 0.08 * scale, mat(0xf2d36b), 0.22 * scale, 0.16 * scale, 0.2 * scale, { shadow: false });
  }
  group.add(torso);

  const leftArm = new THREE.Group();
  const rightArm = new THREE.Group();
  leftArm.position.set(-0.42 * scale, 1.28 * scale, 0);
  rightArm.position.set(0.42 * scale, 1.28 * scale, 0);
  addBox(leftArm, 0.16 * scale, 0.48 * scale, 0.16 * scale, shirt, 0, -0.22 * scale, 0);
  addBox(rightArm, 0.16 * scale, 0.48 * scale, 0.16 * scale, shirt, 0, -0.22 * scale, 0);
  addBox(leftArm, 0.14 * scale, 0.14 * scale, 0.14 * scale, skin, 0, -0.5 * scale, 0, { shadow: false });
  addBox(rightArm, 0.14 * scale, 0.14 * scale, 0.14 * scale, skin, 0, -0.5 * scale, 0, { shadow: false });
  group.add(leftArm, rightArm);

  const head = new THREE.Group();
  head.position.y = 1.72 * scale;
  addBox(head, 0.42 * scale, 0.4 * scale, 0.4 * scale, skin, 0, 0, 0);
  addBox(head, 0.08 * scale, 0.08 * scale, 0.04 * scale, mat(0x2a241f), -0.1 * scale, 0.04 * scale, 0.2 * scale, { shadow: false });
  addBox(head, 0.08 * scale, 0.08 * scale, 0.04 * scale, mat(0x2a241f), 0.1 * scale, 0.04 * scale, 0.2 * scale, { shadow: false });
  addBox(head, 0.16 * scale, 0.04 * scale, 0.04 * scale, mat(0xc46a62), 0, -0.1 * scale, 0.2 * scale, { shadow: false });

  const hairStyle = variant % 3;
  if (hairStyle === 0) addBox(head, 0.46 * scale, 0.16 * scale, 0.44 * scale, hair, 0, 0.22 * scale, 0, { shadow: false });
  if (hairStyle === 1) {
    addBox(head, 0.46 * scale, 0.18 * scale, 0.44 * scale, hair, 0, 0.2 * scale, -0.02 * scale, { shadow: false });
    addBox(head, 0.16 * scale, 0.28 * scale, 0.36 * scale, hair, -0.18 * scale, 0.02 * scale, 0, { shadow: false });
  }
  if (hairStyle === 2) {
    addBox(head, 0.44 * scale, 0.14 * scale, 0.42 * scale, hair, 0, 0.2 * scale, 0, { shadow: false });
    addBox(head, 0.18 * scale, 0.18 * scale, 0.18 * scale, hair, 0, 0.28 * scale, -0.12 * scale, { shadow: false });
  }
  if (president) {
    addBox(head, 0.5 * scale, 0.08 * scale, 0.5 * scale, accentMat, 0, 0.28 * scale, 0, { shadow: false });
    addBox(head, 0.28 * scale, 0.16 * scale, 0.28 * scale, accentMat, 0, 0.38 * scale, 0, { shadow: false });
  }
  group.add(head);

  if (variant % 2 === 0 && !president) {
    addBox(group, 0.28 * scale, 0.34 * scale, 0.14 * scale, mat(accent, { roughness: 0.6 }), 0, 1.05 * scale, -0.22 * scale);
  }

  group.userData.rig = { leftLeg, rightLeg, leftArm, rightArm, head };
  group.userData.phase = variant;
  group.userData.attackUntil = 0;
  group.userData.hitUntil = 0;
  group.traverse((obj) => {
    obj.castShadow = true;
    obj.receiveShadow = true;
  });
  return group;
}

export function animateCharacter(group: THREE.Group, dt: number, moving: boolean, now: number): void {
  const rig = group.userData.rig as {
    leftLeg: THREE.Group;
    rightLeg: THREE.Group;
    leftArm: THREE.Group;
    rightArm: THREE.Group;
    head: THREE.Group;
  } | undefined;
  if (!rig) return;
  group.userData.phase = (group.userData.phase ?? 0) + dt * (moving ? 9 : 1.6);
  const phase = group.userData.phase as number;
  const swing = moving ? Math.sin(phase) * 0.7 : Math.sin(phase) * 0.05;
  rig.leftLeg.rotation.x = swing;
  rig.rightLeg.rotation.x = -swing;
  rig.leftArm.rotation.x = -swing * 0.8;
  rig.rightArm.rotation.x = swing * 0.8;
  rig.head.rotation.y = Math.sin(phase * 0.5) * 0.08;
  if (now < (group.userData.attackUntil as number)) {
    rig.rightArm.rotation.x = -1.4;
  }
  const hit = now < (group.userData.hitUntil as number);
  group.position.y = hit ? 0.08 : moving ? Math.abs(Math.sin(phase)) * 0.06 : 0;
  group.rotation.z = hit ? 0.18 : 0;
}

import * as THREE from 'three';
import type {
  PlayerState,
  NPCState,
  BannerState,
  CampusState,
  SchoolId,
} from '@campus-rivals/shared';
import { SCHOOLS, BUILDINGS, PLOTS } from '@campus-rivals/shared';
import { createCharacter, animateCharacter } from './character';
import { createCampusBuilding } from './buildings';
import { buildCampusEnvironment, updateWalkers, type AmbientWalker } from './environment';
import { PALETTES, labelTexture, mat } from './materials';

export class WorldRenderer {
  private scene: THREE.Scene;
  private playerMeshes = new Map<string, THREE.Group>();
  private npcMeshes = new Map<string, THREE.Group>();
  private bannerMeshes = new Map<SchoolId, THREE.Group>();
  private buildingMeshes = new Map<string, THREE.Group>();
  private purchasePadMeshes = new Map<string, THREE.Group>();
  private damageTexts: { mesh: THREE.Object3D; endTime: number }[] = [];
  private lastPositions = new Map<string, THREE.Vector3>();
  private walkers: AmbientWalker[] = [];
  private sun?: THREE.DirectionalLight;
  private quality: 'low' | 'high' = 'high';
  private audio = new PurchaseChime();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  buildWorld(): void {
    this.scene.clear();
    this.playerMeshes.clear();
    this.npcMeshes.clear();
    this.bannerMeshes.clear();
    this.buildingMeshes.clear();
    this.purchasePadMeshes.clear();

    const hemi = new THREE.HemisphereLight(0xfff4e0, 0x6ea85a, 0.72);
    this.scene.add(hemi);
    const ambient = new THREE.AmbientLight(0xfff7ee, 0.28);
    this.scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffe2b0, 1.25);
    sun.position.set(-40, 70, 30);
    sun.castShadow = this.quality === 'high';
    sun.shadow.mapSize.set(this.quality === 'high' ? 2048 : 1024, this.quality === 'high' ? 2048 : 1024);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 220;
    sun.shadow.camera.left = -90;
    sun.shadow.camera.right = 90;
    sun.shadow.camera.top = 90;
    sun.shadow.camera.bottom = -90;
    sun.shadow.bias = -0.0004;
    this.scene.add(sun);
    this.sun = sun;

    this.walkers = buildCampusEnvironment(this.scene);
    this.buildBanners();
  }

  setQuality(level: 'low' | 'high'): void {
    this.quality = level;
    if (this.sun) this.sun.castShadow = level === 'high';
  }

  updateCampuses(campuses: Map<string, CampusState>): void {
    const livePads = new Set<string>();
    for (const campus of campuses.values()) {
      for (const building of campus.buildings) {
        if (this.buildingMeshes.has(building.instanceId)) continue;
        const model = createCampusBuilding(building.buildingId, campus.school);
        model.position.set(building.worldPosition.x, 0, building.worldPosition.z);
        model.rotation.y = building.rotation;
        model.scale.setScalar(0.2);
        model.userData.appear = true;
        this.scene.add(model);
        this.buildingMeshes.set(building.instanceId, model);
        this.audio.play();
        this.burst(model.position, SCHOOLS[campus.school].colorHex);
      }
      for (const pad of campus.purchasePads) livePads.add(pad.id);
    }

    for (const [padId, mesh] of this.purchasePadMeshes) {
      if (!livePads.has(padId)) {
        this.scene.remove(mesh);
        this.purchasePadMeshes.delete(padId);
      }
    }

    for (const campus of campuses.values()) {
      for (const pad of campus.purchasePads) {
        if (this.purchasePadMeshes.has(pad.id)) continue;
        const station = this.createPurchaseStation(pad.buildingId, campus.school, pad.isActive);
        station.position.set(pad.position.x, 0, pad.position.z);
        this.scene.add(station);
        this.purchasePadMeshes.set(pad.id, station);
      }
    }
  }

  private createPurchaseStation(buildingId: string, school: SchoolId, active: boolean): THREE.Group {
    const group = new THREE.Group();
    const palette = PALETTES[school];
    const config = BUILDINGS[buildingId];
    const price = config?.basePrice ?? 0;
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.35, 1.5, 0.28, 6),
      mat(active ? palette.accent : 0x8d9399, { roughness: 0.45, emissive: active ? palette.accent : 0 }),
    );
    base.position.y = 0.16;
    base.castShadow = true;
    group.add(base);

    const preview = createCampusBuilding(buildingId, school);
    preview.scale.setScalar(0.22);
    preview.position.y = 0.9;
    preview.traverse((obj) => {
      obj.castShadow = false;
    });
    group.add(preview);

    const affordable = price === 0 ? 'FREE' : `${price} CASH`;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: labelTexture(config?.name ?? buildingId, active ? affordable : 'LOCKED', css(palette.accent)),
      transparent: true,
    }));
    sprite.position.y = 2.5;
    sprite.scale.set(3.1, 1.55, 1);
    group.add(sprite);
    group.userData.preview = preview;
    group.userData.baseY = 0.9;
    return group;
  }

  private buildBanners(): void {
    for (const school of Object.keys(SCHOOLS) as SchoolId[]) {
      const palette = PALETTES[school];
      const group = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.2, 6), mat(0x6b5344));
      pole.position.y = 2.1;
      pole.castShadow = true;
      group.add(pole);
      const flagMat = mat(palette.accent, { roughness: 0.6 }).clone();
      flagMat.side = THREE.DoubleSide;
      const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9), flagMat);
      cloth.position.set(0.75, 3.5, 0);
      cloth.name = 'flag';
      group.add(cloth);
      const home = PLOTS.find((plot) => plot.school === school);
      const districtZ = school === 'redcrest' ? 100 : -100;
      const districtX = school === 'metro' ? -80 : school === 'foundry' ? 80 : 0;
      group.position.set(home ? districtX : 0, 0, districtZ);
      this.scene.add(group);
      this.bannerMeshes.set(school, group);
    }
  }

  addPlayer(player: PlayerState): void {
    this.updatePlayer(player);
  }

  removePlayer(playerId: string): void {
    const mesh = this.playerMeshes.get(playerId);
    if (mesh) this.scene.remove(mesh);
    this.playerMeshes.delete(playerId);
    this.lastPositions.delete(playerId);
  }

  updatePlayer(player: PlayerState): void {
    let mesh = this.playerMeshes.get(player.id);
    if (mesh && mesh.userData.school !== (player.school ?? 'none')) {
      this.scene.remove(mesh);
      this.playerMeshes.delete(player.id);
      mesh = undefined;
    }
    if (!mesh) {
      mesh = createCharacter({
        school: player.school,
        variant: player.name.length,
        role: 'student',
      });
      mesh.userData.school = player.school ?? 'none';
      this.scene.add(mesh);
      this.playerMeshes.set(player.id, mesh);
    }
    mesh.visible = player.isAlive;
    mesh.position.x = player.position.x;
    mesh.position.z = player.position.z;
    mesh.rotation.y = player.rotation;
  }

  playAttack(id: string): void {
    const mesh = this.playerMeshes.get(id) ?? this.npcMeshes.get(id);
    if (mesh) mesh.userData.attackUntil = performance.now() + 280;
  }

  showDamageEffect(targetId: string, damage: number): void {
    const mesh = this.playerMeshes.get(targetId) || this.npcMeshes.get(targetId);
    if (!mesh) return;
    mesh.userData.hitUntil = performance.now() + 220;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.font = '700 42px Inter, sans-serif';
    ctx.fillStyle = '#ff5a4a';
    ctx.textAlign = 'center';
    ctx.fillText(`-${damage}`, 64, 46);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true }));
    sprite.position.copy(mesh.position);
    sprite.position.y += 2.4;
    sprite.scale.set(1.4, 0.7, 1);
    this.scene.add(sprite);
    this.damageTexts.push({ mesh: sprite, endTime: Date.now() + 800 });
  }

  updateEntities(
    dt: number,
    players: Map<string, PlayerState>,
    npcs: Map<string, NPCState>,
    banners: Map<SchoolId, BannerState>,
  ): void {
    const now = performance.now();
    for (const player of players.values()) {
      const prev = this.lastPositions.get(player.id);
      const moving = !!prev && Math.hypot(player.position.x - prev.x, player.position.z - prev.z) > 0.02;
      this.updatePlayer(player);
      const mesh = this.playerMeshes.get(player.id);
      if (mesh && player.isAlive) animateCharacter(mesh, dt, moving, now);
      this.lastPositions.set(player.id, new THREE.Vector3(player.position.x, 0, player.position.z));
    }

    for (const npc of npcs.values()) {
      let mesh = this.npcMeshes.get(npc.id);
      if (!mesh) {
        mesh = createCharacter({
          school: npc.school,
          variant: npc.type === 'president' ? 2 : 1,
          role: npc.type === 'president' ? 'president' : 'defender',
        });
        this.scene.add(mesh);
        this.npcMeshes.set(npc.id, mesh);
      }
      const prev = this.lastPositions.get(npc.id);
      const moving = !!prev && Math.hypot(npc.position.x - prev.x, npc.position.z - prev.z) > 0.02;
      mesh.visible = npc.isAlive;
      mesh.position.x = npc.position.x;
      mesh.position.z = npc.position.z;
      mesh.rotation.y = npc.rotation;
      if (npc.isAlive) animateCharacter(mesh, dt, moving, now);
      this.lastPositions.set(npc.id, new THREE.Vector3(npc.position.x, 0, npc.position.z));
    }

    for (const [school, banner] of banners) {
      const mesh = this.bannerMeshes.get(school);
      if (!mesh) continue;
      mesh.visible = !banner.carrierId;
      if (!banner.carrierId) mesh.position.set(banner.position.x, 0, banner.position.z);
      const flag = mesh.getObjectByName('flag');
      if (flag) flag.rotation.y = Math.sin(now / 400) * 0.25;
    }

    for (const station of this.purchasePadMeshes.values()) {
      const preview = station.userData.preview as THREE.Object3D | undefined;
      if (preview) {
        preview.rotation.y += dt;
        preview.position.y = 0.9 + Math.sin(now / 450) * 0.08;
      }
    }

    for (const building of this.buildingMeshes.values()) {
      if (building.userData.appear) {
        const next = Math.min(1, building.scale.x + dt * 2.2);
        building.scale.setScalar(next);
        if (next >= 1) building.userData.appear = false;
      }
    }

    const water = this.scene.getObjectByName('fountain-water');
    if (water) water.position.y = 0.72 + Math.sin(now / 500) * 0.04;

    this.scene.traverse((obj) => {
      if (obj.name === 'tree') obj.rotation.z = Math.sin(now / 900 + obj.position.x) * 0.03;
    });

    updateWalkers(this.walkers, dt, now);
    this.updateDamageTexts();
  }

  private burst(position: THREE.Vector3, color: number): void {
    for (let i = 0; i < 8; i++) {
      const bit = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), mat(color, { emissive: color }));
      bit.position.copy(position);
      bit.position.y = 1.2;
      bit.userData.life = 0.6;
      bit.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 3, 2 + Math.random(), (Math.random() - 0.5) * 3);
      this.scene.add(bit);
      this.damageTexts.push({ mesh: bit, endTime: Date.now() + 600 });
    }
  }

  private updateDamageTexts(): void {
    const now = Date.now();
    for (let i = this.damageTexts.length - 1; i >= 0; i--) {
      const text = this.damageTexts[i];
      if (now > text.endTime) {
        this.scene.remove(text.mesh);
        this.damageTexts.splice(i, 1);
      } else if ((text.mesh as THREE.Sprite).isSprite) {
        text.mesh.position.y += 0.015;
        const material = (text.mesh as THREE.Sprite).material;
        material.opacity = Math.max(0, (text.endTime - now) / 800);
      }
    }
  }
}

function css(color: number): string {
  return '#' + color.toString(16).padStart(6, '0');
}

class PurchaseChime {
  private ctx?: AudioContext;
  play(): void {
    const AudioCtx = window.AudioContext;
    if (!AudioCtx) return;
    this.ctx ??= new AudioCtx();
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }
}

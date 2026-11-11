import * as THREE from 'three';
import type {
  PlayerState,
  NPCState,
  BannerState,
  CampusState,
  SchoolId,
  Vec3,
} from '@campus-rivals/shared';
import {
  SCHOOLS,
  PLOTS,
  DISTRICTS,
  PROTECTED_AREAS,
  BUILDINGS,
} from '@campus-rivals/shared';

export class WorldRenderer {
  private scene: THREE.Scene;
  private playerMeshes = new Map<string, THREE.Group>();
  private npcMeshes = new Map<string, THREE.Group>();
  private bannerMeshes = new Map<SchoolId, THREE.Group>();
  private buildingMeshes = new Map<string, THREE.Mesh>();
  private purchasePadMeshes = new Map<string, THREE.Group>();
  private damageTexts: { mesh: THREE.Sprite; endTime: number }[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  buildWorld(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(50, 100, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 300;
    sunLight.shadow.camera.left = -150;
    sunLight.shadow.camera.right = 150;
    sunLight.shadow.camera.top = 150;
    sunLight.shadow.camera.bottom = -150;
    this.scene.add(sunLight);

    const groundGeom = new THREE.PlaneGeometry(400, 400);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x4a7c4e,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    this.scene.add(ground);

    this.buildDistricts();
    this.buildPlots();
    this.buildProtectedAreas();
    this.buildTownCenter();
    this.buildRoads();
    this.buildBanners();
  }

  private buildDistricts(): void {
    for (const [schoolId, district] of Object.entries(DISTRICTS)) {
      const school = SCHOOLS[schoolId as SchoolId];
      
      const circleGeom = new THREE.RingGeometry(district.radius - 1, district.radius, 64);
      const circleMat = new THREE.MeshBasicMaterial({
        color: school.colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3,
      });
      const circle = new THREE.Mesh(circleGeom, circleMat);
      circle.rotation.x = -Math.PI / 2;
      circle.position.set(district.center.x, 0.05, district.center.z);
      this.scene.add(circle);
    }
  }

  private buildPlots(): void {
    for (const plot of PLOTS) {
      const school = SCHOOLS[plot.school];
      
      const plotGeom = new THREE.PlaneGeometry(plot.size.width, plot.size.depth);
      const plotMat = new THREE.MeshStandardMaterial({
        color: 0x5d8a5e,
        roughness: 0.8,
      });
      const plotMesh = new THREE.Mesh(plotGeom, plotMat);
      plotMesh.rotation.x = -Math.PI / 2;
      plotMesh.position.set(plot.center.x, 0.01, plot.center.z);
      plotMesh.receiveShadow = true;
      this.scene.add(plotMesh);

      const borderGeom = new THREE.EdgesGeometry(new THREE.BoxGeometry(plot.size.width, 0.5, plot.size.depth));
      const borderMat = new THREE.LineBasicMaterial({ color: school.colorHex, linewidth: 2 });
      const border = new THREE.LineSegments(borderGeom, borderMat);
      border.position.set(plot.center.x, 0.25, plot.center.z);
      this.scene.add(border);
    }
  }

  private buildProtectedAreas(): void {
    for (const area of PROTECTED_AREAS) {
      const color = area.school === 'neutral' ? 0xffffff : SCHOOLS[area.school].colorHex;
      
      const shieldGeom = new THREE.CylinderGeometry(area.radius, area.radius, 0.2, 32);
      const shieldMat = new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity: 0.3,
        emissive: color,
        emissiveIntensity: 0.2,
      });
      const shield = new THREE.Mesh(shieldGeom, shieldMat);
      shield.position.set(area.center.x, 0.1, area.center.z);
      this.scene.add(shield);

      const ringGeom = new THREE.TorusGeometry(area.radius, 0.2, 8, 32);
      const ringMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.5,
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(area.center.x, 0.2, area.center.z);
      this.scene.add(ring);
    }
  }

  private buildTownCenter(): void {
    const fountainGeom = new THREE.CylinderGeometry(4, 5, 1, 32);
    const fountainMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const fountain = new THREE.Mesh(fountainGeom, fountainMat);
    fountain.position.set(0, 0.5, 0);
    fountain.castShadow = true;
    this.scene.add(fountain);

    const waterGeom = new THREE.CylinderGeometry(3.5, 3.5, 0.5, 32);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x4fc3f7,
      transparent: true,
      opacity: 0.7,
    });
    const water = new THREE.Mesh(waterGeom, waterMat);
    water.position.set(0, 0.8, 0);
    this.scene.add(water);
  }

  private buildRoads(): void {
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x555555 });

    const mainRoadGeom = new THREE.PlaneGeometry(8, 300);
    const mainRoadNS = new THREE.Mesh(mainRoadGeom, roadMat);
    mainRoadNS.rotation.x = -Math.PI / 2;
    mainRoadNS.position.set(0, 0.02, 0);
    this.scene.add(mainRoadNS);

    const mainRoadEW = new THREE.Mesh(mainRoadGeom, roadMat);
    mainRoadEW.rotation.x = -Math.PI / 2;
    mainRoadEW.rotation.z = Math.PI / 2;
    mainRoadEW.position.set(0, 0.02, 0);
    this.scene.add(mainRoadEW);
  }

  private buildBanners(): void {
    for (const [schoolId, district] of Object.entries(DISTRICTS)) {
      const school = SCHOOLS[schoolId as SchoolId];
      const bannerGroup = new THREE.Group();

      const poleGeom = new THREE.CylinderGeometry(0.15, 0.15, 6, 8);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      const pole = new THREE.Mesh(poleGeom, poleMat);
      pole.position.y = 3;
      pole.castShadow = true;
      bannerGroup.add(pole);

      const flagGeom = new THREE.PlaneGeometry(3, 2);
      const flagMat = new THREE.MeshStandardMaterial({
        color: school.colorHex,
        side: THREE.DoubleSide,
      });
      const flag = new THREE.Mesh(flagGeom, flagMat);
      flag.position.set(1.5, 5, 0);
      flag.castShadow = true;
      bannerGroup.add(flag);

      bannerGroup.position.set(
        district.bannerLocation.x,
        0,
        district.bannerLocation.z
      );
      this.scene.add(bannerGroup);
      this.bannerMeshes.set(schoolId as SchoolId, bannerGroup);
    }
  }

  updateCampuses(campuses: Map<string, CampusState>): void {
    for (const [plotId, campus] of campuses) {
      for (const building of campus.buildings) {
        if (this.buildingMeshes.has(building.instanceId)) continue;

        const config = BUILDINGS[building.buildingId];
        if (!config) continue;

        const school = SCHOOLS[campus.school];
        const buildingGroup = this.createBuilding(config, school);
        buildingGroup.position.set(
          building.worldPosition.x,
          0,
          building.worldPosition.z
        );
        buildingGroup.rotation.y = building.rotation;
        this.scene.add(buildingGroup);
        this.buildingMeshes.set(building.instanceId, buildingGroup as unknown as THREE.Mesh);
      }

      for (const [padId, mesh] of this.purchasePadMeshes) {
        if (!campus.purchasePads.find(p => p.id === padId)) {
          this.scene.remove(mesh);
          this.purchasePadMeshes.delete(padId);
        }
      }

      for (const pad of campus.purchasePads) {
        if (this.purchasePadMeshes.has(pad.id)) continue;

        const padGroup = this.createPurchasePad(pad.buildingId, campus.school);
        padGroup.position.set(pad.position.x, 0, pad.position.z);
        this.scene.add(padGroup);
        this.purchasePadMeshes.set(pad.id, padGroup);
      }
    }
  }

  private createBuilding(config: typeof BUILDINGS[string], school: typeof SCHOOLS[SchoolId]): THREE.Group {
    const group = new THREE.Group();

    const baseGeom = new THREE.BoxGeometry(
      config.footprint.width,
      config.height,
      config.footprint.depth
    );
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.7,
    });
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = config.height / 2;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const roofGeom = new THREE.BoxGeometry(
      config.footprint.width + 0.2,
      0.3,
      config.footprint.depth + 0.2
    );
    const roofMat = new THREE.MeshStandardMaterial({
      color: school.colorHex,
      roughness: 0.5,
    });
    const roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.y = config.height + 0.15;
    roof.castShadow = true;
    group.add(roof);

    return group;
  }

  private createPurchasePad(buildingId: string, school: SchoolId): THREE.Group {
    const group = new THREE.Group();
    const schoolConfig = SCHOOLS[school];

    const padGeom = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 32);
    const padMat = new THREE.MeshStandardMaterial({
      color: schoolConfig.colorHex,
      emissive: schoolConfig.colorHex,
      emissiveIntensity: 0.3,
    });
    const pad = new THREE.Mesh(padGeom, padMat);
    pad.position.y = 0.1;
    group.add(pad);

    const ringGeom = new THREE.TorusGeometry(1.5, 0.1, 8, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.5,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.25;
    group.add(ring);

    return group;
  }

  addPlayer(player: PlayerState): void {
    const playerGroup = this.createPlayerMesh(player);
    playerGroup.position.set(player.position.x, 0, player.position.z);
    this.scene.add(playerGroup);
    this.playerMeshes.set(player.id, playerGroup);
  }

  removePlayer(playerId: string): void {
    const mesh = this.playerMeshes.get(playerId);
    if (mesh) {
      this.scene.remove(mesh);
      this.playerMeshes.delete(playerId);
    }
  }

  updatePlayer(player: PlayerState): void {
    let mesh = this.playerMeshes.get(player.id);
    if (!mesh) {
      mesh = this.createPlayerMesh(player);
      this.scene.add(mesh);
      this.playerMeshes.set(player.id, mesh);
    }

    mesh.position.set(player.position.x, 0, player.position.z);
    mesh.rotation.y = player.rotation;
    mesh.visible = player.isAlive;
  }

  private createPlayerMesh(player: PlayerState): THREE.Group {
    const group = new THREE.Group();
    
    const color = player.school ? SCHOOLS[player.school].colorHex : 0x888888;

    const bodyGeom = new THREE.CapsuleGeometry(0.4, 1, 8, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 1;
    body.castShadow = true;
    group.add(body);

    const headGeom = new THREE.SphereGeometry(0.35, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 1.85;
    head.castShadow = true;
    group.add(head);

    return group;
  }

  updateEntities(
    dt: number,
    players: Map<string, PlayerState>,
    npcs: Map<string, NPCState>,
    banners: Map<SchoolId, BannerState>
  ): void {
    for (const [id, player] of players) {
      this.updatePlayer(player);
    }

    for (const [id, npc] of npcs) {
      let mesh = this.npcMeshes.get(id);
      if (!mesh) {
        mesh = this.createNPCMesh(npc);
        this.scene.add(mesh);
        this.npcMeshes.set(id, mesh);
      }

      mesh.position.set(npc.position.x, 0, npc.position.z);
      mesh.rotation.y = npc.rotation;
      mesh.visible = npc.isAlive;
    }

    for (const [school, banner] of banners) {
      const mesh = this.bannerMeshes.get(school);
      if (mesh) {
        if (banner.carrierId) {
          mesh.visible = false;
        } else {
          mesh.visible = true;
          mesh.position.set(banner.position.x, 0, banner.position.z);
        }
      }
    }

    this.updateDamageTexts();
  }

  private createNPCMesh(npc: NPCState): THREE.Group {
    const group = new THREE.Group();
    const school = SCHOOLS[npc.school];
    const isPresident = npc.type === 'president';

    const bodyGeom = new THREE.CapsuleGeometry(
      isPresident ? 0.5 : 0.35,
      isPresident ? 1.2 : 0.8,
      8,
      16
    );
    const bodyMat = new THREE.MeshStandardMaterial({
      color: school.colorHex,
      emissive: school.colorHex,
      emissiveIntensity: isPresident ? 0.3 : 0.1,
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = isPresident ? 1.1 : 0.8;
    body.castShadow = true;
    group.add(body);

    const headGeom = new THREE.SphereGeometry(isPresident ? 0.4 : 0.3, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = isPresident ? 2.1 : 1.5;
    head.castShadow = true;
    group.add(head);

    return group;
  }

  showDamageEffect(targetId: string, damage: number): void {
    const mesh = this.playerMeshes.get(targetId) || this.npcMeshes.get(targetId);
    if (!mesh) return;

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#ff4444';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.textAlign = 'center';
    ctx.strokeText(`-${damage}`, 64, 48);
    ctx.fillText(`-${damage}`, 64, 48);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.copy(mesh.position);
    sprite.position.y += 2.5;
    sprite.scale.set(2, 1, 1);
    this.scene.add(sprite);

    this.damageTexts.push({
      mesh: sprite,
      endTime: Date.now() + 1000,
    });
  }

  private updateDamageTexts(): void {
    const now = Date.now();
    for (let i = this.damageTexts.length - 1; i >= 0; i--) {
      const text = this.damageTexts[i];
      if (now > text.endTime) {
        this.scene.remove(text.mesh);
        text.mesh.material.dispose();
        this.damageTexts.splice(i, 1);
      } else {
        text.mesh.position.y += 0.02;
        const alpha = (text.endTime - now) / 1000;
        (text.mesh.material as THREE.SpriteMaterial).opacity = alpha;
      }
    }
  }
}

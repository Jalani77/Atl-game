import * as THREE from 'three';
import { NetworkManager } from '../network/NetworkManager';
import { WorldRenderer } from '../rendering/WorldRenderer';
import { PlayerController } from '../controllers/PlayerController';
import { InputManager } from '../input/InputManager';
import { UIManager } from '../ui/UIManager';
import { CameraController } from '../controllers/CameraController';
import type {
  PlayerState,
  CampusState,
  NPCState,
  BannerState,
  RivalryScore,
  SchoolId,
} from '@campus-rivals/shared';
import { PLOTS, BUILDINGS, distance2D } from '@campus-rivals/shared';

export class Game {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  private network: NetworkManager;
  private world: WorldRenderer;
  private playerController: PlayerController;
  private cameraController: CameraController;
  private input: InputManager;
  private ui: UIManager;

  private isRunning = false;
  private lastTime = 0;
  private animationId = 0;

  private localPlayerId: string | null = null;
  private localPlayer: PlayerState | null = null;
  private players = new Map<string, PlayerState>();
  private campuses = new Map<string, CampusState>();
  private npcs = new Map<string, NPCState>();
  private banners = new Map<SchoolId, BannerState>();
  private rivalryScores: RivalryScore[] = [];

  private gamePhase: 'connecting' | 'naming' | 'school-select' | 'plot-select' | 'playing' = 'connecting';

  constructor(container: HTMLElement) {
    this.container = container;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xb7def2);
    this.scene.fog = new THREE.Fog(0xc5e6f2, 80, 220);

    this.camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      500
    );
    this.camera.position.set(0, 30, 30);
    this.camera.lookAt(0, 0, 0);

    this.network = new NetworkManager(this);
    this.world = new WorldRenderer(this.scene);
    this.input = new InputManager(container);
    this.playerController = new PlayerController(this, this.input);
    this.cameraController = new CameraController(this.camera, this.input, this.scene);
    this.ui = new UIManager(container, this);

    window.addEventListener('resize', this.onResize);
  }

  start(): void {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.network.connect();
    this.ui.showConnecting();
    this.animate();
  }

  private animate = (): void => {
    if (!this.isRunning) return;
    this.animationId = requestAnimationFrame(this.animate);

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.update(dt);
    this.render();
  };

  private update(dt: number): void {
    this.input.update();

    if (this.gamePhase === 'playing' && this.localPlayer) {
      this.playerController.update(dt);
      this.cameraController.update(dt, this.localPlayer.position);
      this.world.updateEntities(dt, this.players, this.npcs, this.banners);
    }

    this.ui.update(dt);
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  private onResize = (): void => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  onSocketConnected(): void {
    this.gamePhase = 'naming';
    this.ui.showNameInput();
  }

  onConnectionError(message: string): void {
    if (this.gamePhase === 'connecting' || this.gamePhase === 'naming') {
      this.ui.showConnectionError(message);
    }
  }

  retryConnection(): void {
    this.gamePhase = 'connecting';
    this.ui.showConnecting();
    this.network.connect();
  }

  onConnected(playerId: string, sessionToken: string): void {
    this.localPlayerId = playerId;
    localStorage.setItem('campus_rivals_session', sessionToken);
  }

  onGameState(state: {
    players: PlayerState[];
    campuses: CampusState[];
    npcs: NPCState[];
    banners: BannerState[];
    rivalryScores: RivalryScore[];
  }): void {
    for (const player of state.players) {
      this.players.set(player.id, player);
      if (player.id === this.localPlayerId) {
        this.localPlayer = player;
      }
    }

    for (const campus of state.campuses) {
      this.campuses.set(campus.plotId, campus);
    }

    for (const npc of state.npcs) {
      this.npcs.set(npc.id, npc);
    }

    for (const banner of state.banners) {
      this.banners.set(banner.school, banner);
    }

    this.rivalryScores = state.rivalryScores;

    this.world.buildWorld();
    this.world.updateCampuses(this.campuses);

    if (this.localPlayer) {
      if (!this.localPlayer.school) {
        this.gamePhase = 'school-select';
        this.ui.showSchoolSelect();
      } else if (!this.localPlayer.plotId) {
        this.gamePhase = 'plot-select';
        this.ui.showPlotSelect(this.localPlayer.school, this.campuses);
      } else {
        this.gamePhase = 'playing';
        this.ui.showGameHUD();
      }
    }
  }

  onPlayerJoined(player: PlayerState): void {
    this.players.set(player.id, player);
    this.world.addPlayer(player);
  }

  onPlayerLeft(playerId: string): void {
    this.players.delete(playerId);
    this.world.removePlayer(playerId);
  }

  onPlayerUpdate(updates: Partial<PlayerState>[]): void {
    for (const update of updates) {
      if (!update.id) continue;
      const player = this.players.get(update.id);
      if (player) {
        Object.assign(player, update);
        this.world.updatePlayer(player);
      }
    }
  }

  onSchoolSelected(playerId: string, school: SchoolId): void {
    const player = this.players.get(playerId);
    if (player) {
      player.school = school;
    }
    if (playerId === this.localPlayerId && this.localPlayer) {
      this.localPlayer.school = school;
      this.gamePhase = 'plot-select';
      this.ui.showPlotSelect(school, this.campuses);
    }
  }

  onPlotClaimed(playerId: string, plotId: string, campus: CampusState): void {
    const player = this.players.get(playerId);
    if (player) {
      player.plotId = plotId;
    }
    this.campuses.set(plotId, campus);
    this.world.updateCampuses(this.campuses);

    if (playerId === this.localPlayerId && this.localPlayer) {
      this.localPlayer.plotId = plotId;
      this.gamePhase = 'playing';
      const plot = PLOTS.find((item) => item.id === plotId);
      if (plot) {
        this.input.aimAt(plot.center.x - this.localPlayer.position.x, plot.center.z - this.localPlayer.position.z);
      }
      this.ui.showGameHUD();
    }
  }

  onBuildingPurchased(building: any, pads: any): void {
    const campus = this.campuses.get(building.plotId);
    if (campus) {
      campus.buildings.push(building);
      const padIdx = campus.purchasePads.findIndex(p => p.id === pads.removed);
      if (padIdx >= 0) campus.purchasePads.splice(padIdx, 1);
      for (const newPad of pads.added) {
        campus.purchasePads.push({ ...newPad, isActive: true, plotId: building.plotId });
      }
      this.world.updateCampuses(this.campuses);
    }
  }

  onCashUpdate(playerId: string, cash: number, income: number): void {
    const player = this.players.get(playerId);
    if (player) {
      player.cash = cash;
    }
    if (playerId === this.localPlayerId) {
      this.ui.updateCash(cash, income);
    }
  }

  onSpiritUpdate(playerId: string, spirit: number): void {
    const player = this.players.get(playerId);
    if (player) {
      player.spirit = spirit;
    }
    if (playerId === this.localPlayerId) {
      this.ui.updateSpirit(spirit);
    }
  }

  onDamage(targetId: string, damage: number, health: number, attackerId: string): void {
    const player = this.players.get(targetId);
    if (player) {
      player.health = health;
    }
    const npc = this.npcs.get(targetId);
    if (npc) {
      npc.health = health;
    }
    this.world.showDamageEffect(targetId, damage);

    if (targetId === this.localPlayerId) {
      this.ui.updateHealth(health);
    }
  }

  onKnockout(targetId: string, attackerId: string, targetType: string): void {
    if (targetType === 'player') {
      const player = this.players.get(targetId);
      if (player) {
        player.isAlive = false;
        player.health = 0;
      }
    } else {
      const npc = this.npcs.get(targetId);
      if (npc) {
        npc.isAlive = false;
        npc.health = 0;
      }
    }

    if (targetId === this.localPlayerId) {
      this.ui.showKnockout();
    }
  }

  onRespawned(entityId: string, position: any, entityType: string): void {
    if (entityType === 'player') {
      const player = this.players.get(entityId);
      if (player) {
        player.isAlive = true;
        player.health = player.maxHealth;
        player.position = position;
      }
      if (entityId === this.localPlayerId) {
        this.ui.hideKnockout();
      }
    } else {
      const npc = this.npcs.get(entityId);
      if (npc) {
        npc.isAlive = true;
        npc.health = npc.maxHealth;
        npc.position = position;
      }
    }
  }

  onNPCUpdate(npcs: NPCState[]): void {
    for (const npc of npcs) {
      this.npcs.set(npc.id, npc);
    }
  }

  onBannerUpdate(banners: BannerState[]): void {
    for (const banner of banners) {
      this.banners.set(banner.school, banner);
    }
  }

  onRivalryUpdate(scores: RivalryScore[]): void {
    this.rivalryScores = scores;
    this.ui.updateRivalryScores(scores);
  }

  onError(code: string, message: string): void {
    this.ui.showError(message);
  }

  submitName(name: string): void {
    const session = localStorage.getItem('campus_rivals_session');
    this.network.send({ type: 'join', name, sessionToken: session || undefined });
  }

  selectSchool(school: SchoolId): void {
    this.network.send({ type: 'selectSchool', school });
  }

  claimPlot(plotId: string): void {
    this.network.send({ type: 'claimPlot', plotId });
  }

  sendInput(input: any, sequence: number): void {
    this.network.send({ type: 'input', input, sequence });
  }

  sendPurchase(buildingId: string, padId: string): void {
    this.network.send({ type: 'purchase', buildingId, padId });
  }

  sendAttack(targetId: string, weaponId: string): void {
    if (this.localPlayerId) this.world.playAttack(this.localPlayerId);
    this.network.send({ type: 'attack', targetId, weaponId });
  }

  getDashCooldown(): number {
    return this.playerController.getDashCooldownPercent();
  }

  setQuality(level: 'low' | 'high'): void {
    this.world.setQuality(level);
    this.renderer.shadowMap.enabled = level === 'high';
    this.renderer.setPixelRatio(level === 'high' ? Math.min(window.devicePixelRatio, 2) : 1);
  }

  nearestPurchase(): { name: string; price: number; distance: number } | null {
    const player = this.localPlayer;
    if (!player?.plotId) return null;
    const campus = this.campuses.get(player.plotId);
    if (!campus) return null;
    let best: { name: string; price: number; distance: number } | null = null;
    for (const pad of campus.purchasePads) {
      const distance = distance2D(player.position, pad.position);
      if (!best || distance < best.distance) {
        const config = BUILDINGS[pad.buildingId];
        best = { name: config?.name ?? pad.buildingId, price: config?.basePrice ?? 0, distance };
      }
    }
    return best;
  }

  sendRespawn(): void {
    this.network.send({ type: 'respawn' });
  }

  getLocalPlayer(): PlayerState | null {
    return this.localPlayer;
  }

  getPlayers(): Map<string, PlayerState> {
    return this.players;
  }

  getNPCs(): Map<string, NPCState> {
    return this.npcs;
  }

  getCampuses(): Map<string, CampusState> {
    return this.campuses;
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  dispose(): void {
    this.isRunning = false;
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onResize);
    this.network.disconnect();
    this.input.dispose();
    this.renderer.dispose();
  }
}

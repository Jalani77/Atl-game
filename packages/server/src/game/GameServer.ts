import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import type { Database } from '../services/Database.js';
import type {
  SchoolId,
  PlayerState,
  PlayerInput,
  ClientMessage,
  ServerMessage,
  GameSnapshot,
  CampusState,
  PlacedBuilding,
  NPCState,
  BannerState,
  RivalryScore,
  Vec3,
  SCHOOLS,
  PLOTS,
  BUILDINGS,
  WEAPONS,
  DISTRICTS,
  PROTECTED_AREAS,
  BANNER_RETURN_LOCATIONS,
  STARTING_CASH,
  INCOME_INTERVAL_MS,
  PLAYER_MAX_HEALTH,
  RESPAWN_TIME_MS,
  SPAWN_PROTECTION_MS,
} from '@campus-rivals/shared';
import {
  SCHOOLS as SchoolsConfig,
  PLOTS as PlotsConfig,
  BUILDINGS as BuildingsConfig,
  WEAPONS as WeaponsConfig,
  DISTRICTS as DistrictsConfig,
  PROTECTED_AREAS as ProtectedAreasConfig,
  BANNER_RETURN_LOCATIONS as BannerReturnConfig,
  STARTING_CASH as StartingCash,
  INCOME_INTERVAL_MS as IncomeInterval,
  PLAYER_MAX_HEALTH as MaxHealth,
  RESPAWN_TIME_MS as RespawnTime,
  SPAWN_PROTECTION_MS as SpawnProtection,
  SCHOOL_IDS,
  GRID_SIZE,
  distance2D,
  pointInCircle,
  pointInRect,
  generateId,
  snapToGrid,
} from '@campus-rivals/shared';
import { EconomyService } from '../services/EconomyService.js';
import { CombatService } from '../services/CombatService.js';
import { PlotService } from '../services/PlotService.js';
import { NPCService } from '../services/NPCService.js';

const TICK_RATE = 20;
const TICK_MS = 1000 / TICK_RATE;
const SNAPSHOT_RATE = 10;
const SNAPSHOT_MS = 1000 / SNAPSHOT_RATE;

export class GameServer {
  private io: Server;
  private db: Database;
  
  private players = new Map<string, PlayerState>();
  private socketToPlayer = new Map<string, string>();
  private playerToSocket = new Map<string, string>();
  
  private campuses = new Map<string, CampusState>();
  private plotOwners = new Map<string, string>();
  
  private npcs = new Map<string, NPCState>();
  private banners = new Map<SchoolId, BannerState>();
  private rivalryScores = new Map<SchoolId, RivalryScore>();
  
  private economyService: EconomyService;
  private combatService: CombatService;
  private plotService: PlotService;
  private npcService: NPCService;
  
  private tickInterval?: ReturnType<typeof setInterval>;
  private snapshotInterval?: ReturnType<typeof setInterval>;
  private incomeInterval?: ReturnType<typeof setInterval>;
  
  private lastTickTime = Date.now();
  private inputSequences = new Map<string, number>();
  private rewardCooldowns = new Map<string, Map<string, number>>();

  constructor(io: Server, db: Database) {
    this.io = io;
    this.db = db;
    
    this.economyService = new EconomyService(this);
    this.combatService = new CombatService(this);
    this.plotService = new PlotService(this);
    this.npcService = new NPCService(this);
    
    this.initializeBanners();
    this.initializeRivalryScores();
    this.setupSocketHandlers();
  }

  private initializeBanners(): void {
    for (const schoolId of SCHOOL_IDS) {
      const district = DistrictsConfig[schoolId];
      this.banners.set(schoolId, {
        school: schoolId,
        position: { ...district.bannerLocation },
        isAtBase: true,
        carrierId: null,
        lastDropTime: 0,
      });
    }
  }

  private initializeRivalryScores(): void {
    for (const schoolId of SCHOOL_IDS) {
      this.rivalryScores.set(schoolId, {
        school: schoolId,
        playerKills: 0,
        npcKills: 0,
        presidentKills: 0,
        bannerCaptures: 0,
        totalSpirit: 0,
      });
    }
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      
      socket.on('message', (msg: ClientMessage) => {
        this.handleMessage(socket, msg);
      });
      
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private handleMessage(socket: Socket, msg: ClientMessage): void {
    try {
      switch (msg.type) {
        case 'join':
          this.handleJoin(socket, msg.name, msg.sessionToken);
          break;
        case 'selectSchool':
          this.handleSelectSchool(socket, msg.school);
          break;
        case 'claimPlot':
          this.handleClaimPlot(socket, msg.plotId);
          break;
        case 'input':
          this.handleInput(socket, msg.input, msg.sequence);
          break;
        case 'purchase':
          this.handlePurchase(socket, msg.buildingId, msg.padId);
          break;
        case 'placeBuilding':
          this.handlePlaceBuilding(socket, msg.instanceId, msg.relativeX, msg.relativeZ, msg.rotation);
          break;
        case 'attack':
          this.handleAttack(socket, msg.targetId, msg.weaponId);
          break;
        case 'respawn':
          this.handleRespawn(socket);
          break;
        case 'ping':
          this.send(socket, { type: 'pong', serverTime: Date.now() });
          break;
      }
    } catch (err) {
      console.error('Error handling message:', err);
      this.send(socket, { type: 'error', code: 'INTERNAL', message: 'Server error' });
    }
  }

  private handleJoin(socket: Socket, name: string, sessionToken?: string): void {
    let playerId: string;
    let newToken: string;
    let saveData = sessionToken ? this.db.getPlayerBySession(sessionToken) : null;
    
    if (saveData) {
      playerId = saveData.id;
      newToken = sessionToken!;
      console.log(`Player reconnected: ${name} (${playerId})`);
    } else {
      playerId = uuidv4();
      newToken = uuidv4();
      saveData = this.db.createPlayer(playerId, newToken, name);
      console.log(`New player: ${name} (${playerId})`);
    }
    
    const spawnPos = { x: 0, y: 0, z: 0 };
    
    const player: PlayerState = {
      id: playerId,
      name: saveData.name,
      school: saveData.school || null,
      plotId: null,
      position: spawnPos,
      rotation: 0,
      velocity: { x: 0, y: 0, z: 0 },
      health: MaxHealth,
      maxHealth: MaxHealth,
      cash: saveData.cash,
      spirit: saveData.spirit,
      isAlive: true,
      spawnProtectionUntil: Date.now() + SpawnProtection,
      lastDashTime: 0,
      equippedWeapon: 'foam_baton',
      unlockedWeapons: saveData.unlockedWeapons,
      carryingBanner: null,
    };
    
    this.players.set(playerId, player);
    this.socketToPlayer.set(socket.id, playerId);
    this.playerToSocket.set(playerId, socket.id);
    this.inputSequences.set(playerId, 0);
    this.rewardCooldowns.set(playerId, new Map());
    
    this.send(socket, { type: 'welcome', playerId, sessionToken: newToken });
    this.send(socket, { type: 'gameState', state: this.getGameSnapshot() });
    
    this.broadcast({ type: 'playerJoined', player }, socket.id);
    
    if (saveData.school && saveData.buildings.length > 0) {
      this.restorePlayerCampus(player, saveData);
    }
  }

  private restorePlayerCampus(player: PlayerState, saveData: any): void {
    const availablePlot = PlotsConfig.find(p => 
      p.school === saveData.school && !this.plotOwners.has(p.id)
    );
    
    if (availablePlot) {
      player.school = saveData.school;
      player.plotId = availablePlot.id;
      this.plotOwners.set(availablePlot.id, player.id);
      
      const campus = this.plotService.createCampus(availablePlot, player.id, saveData);
      this.campuses.set(availablePlot.id, campus);
      
      const socketId = this.playerToSocket.get(player.id);
      if (socketId) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          this.send(socket, { 
            type: 'plotClaimed', 
            playerId: player.id, 
            plotId: availablePlot.id,
            campus 
          });
        }
      }
    }
  }

  private handleSelectSchool(socket: Socket, school: SchoolId): void {
    const playerId = this.socketToPlayer.get(socket.id);
    if (!playerId) return;
    
    const player = this.players.get(playerId);
    if (!player || player.school) {
      this.send(socket, { type: 'error', code: 'INVALID_STATE', message: 'Already have a school' });
      return;
    }
    
    if (!SCHOOL_IDS.includes(school)) {
      this.send(socket, { type: 'error', code: 'INVALID_SCHOOL', message: 'Invalid school' });
      return;
    }
    
    const schoolPlots = PlotsConfig.filter(p => p.school === school);
    const availablePlots = schoolPlots.filter(p => !this.plotOwners.has(p.id));
    
    if (availablePlots.length === 0) {
      this.send(socket, { type: 'error', code: 'SCHOOL_FULL', message: 'School is full' });
      return;
    }
    
    player.school = school;
    this.db.updatePlayerSchool(playerId, school);
    
    const spawnPoint = DistrictsConfig[school].spawnPoint;
    player.position = { ...spawnPoint };
    player.spawnProtectionUntil = Date.now() + SpawnProtection;
    
    this.broadcast({ type: 'schoolSelected', playerId, school });
  }

  private handleClaimPlot(socket: Socket, plotId: string): void {
    const playerId = this.socketToPlayer.get(socket.id);
    if (!playerId) return;
    
    const player = this.players.get(playerId);
    if (!player || !player.school || player.plotId) {
      this.send(socket, { type: 'error', code: 'INVALID_STATE', message: 'Cannot claim plot' });
      return;
    }
    
    const plot = PlotsConfig.find(p => p.id === plotId);
    if (!plot || plot.school !== player.school) {
      this.send(socket, { type: 'error', code: 'INVALID_PLOT', message: 'Invalid plot for your school' });
      return;
    }
    
    if (this.plotOwners.has(plotId)) {
      this.send(socket, { type: 'error', code: 'PLOT_TAKEN', message: 'Plot already claimed' });
      return;
    }
    
    player.plotId = plotId;
    this.plotOwners.set(plotId, playerId);
    
    const campus = this.plotService.createCampus(plot, playerId);
    this.campuses.set(plotId, campus);
    
    this.npcService.spawnDefendersForPlot(plotId, player.school);
    
    this.broadcast({ type: 'plotClaimed', playerId, plotId, campus });
  }

  private handleInput(socket: Socket, input: PlayerInput, sequence: number): void {
    const playerId = this.socketToPlayer.get(socket.id);
    if (!playerId) return;
    
    const player = this.players.get(playerId);
    if (!player || !player.isAlive) return;
    
    const lastSeq = this.inputSequences.get(playerId) || 0;
    if (sequence <= lastSeq) return;
    this.inputSequences.set(playerId, sequence);
    
    this.processPlayerInput(player, input);
  }

  private processPlayerInput(player: PlayerState, input: PlayerInput): void {
    const speed = 8;
    const dt = TICK_MS / 1000;
    
    let moveX = input.moveX;
    let moveZ = input.moveZ;
    const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (len > 1) {
      moveX /= len;
      moveZ /= len;
    }
    
    player.velocity.x = moveX * speed;
    player.velocity.z = moveZ * speed;
    player.rotation = input.rotation;
    
    player.position.x += player.velocity.x * dt;
    player.position.z += player.velocity.z * dt;
    
    player.position.x = Math.max(-150, Math.min(150, player.position.x));
    player.position.z = Math.max(-150, Math.min(150, player.position.z));
    
    if (player.carryingBanner) {
      const banner = this.banners.get(player.carryingBanner);
      if (banner) {
        banner.position = { ...player.position };
      }
      
      const returnLoc = BannerReturnConfig[player.school!];
      if (returnLoc && distance2D(player.position, returnLoc) < 5) {
        this.captureBanner(player);
      }
    }
  }

  private handlePurchase(socket: Socket, buildingId: string, padId: string): void {
    const playerId = this.socketToPlayer.get(socket.id);
    if (!playerId) return;
    
    const player = this.players.get(playerId);
    if (!player || !player.plotId) return;
    
    const campus = this.campuses.get(player.plotId);
    if (!campus) return;
    
    const result = this.economyService.purchaseBuilding(player, campus, buildingId, padId);
    if (!result.success) {
      this.send(socket, { type: 'error', code: 'PURCHASE_FAILED', message: result.error || 'Purchase failed' });
      return;
    }
    
    this.broadcast({
      type: 'buildingPurchased',
      building: result.building!,
      pads: result.pads!,
    });
    
    this.send(socket, { type: 'cashUpdate', playerId, cash: player.cash, income: campus.totalIncome });
  }

  private handlePlaceBuilding(
    socket: Socket, 
    instanceId: string, 
    relativeX: number, 
    relativeZ: number, 
    rotation: number
  ): void {
    const playerId = this.socketToPlayer.get(socket.id);
    if (!playerId) return;
    
    const player = this.players.get(playerId);
    if (!player || !player.plotId) return;
    
    const campus = this.campuses.get(player.plotId);
    if (!campus) return;
    
    const building = campus.buildings.find(b => b.instanceId === instanceId);
    if (!building || building.ownerId !== playerId) {
      this.send(socket, { type: 'error', code: 'INVALID_BUILDING', message: 'Cannot place this building' });
      return;
    }
    
    const plot = PlotsConfig.find(p => p.id === player.plotId);
    if (!plot) return;
    
    const snappedX = snapToGrid(relativeX, GRID_SIZE);
    const snappedZ = snapToGrid(relativeZ, GRID_SIZE);
    
    const buildingConfig = BuildingsConfig[building.buildingId];
    const halfW = buildingConfig.footprint.width / 2;
    const halfD = buildingConfig.footprint.depth / 2;
    const plotHalfW = plot.size.width / 2;
    const plotHalfD = plot.size.depth / 2;
    
    if (Math.abs(snappedX) + halfW > plotHalfW || Math.abs(snappedZ) + halfD > plotHalfD) {
      this.send(socket, { type: 'error', code: 'OUT_OF_BOUNDS', message: 'Building out of plot bounds' });
      return;
    }
    
    building.relativePosition = { x: snappedX, z: snappedZ };
    building.rotation = rotation;
    building.worldPosition = {
      x: plot.center.x + snappedX,
      y: 0,
      z: plot.center.z + snappedZ,
    };
    
    this.economyService.savePlayerBuildings(player, campus);
    
    this.broadcast({ type: 'buildingPlaced', building });
  }

  private handleAttack(socket: Socket, targetId: string, weaponId: string): void {
    const playerId = this.socketToPlayer.get(socket.id);
    if (!playerId) return;
    
    const player = this.players.get(playerId);
    if (!player || !player.isAlive) return;
    
    const result = this.combatService.processAttack(player, targetId, weaponId);
    if (!result.success) return;
    
    if (player.spawnProtectionUntil > Date.now()) {
      player.spawnProtectionUntil = 0;
    }
    
    if (result.damage) {
      this.broadcast({
        type: 'damage',
        targetId,
        damage: result.damage.amount,
        health: result.damage.remainingHealth,
        attackerId: playerId,
      });
    }
    
    if (result.knockout) {
      this.broadcast({
        type: 'knockout',
        targetId,
        attackerId: playerId,
        targetType: result.knockout.targetType,
      });
      
      if (result.knockout.spiritReward > 0) {
        player.spirit += result.knockout.spiritReward;
        this.db.updatePlayerSpirit(playerId, player.spirit);
        this.send(socket, { type: 'spiritUpdate', playerId, spirit: player.spirit });
        
        const score = this.rivalryScores.get(player.school!);
        if (score) {
          if (result.knockout.targetType === 'player') score.playerKills++;
          else if (result.knockout.targetType === 'npc') score.npcKills++;
          score.totalSpirit += result.knockout.spiritReward;
        }
      }
    }
  }

  private handleRespawn(socket: Socket): void {
    const playerId = this.socketToPlayer.get(socket.id);
    if (!playerId) return;
    
    const player = this.players.get(playerId);
    if (!player || player.isAlive) return;
    
    if (!player.school) return;
    
    const spawnPoint = DistrictsConfig[player.school].spawnPoint;
    player.position = { ...spawnPoint };
    player.health = player.maxHealth;
    player.isAlive = true;
    player.spawnProtectionUntil = Date.now() + SpawnProtection;
    player.carryingBanner = null;
    
    this.broadcast({
      type: 'respawned',
      entityId: playerId,
      position: player.position,
      entityType: 'player',
    });
  }

  private captureBanner(player: PlayerState): void {
    if (!player.carryingBanner || !player.school) return;
    
    const capturedSchool = player.carryingBanner;
    const banner = this.banners.get(capturedSchool);
    if (!banner) return;
    
    const spiritReward = 50;
    player.spirit += spiritReward;
    this.db.updatePlayerSpirit(player.id, player.spirit);
    
    const score = this.rivalryScores.get(player.school);
    if (score) {
      score.bannerCaptures++;
      score.totalSpirit += spiritReward;
    }
    
    banner.position = { ...DistrictsConfig[capturedSchool].bannerLocation };
    banner.isAtBase = true;
    banner.carrierId = null;
    player.carryingBanner = null;
    
    this.broadcast({
      type: 'bannerCaptured',
      school: capturedSchool,
      capturerId: player.id,
      spiritAwarded: spiritReward,
    });
    
    this.broadcast({ type: 'bannerUpdate', banners: Array.from(this.banners.values()) });
  }

  private handleDisconnect(socket: Socket): void {
    const playerId = this.socketToPlayer.get(socket.id);
    if (!playerId) return;
    
    const player = this.players.get(playerId);
    if (player) {
      if (player.plotId) {
        const campus = this.campuses.get(player.plotId);
        if (campus) {
          this.economyService.savePlayerBuildings(player, campus);
        }
      }
      
      if (player.carryingBanner) {
        const banner = this.banners.get(player.carryingBanner);
        if (banner) {
          banner.carrierId = null;
          banner.lastDropTime = Date.now();
        }
      }
    }
    
    setTimeout(() => {
      const stillDisconnected = !this.playerToSocket.has(playerId) || 
        this.playerToSocket.get(playerId) !== socket.id;
      
      if (stillDisconnected && this.socketToPlayer.get(socket.id) === playerId) {
        this.cleanupPlayer(playerId);
      }
    }, 30000);
    
    this.socketToPlayer.delete(socket.id);
    this.playerToSocket.delete(playerId);
    
    console.log(`Player disconnected: ${playerId}`);
    this.broadcast({ type: 'playerLeft', playerId });
  }

  private cleanupPlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (player?.plotId) {
      this.plotOwners.delete(player.plotId);
      this.campuses.delete(player.plotId);
      this.npcService.removeDefendersForPlot(player.plotId);
    }
    
    this.players.delete(playerId);
    this.inputSequences.delete(playerId);
    this.rewardCooldowns.delete(playerId);
  }

  start(): void {
    this.tickInterval = setInterval(() => this.tick(), TICK_MS);
    this.snapshotInterval = setInterval(() => this.sendSnapshots(), SNAPSHOT_MS);
    this.incomeInterval = setInterval(() => this.processIncome(), IncomeInterval);
    console.log('Game server started');
  }

  private tick(): void {
    const now = Date.now();
    const dt = (now - this.lastTickTime) / 1000;
    this.lastTickTime = now;
    
    this.npcService.update(dt);
    
    for (const [school, banner] of this.banners) {
      if (!banner.isAtBase && !banner.carrierId) {
        if (now - banner.lastDropTime > 30000) {
          banner.position = { ...DistrictsConfig[school].bannerLocation };
          banner.isAtBase = true;
        }
      }
    }
  }

  private sendSnapshots(): void {
    const playerUpdates: Partial<PlayerState>[] = [];
    
    for (const player of this.players.values()) {
      playerUpdates.push({
        id: player.id,
        position: player.position,
        rotation: player.rotation,
        health: player.health,
        isAlive: player.isAlive,
        carryingBanner: player.carryingBanner,
      });
    }
    
    if (playerUpdates.length > 0) {
      this.broadcast({ type: 'playerUpdate', players: playerUpdates });
    }
    
    const npcStates = Array.from(this.npcs.values());
    if (npcStates.length > 0) {
      this.broadcast({ type: 'npcUpdate', npcs: npcStates });
    }
  }

  private processIncome(): void {
    for (const player of this.players.values()) {
      if (!player.plotId) continue;
      
      const campus = this.campuses.get(player.plotId);
      if (!campus || campus.totalIncome <= 0) continue;
      
      player.cash += campus.totalIncome;
      this.db.updatePlayerCash(player.id, player.cash);
      
      const socketId = this.playerToSocket.get(player.id);
      if (socketId) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          this.send(socket, {
            type: 'cashUpdate',
            playerId: player.id,
            cash: player.cash,
            income: campus.totalIncome,
          });
        }
      }
    }
  }

  private getGameSnapshot(): GameSnapshot {
    return {
      players: Array.from(this.players.values()),
      campuses: Array.from(this.campuses.values()),
      npcs: Array.from(this.npcs.values()),
      banners: Array.from(this.banners.values()),
      rivalryScores: Array.from(this.rivalryScores.values()),
      serverTime: Date.now(),
    };
  }

  private send(socket: Socket, msg: ServerMessage): void {
    socket.emit('message', msg);
  }

  private broadcast(msg: ServerMessage, excludeSocketId?: string): void {
    if (excludeSocketId) {
      this.io.sockets.sockets.forEach((socket) => {
        if (socket.id !== excludeSocketId) {
          socket.emit('message', msg);
        }
      });
    } else {
      this.io.emit('message', msg);
    }
  }

  getPlayer(id: string): PlayerState | undefined {
    return this.players.get(id);
  }

  getNPC(id: string): NPCState | undefined {
    return this.npcs.get(id);
  }

  setNPC(id: string, npc: NPCState): void {
    this.npcs.set(id, npc);
  }

  removeNPC(id: string): void {
    this.npcs.delete(id);
  }

  getPlayers(): Map<string, PlayerState> {
    return this.players;
  }

  getNPCs(): Map<string, NPCState> {
    return this.npcs;
  }

  getCampus(plotId: string): CampusState | undefined {
    return this.campuses.get(plotId);
  }

  getRewardCooldown(playerId: string, targetId: string): number {
    return this.rewardCooldowns.get(playerId)?.get(targetId) || 0;
  }

  setRewardCooldown(playerId: string, targetId: string, until: number): void {
    let playerCooldowns = this.rewardCooldowns.get(playerId);
    if (!playerCooldowns) {
      playerCooldowns = new Map();
      this.rewardCooldowns.set(playerId, playerCooldowns);
    }
    playerCooldowns.set(targetId, until);
  }

  isInProtectedArea(pos: Vec3, school: SchoolId | null): boolean {
    for (const area of ProtectedAreasConfig) {
      if (pointInCircle(pos, area.center, area.radius)) {
        if (area.school === 'neutral' || area.school === school) {
          return true;
        }
      }
    }
    return false;
  }

  async shutdown(): Promise<void> {
    if (this.tickInterval) clearInterval(this.tickInterval);
    if (this.snapshotInterval) clearInterval(this.snapshotInterval);
    if (this.incomeInterval) clearInterval(this.incomeInterval);
    
    for (const player of this.players.values()) {
      if (player.plotId) {
        const campus = this.campuses.get(player.plotId);
        if (campus) {
          this.economyService.savePlayerBuildings(player, campus);
        }
      }
    }
    
    this.io.close();
    console.log('Game server shut down');
  }
}

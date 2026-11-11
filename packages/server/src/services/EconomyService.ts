import type { GameServer } from '../game/GameServer.js';
import type {
  PlayerState,
  CampusState,
  PlacedBuilding,
  PurchasePad,
  SavedBuilding,
} from '@campus-rivals/shared';
import {
  BUILDINGS,
  PLOTS,
  generateId,
} from '@campus-rivals/shared';

interface PurchaseResult {
  success: boolean;
  error?: string;
  building?: PlacedBuilding;
  pads?: { removed: string; added: { id: string; buildingId: string; position: { x: number; y: number; z: number } }[] };
}

export class EconomyService {
  private gameServer: GameServer;
  private db: any;

  constructor(gameServer: GameServer) {
    this.gameServer = gameServer;
    this.db = (gameServer as any).db;
  }

  purchaseBuilding(
    player: PlayerState,
    campus: CampusState,
    buildingId: string,
    padId: string
  ): PurchaseResult {
    const buildingConfig = BUILDINGS[buildingId];
    if (!buildingConfig) {
      return { success: false, error: 'Invalid building' };
    }

    const pad = campus.purchasePads.find(p => p.id === padId && p.buildingId === buildingId);
    if (!pad || !pad.isActive) {
      return { success: false, error: 'Invalid or inactive purchase pad' };
    }

    if (player.cash < buildingConfig.basePrice) {
      return { success: false, error: 'Insufficient funds' };
    }

    for (const prereq of buildingConfig.prerequisites) {
      const hasPrereq = campus.buildings.some(b => b.buildingId === prereq);
      if (!hasPrereq) {
        return { success: false, error: `Requires ${BUILDINGS[prereq]?.name || prereq}` };
      }
    }

    const existing = campus.buildings.find(b => b.buildingId === buildingId);
    if (existing) {
      return { success: false, error: 'Building already purchased' };
    }

    player.cash -= buildingConfig.basePrice;
    this.db.updatePlayerCash(player.id, player.cash);

    const plot = PLOTS.find(p => p.id === campus.plotId);
    if (!plot) {
      return { success: false, error: 'Plot not found' };
    }

    const building: PlacedBuilding = {
      instanceId: generateId(),
      buildingId,
      ownerId: player.id,
      plotId: campus.plotId,
      level: 1,
      worldPosition: { ...pad.position },
      relativePosition: { 
        x: pad.position.x - plot.center.x, 
        z: pad.position.z - plot.center.z 
      },
      rotation: 0,
    };

    campus.buildings.push(building);
    campus.totalIncome += buildingConfig.baseIncome;
    campus.totalCapacity += buildingConfig.baseCapacity;

    const padIndex = campus.purchasePads.findIndex(p => p.id === padId);
    campus.purchasePads.splice(padIndex, 1);

    const newPads = this.generateNextPads(campus, buildingId, plot);
    campus.purchasePads.push(...newPads);

    this.savePlayerBuildings(player, campus);

    return {
      success: true,
      building,
      pads: {
        removed: padId,
        added: newPads.map(p => ({
          id: p.id,
          buildingId: p.buildingId,
          position: p.position,
        })),
      },
    };
  }

  private generateNextPads(
    campus: CampusState,
    purchasedBuildingId: string,
    plot: typeof PLOTS[0]
  ): PurchasePad[] {
    const newPads: PurchasePad[] = [];
    const ownedIds = new Set(campus.buildings.map(b => b.buildingId));
    const existingPadBuildings = new Set(campus.purchasePads.map(p => p.buildingId));

    for (const [id, config] of Object.entries(BUILDINGS)) {
      if (ownedIds.has(id) || existingPadBuildings.has(id)) continue;
      
      const prereqsMet = config.prerequisites.every(p => ownedIds.has(p));
      if (!prereqsMet) continue;

      const padPos = this.findPadPosition(campus, plot, config.footprint);
      if (padPos) {
        newPads.push({
          id: generateId(),
          buildingId: id,
          plotId: campus.plotId,
          position: padPos,
          isActive: true,
        });
      }
    }

    return newPads;
  }

  private findPadPosition(
    campus: CampusState,
    plot: typeof PLOTS[0],
    footprint: { width: number; depth: number }
  ): { x: number; y: number; z: number } | null {
    const gridSize = 2;
    const halfPlotW = plot.size.width / 2 - 2;
    const halfPlotD = plot.size.depth / 2 - 2;

    for (let attempts = 0; attempts < 20; attempts++) {
      const x = plot.center.x + (Math.random() * 2 - 1) * halfPlotW;
      const z = plot.center.z + (Math.random() * 2 - 1) * halfPlotD;
      
      const snappedX = Math.round(x / gridSize) * gridSize;
      const snappedZ = Math.round(z / gridSize) * gridSize;

      let valid = true;
      for (const building of campus.buildings) {
        const bConfig = BUILDINGS[building.buildingId];
        const dist = Math.sqrt(
          Math.pow(snappedX - building.worldPosition.x, 2) +
          Math.pow(snappedZ - building.worldPosition.z, 2)
        );
        if (dist < (bConfig.footprint.width + footprint.width) / 2 + 1) {
          valid = false;
          break;
        }
      }

      for (const pad of campus.purchasePads) {
        const dist = Math.sqrt(
          Math.pow(snappedX - pad.position.x, 2) +
          Math.pow(snappedZ - pad.position.z, 2)
        );
        if (dist < 3) {
          valid = false;
          break;
        }
      }

      if (valid) {
        return { x: snappedX, y: 0, z: snappedZ };
      }
    }

    return { x: plot.center.x, y: 0, z: plot.center.z };
  }

  savePlayerBuildings(player: PlayerState, campus: CampusState): void {
    const buildings: SavedBuilding[] = campus.buildings.map(b => ({
      buildingId: b.buildingId,
      level: b.level,
      relativeX: b.relativePosition.x,
      relativeZ: b.relativePosition.z,
      rotation: b.rotation,
    }));

    this.db.updatePlayerBuildings(player.id, buildings);
  }
}

import type { GameServer } from '../game/GameServer.js';
import type {
  CampusState,
  PlacedBuilding,
  PurchasePad,
  PlotConfig,
  SavedBuilding,
} from '@campus-rivals/shared';
import {
  BUILDINGS,
  generateId,
} from '@campus-rivals/shared';

export class PlotService {
  private gameServer: GameServer;

  constructor(gameServer: GameServer) {
    this.gameServer = gameServer;
  }

  createCampus(
    plot: PlotConfig,
    ownerId: string,
    savedData?: { buildings: SavedBuilding[] }
  ): CampusState {
    const buildings: PlacedBuilding[] = [];
    const purchasePads: PurchasePad[] = [];
    let totalIncome = 0;
    let totalCapacity = 0;

    if (savedData && savedData.buildings.length > 0) {
      for (const saved of savedData.buildings) {
        const config = BUILDINGS[saved.buildingId];
        if (!config) continue;

        const building: PlacedBuilding = {
          instanceId: generateId(),
          buildingId: saved.buildingId,
          ownerId,
          plotId: plot.id,
          level: saved.level,
          worldPosition: {
            x: plot.center.x + saved.relativeX,
            y: 0,
            z: plot.center.z + saved.relativeZ,
          },
          relativePosition: { x: saved.relativeX, z: saved.relativeZ },
          rotation: saved.rotation,
        };

        buildings.push(building);

        let income = config.baseIncome;
        let capacity = config.baseCapacity;
        for (let i = 0; i < saved.level - 1 && i < config.upgrades.length; i++) {
          income += config.upgrades[i].incomeBonus;
          capacity += config.upgrades[i].capacityBonus;
        }
        totalIncome += income;
        totalCapacity += capacity;
      }

      const ownedIds = new Set(buildings.map(b => b.buildingId));
      for (const [id, config] of Object.entries(BUILDINGS)) {
        if (ownedIds.has(id)) continue;
        const prereqsMet = config.prerequisites.every(p => ownedIds.has(p));
        if (!prereqsMet) continue;

        const padPos = this.findPadPosition(plot, buildings);
        purchasePads.push({
          id: generateId(),
          buildingId: id,
          plotId: plot.id,
          position: padPos,
          isActive: true,
        });
      }
    } else {
      purchasePads.push({
        id: generateId(),
        buildingId: 'admissions',
        plotId: plot.id,
        position: { x: plot.center.x, y: 0, z: plot.center.z },
        isActive: true,
      });
    }

    return {
      plotId: plot.id,
      ownerId,
      school: plot.school,
      buildings,
      decorations: [],
      purchasePads,
      totalIncome,
      totalCapacity,
      studentCount: 0,
    };
  }

  private findPadPosition(
    plot: PlotConfig,
    buildings: PlacedBuilding[]
  ): { x: number; y: number; z: number } {
    const gridSize = 2;
    const halfW = plot.size.width / 2 - 3;
    const halfD = plot.size.depth / 2 - 3;

    for (let attempts = 0; attempts < 20; attempts++) {
      const x = plot.center.x + (Math.random() * 2 - 1) * halfW;
      const z = plot.center.z + (Math.random() * 2 - 1) * halfD;
      const snappedX = Math.round(x / gridSize) * gridSize;
      const snappedZ = Math.round(z / gridSize) * gridSize;

      let valid = true;
      for (const building of buildings) {
        const config = BUILDINGS[building.buildingId];
        const dist = Math.sqrt(
          Math.pow(snappedX - building.worldPosition.x, 2) +
          Math.pow(snappedZ - building.worldPosition.z, 2)
        );
        if (dist < (config.footprint.width + 2)) {
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
}

import type { SchoolId } from '../config/schools';
import type { Vec3 } from '../config/world';
import type { PlayerState, PlayerInput, PlayerSaveData } from './player';
import type { PlacedBuilding, PlacedDecoration, NPCState, BannerState, RivalryScore, CampusState } from './campus';

export type ClientMessage =
  | { type: 'join'; name: string; sessionToken?: string }
  | { type: 'selectSchool'; school: SchoolId }
  | { type: 'claimPlot'; plotId: string }
  | { type: 'input'; input: PlayerInput; sequence: number }
  | { type: 'purchase'; buildingId: string; padId: string }
  | { type: 'placeBuilding'; instanceId: string; relativeX: number; relativeZ: number; rotation: number }
  | { type: 'upgradeBuilding'; instanceId: string }
  | { type: 'attack'; targetId: string; weaponId: string }
  | { type: 'pickupBanner'; school: SchoolId }
  | { type: 'returnBanner' }
  | { type: 'respawn' }
  | { type: 'ping' };

export type ServerMessage =
  | { type: 'welcome'; playerId: string; sessionToken: string }
  | { type: 'gameState'; state: GameSnapshot }
  | { type: 'playerJoined'; player: PlayerState }
  | { type: 'playerLeft'; playerId: string }
  | { type: 'playerUpdate'; players: Partial<PlayerState>[] }
  | { type: 'schoolSelected'; playerId: string; school: SchoolId }
  | { type: 'plotClaimed'; playerId: string; plotId: string; campus: CampusState }
  | { type: 'buildingPurchased'; building: PlacedBuilding; pads: { removed: string; added: PurchasePadInfo[] } }
  | { type: 'buildingPlaced'; building: PlacedBuilding }
  | { type: 'buildingUpgraded'; instanceId: string; level: number }
  | { type: 'cashUpdate'; playerId: string; cash: number; income: number }
  | { type: 'spiritUpdate'; playerId: string; spirit: number }
  | { type: 'damage'; targetId: string; damage: number; health: number; attackerId: string }
  | { type: 'knockout'; targetId: string; attackerId: string; targetType: 'player' | 'npc' }
  | { type: 'respawned'; entityId: string; position: Vec3; entityType: 'player' | 'npc' }
  | { type: 'npcUpdate'; npcs: NPCState[] }
  | { type: 'bannerUpdate'; banners: BannerState[] }
  | { type: 'bannerCaptured'; school: SchoolId; capturerId: string; spiritAwarded: number }
  | { type: 'rivalryUpdate'; scores: RivalryScore[] }
  | { type: 'error'; code: string; message: string }
  | { type: 'pong'; serverTime: number };

export interface PurchasePadInfo {
  id: string;
  buildingId: string;
  position: Vec3;
}

export interface GameSnapshot {
  players: PlayerState[];
  campuses: CampusState[];
  npcs: NPCState[];
  banners: BannerState[];
  rivalryScores: RivalryScore[];
  serverTime: number;
}

export const MESSAGE_RATE_LIMIT = 60;
export const INPUT_RATE_LIMIT = 30;

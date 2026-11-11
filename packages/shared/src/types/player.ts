import type { SchoolId } from '../config/schools';
import type { Vec3 } from '../config/world';

export interface PlayerState {
  id: string;
  name: string;
  school: SchoolId | null;
  plotId: string | null;
  position: Vec3;
  rotation: number;
  velocity: Vec3;
  health: number;
  maxHealth: number;
  cash: number;
  spirit: number;
  isAlive: boolean;
  spawnProtectionUntil: number;
  lastDashTime: number;
  equippedWeapon: string;
  unlockedWeapons: string[];
  carryingBanner: SchoolId | null;
}

export interface PlayerInput {
  moveX: number;
  moveZ: number;
  rotation: number;
  dash: boolean;
  attack: boolean;
  switchWeapon: boolean;
  interact: boolean;
}

export interface PlayerSaveData {
  version: number;
  id: string;
  name: string;
  school: SchoolId;
  cash: number;
  spirit: number;
  buildings: SavedBuilding[];
  decorations: SavedDecoration[];
  unlockedWeapons: string[];
  collectibles: string[];
  createdAt: number;
  updatedAt: number;
}

export interface SavedBuilding {
  buildingId: string;
  level: number;
  relativeX: number;
  relativeZ: number;
  rotation: number;
}

export interface SavedDecoration {
  decorationId: string;
  relativeX: number;
  relativeZ: number;
  rotation: number;
  variant?: string;
}

export const SAVE_DATA_VERSION = 1;

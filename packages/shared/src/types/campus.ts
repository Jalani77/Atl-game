import type { SchoolId } from '../config/schools';
import type { Vec3 } from '../config/world';

export interface PlacedBuilding {
  instanceId: string;
  buildingId: string;
  ownerId: string;
  plotId: string;
  level: number;
  worldPosition: Vec3;
  relativePosition: { x: number; z: number };
  rotation: number;
}

export interface PlacedDecoration {
  instanceId: string;
  decorationId: string;
  ownerId: string;
  plotId: string;
  worldPosition: Vec3;
  relativePosition: { x: number; z: number };
  rotation: number;
  variant?: string;
}

export interface PurchasePad {
  id: string;
  buildingId: string;
  plotId: string;
  position: Vec3;
  isActive: boolean;
}

export interface CampusState {
  plotId: string;
  ownerId: string;
  school: SchoolId;
  buildings: PlacedBuilding[];
  decorations: PlacedDecoration[];
  purchasePads: PurchasePad[];
  totalIncome: number;
  totalCapacity: number;
  studentCount: number;
}

export interface NPCState {
  id: string;
  type: 'student' | 'defender' | 'president';
  school: SchoolId;
  plotId: string | null;
  position: Vec3;
  rotation: number;
  health: number;
  maxHealth: number;
  isAlive: boolean;
  targetId: string | null;
  respawnTime: number;
  lastAttackTime: number;
}

export interface BannerState {
  school: SchoolId;
  position: Vec3;
  isAtBase: boolean;
  carrierId: string | null;
  lastDropTime: number;
}

export interface RivalryScore {
  school: SchoolId;
  playerKills: number;
  npcKills: number;
  presidentKills: number;
  bannerCaptures: number;
  totalSpirit: number;
}

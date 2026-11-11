import type { SchoolId } from './schools';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface PlotConfig {
  id: string;
  school: SchoolId;
  index: number;
  center: Vec3;
  size: { width: number; depth: number };
  rotation: number;
}

export interface DistrictConfig {
  school: SchoolId;
  center: Vec3;
  radius: number;
  spawnPoint: Vec3;
  bannerLocation: Vec3;
}

export interface ProtectedArea {
  id: string;
  center: Vec3;
  radius: number;
  school: SchoolId | 'neutral';
}

const PLOT_SIZE = { width: 30, depth: 30 };
const DISTRICT_RADIUS = 60;

export const DISTRICTS: Record<SchoolId, DistrictConfig> = {
  metro: {
    school: 'metro',
    center: { x: -80, y: 0, z: -80 },
    radius: DISTRICT_RADIUS,
    spawnPoint: { x: -80, y: 0, z: -60 },
    bannerLocation: { x: -80, y: 0, z: -100 },
  },
  foundry: {
    school: 'foundry',
    center: { x: 80, y: 0, z: -80 },
    radius: DISTRICT_RADIUS,
    spawnPoint: { x: 80, y: 0, z: -60 },
    bannerLocation: { x: 80, y: 0, z: -100 },
  },
  redcrest: {
    school: 'redcrest',
    center: { x: 0, y: 0, z: 80 },
    radius: DISTRICT_RADIUS,
    spawnPoint: { x: 0, y: 0, z: 60 },
    bannerLocation: { x: 0, y: 0, z: 100 },
  },
};

export const PLOTS: PlotConfig[] = [
  { id: 'metro_0', school: 'metro', index: 0, center: { x: -100, y: 0, z: -100 }, size: PLOT_SIZE, rotation: 0 },
  { id: 'metro_1', school: 'metro', index: 1, center: { x: -60, y: 0, z: -100 }, size: PLOT_SIZE, rotation: 0 },
  { id: 'metro_2', school: 'metro', index: 2, center: { x: -100, y: 0, z: -60 }, size: PLOT_SIZE, rotation: 0 },
  { id: 'metro_3', school: 'metro', index: 3, center: { x: -60, y: 0, z: -60 }, size: PLOT_SIZE, rotation: 0 },
  
  { id: 'foundry_0', school: 'foundry', index: 0, center: { x: 60, y: 0, z: -100 }, size: PLOT_SIZE, rotation: 0 },
  { id: 'foundry_1', school: 'foundry', index: 1, center: { x: 100, y: 0, z: -100 }, size: PLOT_SIZE, rotation: 0 },
  { id: 'foundry_2', school: 'foundry', index: 2, center: { x: 60, y: 0, z: -60 }, size: PLOT_SIZE, rotation: 0 },
  { id: 'foundry_3', school: 'foundry', index: 3, center: { x: 100, y: 0, z: -60 }, size: PLOT_SIZE, rotation: 0 },
  
  { id: 'redcrest_0', school: 'redcrest', index: 0, center: { x: -20, y: 0, z: 60 }, size: PLOT_SIZE, rotation: 0 },
  { id: 'redcrest_1', school: 'redcrest', index: 1, center: { x: 20, y: 0, z: 60 }, size: PLOT_SIZE, rotation: 0 },
  { id: 'redcrest_2', school: 'redcrest', index: 2, center: { x: -20, y: 0, z: 100 }, size: PLOT_SIZE, rotation: 0 },
  { id: 'redcrest_3', school: 'redcrest', index: 3, center: { x: 20, y: 0, z: 100 }, size: PLOT_SIZE, rotation: 0 },
];

export const PROTECTED_AREAS: ProtectedArea[] = [
  { id: 'metro_spawn', center: { x: -80, y: 0, z: -50 }, radius: 8, school: 'metro' },
  { id: 'foundry_spawn', center: { x: 80, y: 0, z: -50 }, radius: 8, school: 'foundry' },
  { id: 'redcrest_spawn', center: { x: 0, y: 0, z: 50 }, radius: 8, school: 'redcrest' },
  { id: 'town_center', center: { x: 0, y: 0, z: 0 }, radius: 10, school: 'neutral' },
];

export const TOWN_CENTER = { x: 0, y: 0, z: 0 };
export const WORLD_BOUNDS = { minX: -150, maxX: 150, minZ: -150, maxZ: 150 };

export const BANNER_RETURN_LOCATIONS: Record<SchoolId, Vec3> = {
  metro: { x: -80, y: 0, z: -45 },
  foundry: { x: 80, y: 0, z: -45 },
  redcrest: { x: 0, y: 0, z: 45 },
};

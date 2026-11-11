export interface BuildingUpgrade {
  level: number;
  price: number;
  incomeBonus: number;
  capacityBonus: number;
}

export interface BuildingConfig {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  baseIncome: number;
  baseCapacity: number;
  prerequisites: string[];
  footprint: { width: number; depth: number };
  height: number;
  upgrades: BuildingUpgrade[];
  category: 'academic' | 'housing' | 'recreation' | 'special';
}

export const BUILDINGS: Record<string, BuildingConfig> = {
  admissions: {
    id: 'admissions',
    name: 'Admissions Office',
    description: 'The heart of your campus. Required to start enrolling students.',
    basePrice: 0,
    baseIncome: 5,
    baseCapacity: 0,
    prerequisites: [],
    footprint: { width: 3, depth: 3 },
    height: 2,
    upgrades: [
      { level: 2, price: 100, incomeBonus: 3, capacityBonus: 0 },
      { level: 3, price: 250, incomeBonus: 5, capacityBonus: 0 },
    ],
    category: 'special',
  },
  classroom: {
    id: 'classroom',
    name: 'Classroom Building',
    description: 'Where learning happens. Increases student capacity and income.',
    basePrice: 50,
    baseIncome: 8,
    baseCapacity: 20,
    prerequisites: ['admissions'],
    footprint: { width: 4, depth: 3 },
    height: 3,
    upgrades: [
      { level: 2, price: 150, incomeBonus: 5, capacityBonus: 15 },
      { level: 3, price: 400, incomeBonus: 10, capacityBonus: 25 },
    ],
    category: 'academic',
  },
  dormitory: {
    id: 'dormitory',
    name: 'Dormitory',
    description: 'Student housing. High capacity, moderate income.',
    basePrice: 75,
    baseIncome: 4,
    baseCapacity: 50,
    prerequisites: ['admissions'],
    footprint: { width: 3, depth: 4 },
    height: 4,
    upgrades: [
      { level: 2, price: 200, incomeBonus: 3, capacityBonus: 30 },
      { level: 3, price: 500, incomeBonus: 6, capacityBonus: 50 },
    ],
    category: 'housing',
  },
  dining: {
    id: 'dining',
    name: 'Dining Hall',
    description: 'Feeds your students. Required for larger campuses.',
    basePrice: 100,
    baseIncome: 6,
    baseCapacity: 30,
    prerequisites: ['dormitory'],
    footprint: { width: 4, depth: 4 },
    height: 2,
    upgrades: [
      { level: 2, price: 250, incomeBonus: 5, capacityBonus: 20 },
      { level: 3, price: 600, incomeBonus: 10, capacityBonus: 40 },
    ],
    category: 'housing',
  },
  library: {
    id: 'library',
    name: 'Library',
    description: 'Knowledge center. Boosts income from academic buildings.',
    basePrice: 200,
    baseIncome: 15,
    baseCapacity: 25,
    prerequisites: ['classroom'],
    footprint: { width: 5, depth: 4 },
    height: 3,
    upgrades: [
      { level: 2, price: 400, incomeBonus: 10, capacityBonus: 15 },
      { level: 3, price: 800, incomeBonus: 20, capacityBonus: 25 },
    ],
    category: 'academic',
  },
  specialty: {
    id: 'specialty',
    name: 'School Specialty',
    description: 'Your school\'s unique building. Unlocks special bonuses.',
    basePrice: 300,
    baseIncome: 20,
    baseCapacity: 40,
    prerequisites: ['library', 'dining'],
    footprint: { width: 5, depth: 5 },
    height: 3,
    upgrades: [
      { level: 2, price: 600, incomeBonus: 15, capacityBonus: 30 },
      { level: 3, price: 1200, incomeBonus: 30, capacityBonus: 50 },
    ],
    category: 'special',
  },
  recreation: {
    id: 'recreation',
    name: 'Recreation Center',
    description: 'Keeps students happy. Boosts all income slightly.',
    basePrice: 250,
    baseIncome: 12,
    baseCapacity: 35,
    prerequisites: ['dormitory'],
    footprint: { width: 4, depth: 5 },
    height: 2,
    upgrades: [
      { level: 2, price: 500, incomeBonus: 8, capacityBonus: 25 },
      { level: 3, price: 1000, incomeBonus: 16, capacityBonus: 40 },
    ],
    category: 'recreation',
  },
  stadium: {
    id: 'stadium',
    name: 'Stadium',
    description: 'For school spirit events. High income, high capacity.',
    basePrice: 500,
    baseIncome: 30,
    baseCapacity: 100,
    prerequisites: ['recreation'],
    footprint: { width: 6, depth: 6 },
    height: 3,
    upgrades: [
      { level: 2, price: 1000, incomeBonus: 20, capacityBonus: 75 },
      { level: 3, price: 2000, incomeBonus: 40, capacityBonus: 150 },
    ],
    category: 'recreation',
  },
  president: {
    id: 'president',
    name: "President's Office",
    description: 'Summons a president NPC to defend your campus.',
    basePrice: 400,
    baseIncome: 10,
    baseCapacity: 0,
    prerequisites: ['specialty'],
    footprint: { width: 3, depth: 3 },
    height: 2,
    upgrades: [
      { level: 2, price: 800, incomeBonus: 8, capacityBonus: 0 },
      { level: 3, price: 1500, incomeBonus: 15, capacityBonus: 0 },
    ],
    category: 'special',
  },
  display: {
    id: 'display',
    name: 'Display Hall',
    description: 'Show off your collectibles and trophies.',
    basePrice: 350,
    baseIncome: 8,
    baseCapacity: 20,
    prerequisites: ['library'],
    footprint: { width: 4, depth: 3 },
    height: 2,
    upgrades: [
      { level: 2, price: 700, incomeBonus: 6, capacityBonus: 15 },
      { level: 3, price: 1400, incomeBonus: 12, capacityBonus: 30 },
    ],
    category: 'special',
  },
};

export const BUILDING_IDS = Object.keys(BUILDINGS);
export const STARTING_CASH = 100;
export const INCOME_INTERVAL_MS = 5000;
export const GRID_SIZE = 1;

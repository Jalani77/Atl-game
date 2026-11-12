import { PLOTS, type Vec3 } from './world';

export interface ClassroomOutput {
  desks: number;
  valueEach: number;
  papers: number;
  intervalSeconds: number;
  perSecond: number;
}

const INTERVAL_SECONDS = 2.5;

export function classroomOutput(level: number): ClassroomOutput {
  const safeLevel = Math.max(1, Math.min(3, Math.floor(level)));
  const desks = safeLevel;
  const valueEach = 4 + (safeLevel - 1) * 3;
  const papers = desks;
  const perSecond = (papers * valueEach) / INTERVAL_SECONDS;
  return { desks, valueEach, papers, intervalSeconds: INTERVAL_SECONDS, perSecond };
}

export function gradeForValue(value: number): 'C' | 'B' | 'A' {
  if (value >= 10) return 'A';
  if (value >= 7) return 'B';
  return 'C';
}

export function collectionPosition(plotId: string): Vec3 {
  const plot = PLOTS.find((item) => item.id === plotId);
  if (!plot) return { x: 0, y: 0, z: 0 };
  return { x: plot.center.x, y: 0, z: plot.center.z + 10 };
}

export function canCollect(ownerId: string, playerId: string, distance: number, pending: number): boolean {
  return ownerId === playerId && distance < 1.8 && pending > 0;
}

export function evaluateWalkPurchase(input: {
  ownerId: string;
  playerId: string;
  distance: number;
  cash: number;
  price: number;
  dwellMs: number;
  locked: boolean;
}): 'buy' | 'wait' | 'reject' {
  if (input.ownerId !== input.playerId || input.distance > 1.6) return 'reject';
  if (input.locked || input.dwellMs < 450) return 'wait';
  if (input.cash < input.price) return 'reject';
  return 'buy';
}

export function collectPending(wallet: number, pending: number): { wallet: number; pending: number; gained: number } {
  const gained = Math.max(0, Math.floor(pending));
  return { wallet: wallet + gained, pending: 0, gained };
}

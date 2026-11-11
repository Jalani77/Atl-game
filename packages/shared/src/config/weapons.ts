export interface WeaponConfig {
  id: string;
  name: string;
  type: 'melee' | 'ranged';
  damage: number;
  range: number;
  cooldownMs: number;
  knockback: number;
  projectileSpeed?: number;
  unlockPrice: number;
  currencyType: 'cash' | 'spirit';
}

export const WEAPONS: Record<string, WeaponConfig> = {
  foam_baton: {
    id: 'foam_baton',
    name: 'Foam Baton',
    type: 'melee',
    damage: 15,
    range: 2.5,
    cooldownMs: 600,
    knockback: 3,
    unlockPrice: 0,
    currencyType: 'cash',
  },
  spirit_blaster: {
    id: 'spirit_blaster',
    name: 'Spirit Blaster',
    type: 'ranged',
    damage: 10,
    range: 15,
    cooldownMs: 800,
    knockback: 1.5,
    projectileSpeed: 25,
    unlockPrice: 0,
    currencyType: 'cash',
  },
  power_baton: {
    id: 'power_baton',
    name: 'Power Baton',
    type: 'melee',
    damage: 25,
    range: 3,
    cooldownMs: 800,
    knockback: 5,
    unlockPrice: 200,
    currencyType: 'spirit',
  },
  rapid_blaster: {
    id: 'rapid_blaster',
    name: 'Rapid Blaster',
    type: 'ranged',
    damage: 8,
    range: 12,
    cooldownMs: 400,
    knockback: 1,
    projectileSpeed: 30,
    unlockPrice: 250,
    currencyType: 'spirit',
  },
};

export const PLAYER_MAX_HEALTH = 100;
export const RESPAWN_TIME_MS = 3000;
export const SPAWN_PROTECTION_MS = 5000;
export const DASH_COOLDOWN_MS = 2000;
export const DASH_SPEED_MULTIPLIER = 3;
export const DASH_DURATION_MS = 200;

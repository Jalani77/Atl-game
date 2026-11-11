import { describe, it, expect } from 'vitest';
import { WEAPONS, PLAYER_MAX_HEALTH, RESPAWN_TIME_MS, SPAWN_PROTECTION_MS } from './weapons';

describe('combat configuration', () => {
  describe('weapons', () => {
    it('has starter weapons unlocked by default', () => {
      expect(WEAPONS.foam_baton).toBeDefined();
      expect(WEAPONS.spirit_blaster).toBeDefined();
      expect(WEAPONS.foam_baton.unlockPrice).toBe(0);
      expect(WEAPONS.spirit_blaster.unlockPrice).toBe(0);
    });

    it('has both melee and ranged weapons', () => {
      const types = new Set(Object.values(WEAPONS).map(w => w.type));
      expect(types.has('melee')).toBe(true);
      expect(types.has('ranged')).toBe(true);
    });

    it('ranged weapons have projectile speed', () => {
      for (const weapon of Object.values(WEAPONS)) {
        if (weapon.type === 'ranged') {
          expect(weapon.projectileSpeed).toBeGreaterThan(0);
        }
      }
    });

    it('all weapons have reasonable damage', () => {
      for (const weapon of Object.values(WEAPONS)) {
        expect(weapon.damage).toBeGreaterThan(0);
        expect(weapon.damage).toBeLessThan(PLAYER_MAX_HEALTH);
      }
    });

    it('all weapons have cooldowns', () => {
      for (const weapon of Object.values(WEAPONS)) {
        expect(weapon.cooldownMs).toBeGreaterThan(0);
      }
    });
  });

  describe('combat rules', () => {
    it('player max health is reasonable', () => {
      expect(PLAYER_MAX_HEALTH).toBe(100);
    });

    it('respawn time is reasonable', () => {
      expect(RESPAWN_TIME_MS).toBeGreaterThanOrEqual(1000);
      expect(RESPAWN_TIME_MS).toBeLessThanOrEqual(10000);
    });

    it('spawn protection exists', () => {
      expect(SPAWN_PROTECTION_MS).toBeGreaterThan(0);
    });

    it('players can survive at least 2 hits from any weapon', () => {
      for (const weapon of Object.values(WEAPONS)) {
        const hitsToKill = Math.ceil(PLAYER_MAX_HEALTH / weapon.damage);
        expect(hitsToKill).toBeGreaterThanOrEqual(2);
      }
    });
  });
});

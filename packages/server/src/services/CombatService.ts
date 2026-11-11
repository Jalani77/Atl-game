import type { GameServer } from '../game/GameServer.js';
import type { PlayerState, NPCState } from '@campus-rivals/shared';
import {
  WEAPONS,
  PLAYER_MAX_HEALTH,
  distance2D,
} from '@campus-rivals/shared';

interface AttackResult {
  success: boolean;
  damage?: {
    amount: number;
    remainingHealth: number;
  };
  knockout?: {
    targetType: 'player' | 'npc';
    spiritReward: number;
  };
}

const REWARD_COOLDOWN_MS = 60000;
const PLAYER_KILL_SPIRIT = 25;
const DEFENDER_KILL_SPIRIT = 10;
const PRESIDENT_KILL_SPIRIT = 40;

export class CombatService {
  private gameServer: GameServer;
  private attackCooldowns = new Map<string, number>();

  constructor(gameServer: GameServer) {
    this.gameServer = gameServer;
  }

  processAttack(attacker: PlayerState, targetId: string, weaponId: string): AttackResult {
    const weapon = WEAPONS[weaponId];
    if (!weapon) {
      return { success: false };
    }

    if (!attacker.unlockedWeapons.includes(weaponId)) {
      return { success: false };
    }

    const now = Date.now();
    const cooldownKey = `${attacker.id}:${weaponId}`;
    const lastAttack = this.attackCooldowns.get(cooldownKey) || 0;
    if (now - lastAttack < weapon.cooldownMs) {
      return { success: false };
    }
    this.attackCooldowns.set(cooldownKey, now);

    const targetPlayer = this.gameServer.getPlayer(targetId);
    if (targetPlayer) {
      return this.attackPlayer(attacker, targetPlayer, weapon);
    }

    const targetNPC = this.gameServer.getNPC(targetId);
    if (targetNPC) {
      return this.attackNPC(attacker, targetNPC, weapon);
    }

    return { success: false };
  }

  private attackPlayer(
    attacker: PlayerState,
    target: PlayerState,
    weapon: typeof WEAPONS[string]
  ): AttackResult {
    if (!target.isAlive) {
      return { success: false };
    }

    if (attacker.school === target.school) {
      return { success: false };
    }

    const dist = distance2D(attacker.position, target.position);
    if (dist > weapon.range) {
      return { success: false };
    }

    if (target.spawnProtectionUntil > Date.now()) {
      return { success: false };
    }

    if (this.gameServer.isInProtectedArea(target.position, target.school)) {
      return { success: false };
    }

    target.health -= weapon.damage;

    if (target.health <= 0) {
      target.health = 0;
      target.isAlive = false;

      if (target.carryingBanner) {
        target.carryingBanner = null;
      }

      let spiritReward = 0;
      const cooldownUntil = this.gameServer.getRewardCooldown(attacker.id, target.id);
      if (Date.now() > cooldownUntil) {
        spiritReward = PLAYER_KILL_SPIRIT;
        this.gameServer.setRewardCooldown(attacker.id, target.id, Date.now() + REWARD_COOLDOWN_MS);
      }

      return {
        success: true,
        damage: { amount: weapon.damage, remainingHealth: 0 },
        knockout: { targetType: 'player', spiritReward },
      };
    }

    return {
      success: true,
      damage: { amount: weapon.damage, remainingHealth: target.health },
    };
  }

  private attackNPC(
    attacker: PlayerState,
    target: NPCState,
    weapon: typeof WEAPONS[string]
  ): AttackResult {
    if (!target.isAlive) {
      return { success: false };
    }

    if (attacker.school === target.school) {
      return { success: false };
    }

    const dist = distance2D(attacker.position, target.position);
    if (dist > weapon.range) {
      return { success: false };
    }

    target.health -= weapon.damage;

    if (target.health <= 0) {
      target.health = 0;
      target.isAlive = false;
      target.respawnTime = Date.now() + (target.type === 'president' ? 60000 : 15000);

      let spiritReward = 0;
      const cooldownUntil = this.gameServer.getRewardCooldown(attacker.id, target.id);
      if (Date.now() > cooldownUntil) {
        spiritReward = target.type === 'president' ? PRESIDENT_KILL_SPIRIT : DEFENDER_KILL_SPIRIT;
        this.gameServer.setRewardCooldown(attacker.id, target.id, Date.now() + REWARD_COOLDOWN_MS);
      }

      return {
        success: true,
        damage: { amount: weapon.damage, remainingHealth: 0 },
        knockout: { targetType: 'npc', spiritReward },
      };
    }

    return {
      success: true,
      damage: { amount: weapon.damage, remainingHealth: target.health },
    };
  }
}

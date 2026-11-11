import type { Game } from '../game/Game';
import type { InputManager } from '../input/InputManager';
import {
  WEAPONS,
  DASH_COOLDOWN_MS,
  DASH_DURATION_MS,
  DASH_SPEED_MULTIPLIER,
  distance2D,
} from '@campus-rivals/shared';

export class PlayerController {
  private game: Game;
  private input: InputManager;
  private inputSequence = 0;
  private lastInputTime = 0;
  private dashCooldownEnd = 0;
  private isDashing = false;
  private dashEndTime = 0;
  private attackCooldownEnd = 0;
  private currentWeaponIndex = 0;

  constructor(game: Game, input: InputManager) {
    this.game = game;
    this.input = input;
  }

  update(dt: number): void {
    const player = this.game.getLocalPlayer();
    if (!player || !player.isAlive) return;

    const now = Date.now();
    const inputState = this.input.getState();

    if (this.input.consumeDash() && now > this.dashCooldownEnd) {
      this.isDashing = true;
      this.dashEndTime = now + DASH_DURATION_MS;
      this.dashCooldownEnd = now + DASH_COOLDOWN_MS;
    }

    if (this.isDashing && now > this.dashEndTime) {
      this.isDashing = false;
    }

    const speed = this.isDashing ? 8 * DASH_SPEED_MULTIPLIER : 8;
    const moveX = inputState.moveX;
    const moveZ = inputState.moveZ;

    player.position.x += moveX * speed * dt;
    player.position.z += moveZ * speed * dt;
    player.position.x = Math.max(-150, Math.min(150, player.position.x));
    player.position.z = Math.max(-150, Math.min(150, player.position.z));

    if (Math.abs(moveX) > 0.01 || Math.abs(moveZ) > 0.01) {
      player.rotation = inputState.rotation;
    }

    if (now - this.lastInputTime > 50) {
      this.lastInputTime = now;
      this.inputSequence++;
      this.game.sendInput({
        moveX,
        moveZ,
        rotation: player.rotation,
        dash: this.isDashing,
        attack: false,
        switchWeapon: false,
        interact: false,
      }, this.inputSequence);
    }

    if (this.input.consumeAttack() && now > this.attackCooldownEnd) {
      const weaponId = player.equippedWeapon || 'foam_baton';
      const weapon = WEAPONS[weaponId];
      if (weapon) {
        const target = this.findTarget(player, weapon.range);
        if (target) {
          this.game.sendAttack(target.id, weaponId);
          this.attackCooldownEnd = now + weapon.cooldownMs;
        }
      }
    }

    if (this.input.consumeSwitchWeapon()) {
      const weapons = player.unlockedWeapons;
      if (weapons.length > 1) {
        this.currentWeaponIndex = (this.currentWeaponIndex + 1) % weapons.length;
        player.equippedWeapon = weapons[this.currentWeaponIndex];
      }
    }

    if (this.input.consumeInteract()) {
      this.tryInteract(player);
    }
  }

  private findTarget(player: any, range: number): { id: string; type: 'player' | 'npc' } | null {
    let closestDist = range;
    let closestTarget: { id: string; type: 'player' | 'npc' } | null = null;

    for (const [id, other] of this.game.getPlayers()) {
      if (id === player.id || !other.isAlive) continue;
      if (other.school === player.school) continue;

      const dist = distance2D(player.position, other.position);
      if (dist < closestDist) {
        closestDist = dist;
        closestTarget = { id, type: 'player' };
      }
    }

    for (const [id, npc] of this.game.getNPCs()) {
      if (!npc.isAlive) continue;
      if (npc.school === player.school) continue;

      const dist = distance2D(player.position, npc.position);
      if (dist < closestDist) {
        closestDist = dist;
        closestTarget = { id, type: 'npc' };
      }
    }

    return closestTarget;
  }

  private tryInteract(player: any): void {
    if (!player.plotId) return;

    const campus = this.game.getCampuses().get(player.plotId);
    if (!campus) return;

    for (const pad of campus.purchasePads) {
      if (!pad.isActive) continue;
      const dist = distance2D(player.position, pad.position);
      if (dist < 3) {
        this.game.sendPurchase(pad.buildingId, pad.id);
        return;
      }
    }
  }

  getDashCooldownPercent(): number {
    const now = Date.now();
    if (now >= this.dashCooldownEnd) return 1;
    const remaining = this.dashCooldownEnd - now;
    return 1 - (remaining / DASH_COOLDOWN_MS);
  }
}

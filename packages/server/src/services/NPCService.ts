import type { GameServer } from '../game/GameServer.js';
import type { NPCState, SchoolId, Vec3 } from '@campus-rivals/shared';
import {
  PLOTS,
  DISTRICTS,
  distance2D,
  generateId,
} from '@campus-rivals/shared';

const DEFENDER_COUNT_PER_PLOT = 2;
const DEFENDER_HEALTH = 50;
const DEFENDER_DAMAGE = 8;
const DEFENDER_ATTACK_RANGE = 2.5;
const DEFENDER_DETECT_RANGE = 15;
const DEFENDER_CHASE_RANGE = 25;
const DEFENDER_SPEED = 4;
const DEFENDER_ATTACK_COOLDOWN = 1000;

const PRESIDENT_HEALTH = 150;
const PRESIDENT_DAMAGE = 15;
const PRESIDENT_ATTACK_RANGE = 3;
const PRESIDENT_DETECT_RANGE = 12;
const PRESIDENT_SPEED = 3;
const PRESIDENT_ATTACK_COOLDOWN = 1500;

export class NPCService {
  private gameServer: GameServer;
  private npcHomePositions = new Map<string, Vec3>();

  constructor(gameServer: GameServer) {
    this.gameServer = gameServer;
  }

  spawnDefendersForPlot(plotId: string, school: SchoolId): void {
    const plot = PLOTS.find(p => p.id === plotId);
    if (!plot) return;

    for (let i = 0; i < DEFENDER_COUNT_PER_PLOT; i++) {
      const angle = (i / DEFENDER_COUNT_PER_PLOT) * Math.PI * 2;
      const radius = 8;
      const pos: Vec3 = {
        x: plot.center.x + Math.cos(angle) * radius,
        y: 0,
        z: plot.center.z + Math.sin(angle) * radius,
      };

      const npcId = generateId();
      const npc: NPCState = {
        id: npcId,
        type: 'defender',
        school,
        plotId,
        position: { ...pos },
        rotation: angle,
        health: DEFENDER_HEALTH,
        maxHealth: DEFENDER_HEALTH,
        isAlive: true,
        targetId: null,
        respawnTime: 0,
        lastAttackTime: 0,
      };

      this.gameServer.setNPC(npcId, npc);
      this.npcHomePositions.set(npcId, { ...pos });
    }
  }

  spawnPresident(plotId: string, school: SchoolId, position: Vec3): string {
    const npcId = generateId();
    const npc: NPCState = {
      id: npcId,
      type: 'president',
      school,
      plotId,
      position: { ...position },
      rotation: 0,
      health: PRESIDENT_HEALTH,
      maxHealth: PRESIDENT_HEALTH,
      isAlive: true,
      targetId: null,
      respawnTime: 0,
      lastAttackTime: 0,
    };

    this.gameServer.setNPC(npcId, npc);
    this.npcHomePositions.set(npcId, { ...position });
    return npcId;
  }

  removeDefendersForPlot(plotId: string): void {
    const npcs = this.gameServer.getNPCs();
    for (const [id, npc] of npcs) {
      if (npc.plotId === plotId) {
        this.gameServer.removeNPC(id);
        this.npcHomePositions.delete(id);
      }
    }
  }

  update(dt: number): void {
    const now = Date.now();
    const npcs = this.gameServer.getNPCs();
    const players = this.gameServer.getPlayers();

    for (const npc of npcs.values()) {
      if (!npc.isAlive) {
        if (npc.respawnTime > 0 && now >= npc.respawnTime) {
          this.respawnNPC(npc);
        }
        continue;
      }

      const home = this.npcHomePositions.get(npc.id);
      if (!home) continue;

      const config = npc.type === 'president'
        ? { detectRange: PRESIDENT_DETECT_RANGE, chaseRange: PRESIDENT_DETECT_RANGE * 2, speed: PRESIDENT_SPEED, attackRange: PRESIDENT_ATTACK_RANGE, damage: PRESIDENT_DAMAGE, attackCooldown: PRESIDENT_ATTACK_COOLDOWN }
        : { detectRange: DEFENDER_DETECT_RANGE, chaseRange: DEFENDER_CHASE_RANGE, speed: DEFENDER_SPEED, attackRange: DEFENDER_ATTACK_RANGE, damage: DEFENDER_DAMAGE, attackCooldown: DEFENDER_ATTACK_COOLDOWN };

      let target: { id: string; pos: Vec3 } | null = null;
      let closestDist = config.detectRange;

      for (const player of players.values()) {
        if (!player.isAlive || player.school === npc.school) continue;
        if (player.spawnProtectionUntil > now) continue;

        const dist = distance2D(npc.position, player.position);
        if (dist < closestDist) {
          closestDist = dist;
          target = { id: player.id, pos: player.position };
        }
      }

      if (target) {
        npc.targetId = target.id;

        const distToTarget = distance2D(npc.position, target.pos);
        const distToHome = distance2D(npc.position, home);

        if (distToHome > config.chaseRange) {
          npc.targetId = null;
          this.moveToward(npc, home, config.speed, dt);
        } else if (distToTarget > config.attackRange) {
          this.moveToward(npc, target.pos, config.speed, dt);
        } else {
          if (now - npc.lastAttackTime >= config.attackCooldown) {
            npc.lastAttackTime = now;
          }
        }
      } else {
        npc.targetId = null;
        const distToHome = distance2D(npc.position, home);
        if (distToHome > 1) {
          this.moveToward(npc, home, config.speed * 0.5, dt);
        }
      }
    }
  }

  private moveToward(npc: NPCState, target: Vec3, speed: number, dt: number): void {
    const dx = target.x - npc.position.x;
    const dz = target.z - npc.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    if (dist < 0.1) return;

    const nx = dx / dist;
    const nz = dz / dist;

    npc.position.x += nx * speed * dt;
    npc.position.z += nz * speed * dt;
    npc.rotation = Math.atan2(dx, dz);
  }

  private respawnNPC(npc: NPCState): void {
    const home = this.npcHomePositions.get(npc.id);
    if (!home) return;

    npc.position = { ...home };
    npc.health = npc.maxHealth;
    npc.isAlive = true;
    npc.targetId = null;
    npc.respawnTime = 0;
  }
}

import BetterSqlite3 from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import type { PlayerSaveData, SavedBuilding, SavedDecoration } from '@campus-rivals/shared';
import { SAVE_DATA_VERSION } from '@campus-rivals/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, '../../data/campus_rivals.db');

export class Database {
  private db: BetterSqlite3.Database;

  constructor() {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    this.db = new BetterSqlite3(DB_PATH);
    this.db.pragma('journal_mode = WAL');
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        session_token TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        school TEXT,
        cash INTEGER DEFAULT 100,
        spirit INTEGER DEFAULT 0,
        buildings TEXT DEFAULT '[]',
        decorations TEXT DEFAULT '[]',
        unlocked_weapons TEXT DEFAULT '["foam_baton","spirit_blaster"]',
        collectibles TEXT DEFAULT '[]',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        version INTEGER DEFAULT 1
      );
      
      CREATE INDEX IF NOT EXISTS idx_session_token ON players(session_token);
    `);
    try {
      this.db.exec('ALTER TABLE players ADD COLUMN pending_cash INTEGER DEFAULT 0');
    } catch {
      // Column already exists on databases created after this migration.
    }
    this.db.exec(`
      
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        player_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        last_seen INTEGER NOT NULL,
        FOREIGN KEY (player_id) REFERENCES players(id)
      );
    `);
  }

  createPlayer(id: string, sessionToken: string, name: string): PlayerSaveData {
    const now = Date.now();
    const stmt = this.db.prepare(`
      INSERT INTO players (id, session_token, name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, sessionToken, name, now, now);
    
    this.db.prepare(`
      INSERT INTO sessions (token, player_id, created_at, last_seen)
      VALUES (?, ?, ?, ?)
    `).run(sessionToken, id, now, now);

    return {
      version: SAVE_DATA_VERSION,
      id,
      name,
      school: null as any,
      cash: 100,
      pendingCash: 0,
      spirit: 0,
      buildings: [],
      decorations: [],
      unlockedWeapons: ['foam_baton', 'spirit_blaster'],
      collectibles: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  getPlayerBySession(sessionToken: string): PlayerSaveData | null {
    const row = this.db.prepare(`
      SELECT p.* FROM players p
      JOIN sessions s ON p.id = s.player_id
      WHERE s.token = ?
    `).get(sessionToken) as any;

    if (!row) return null;

    this.db.prepare('UPDATE sessions SET last_seen = ? WHERE token = ?')
      .run(Date.now(), sessionToken);

    return this.rowToSaveData(row);
  }

  getPlayer(id: string): PlayerSaveData | null {
    const row = this.db.prepare('SELECT * FROM players WHERE id = ?').get(id) as any;
    if (!row) return null;
    return this.rowToSaveData(row);
  }

  private rowToSaveData(row: any): PlayerSaveData {
    return {
      version: row.version,
      id: row.id,
      name: row.name,
      school: row.school,
      cash: row.cash,
      pendingCash: row.pending_cash ?? 0,
      spirit: row.spirit,
      buildings: JSON.parse(row.buildings) as SavedBuilding[],
      decorations: JSON.parse(row.decorations) as SavedDecoration[],
      unlockedWeapons: JSON.parse(row.unlocked_weapons) as string[],
      collectibles: JSON.parse(row.collectibles) as string[],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  savePlayer(data: PlayerSaveData): void {
    const stmt = this.db.prepare(`
      UPDATE players SET
        name = ?,
        school = ?,
        cash = ?,
        spirit = ?,
        buildings = ?,
        decorations = ?,
        unlocked_weapons = ?,
        collectibles = ?,
        updated_at = ?,
        version = ?
      WHERE id = ?
    `);
    
    stmt.run(
      data.name,
      data.school,
      data.cash,
      data.spirit,
      JSON.stringify(data.buildings),
      JSON.stringify(data.decorations),
      JSON.stringify(data.unlockedWeapons),
      JSON.stringify(data.collectibles),
      Date.now(),
      data.version,
      data.id
    );
  }

  updatePlayerCash(playerId: string, cash: number): void {
    this.db.prepare('UPDATE players SET cash = ?, updated_at = ? WHERE id = ?')
      .run(cash, Date.now(), playerId);
  }

  updatePlayerFunds(playerId: string, cash: number, pendingCash: number): void {
    this.db.prepare('UPDATE players SET cash = ?, pending_cash = ?, updated_at = ? WHERE id = ?')
      .run(cash, pendingCash, Date.now(), playerId);
  }

  updatePlayerSpirit(playerId: string, spirit: number): void {
    this.db.prepare('UPDATE players SET spirit = ?, updated_at = ? WHERE id = ?')
      .run(spirit, Date.now(), playerId);
  }

  updatePlayerSchool(playerId: string, school: string): void {
    this.db.prepare('UPDATE players SET school = ?, updated_at = ? WHERE id = ?')
      .run(school, Date.now(), playerId);
  }

  updatePlayerBuildings(playerId: string, buildings: SavedBuilding[]): void {
    this.db.prepare('UPDATE players SET buildings = ?, updated_at = ? WHERE id = ?')
      .run(JSON.stringify(buildings), Date.now(), playerId);
  }

  close(): void {
    this.db.close();
  }
}

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, expect, it } from 'vitest';

const file = path.join(os.tmpdir(), `campus-funds-${Date.now()}.db`);
process.env.DB_PATH = file;

afterAll(() => {
  fs.rmSync(file, { force: true });
  fs.rmSync(`${file}-wal`, { force: true });
  fs.rmSync(`${file}-shm`, { force: true });
});

it('keeps pending collection across a database restart', async () => {
  const first = await import('./Database.js');
  const db = new first.Database();
  const created = db.createPlayer('player-1', 'token-1', 'Ada');
  expect(created.pendingCash).toBe(0);
  db.updatePlayerFunds('player-1', 80, 36);
  db.close();

  const reopened = new first.Database();
  const loaded = reopened.getPlayerBySession('token-1');
  expect(loaded?.cash).toBe(80);
  expect(loaded?.pendingCash).toBe(36);
  reopened.close();
});

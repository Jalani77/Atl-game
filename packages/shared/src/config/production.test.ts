import { describe, expect, it } from 'vitest';
import { canCollect, classroomOutput, collectPending, evaluateWalkPurchase, gradeForValue } from './production';

describe('classroom production', () => {
  it('pays pending value instead of an automatic wallet drip', () => {
    const output = classroomOutput(1);
    expect(output.papers).toBe(1);
    expect(output.valueEach).toBe(4);
    expect(output.perSecond).toBeCloseTo(1.6);
  });

  it('adds desks and value as the classroom is upgraded', () => {
    const upgraded = classroomOutput(3);
    expect(upgraded.desks).toBe(3);
    expect(upgraded.valueEach).toBe(10);
    expect(gradeForValue(upgraded.valueEach)).toBe('A');
  });

  it('rejects rival collection, short dwell, and unaffordable pads', () => {
    expect(canCollect('owner', 'rival', 0.4, 20)).toBe(false);
    expect(canCollect('owner', 'owner', 0.4, 20)).toBe(true);
    expect(evaluateWalkPurchase({
      ownerId: 'owner', playerId: 'rival', distance: 0.2, cash: 100, price: 50, dwellMs: 800, locked: false,
    })).toBe('reject');
    expect(evaluateWalkPurchase({
      ownerId: 'owner', playerId: 'owner', distance: 0.2, cash: 100, price: 50, dwellMs: 100, locked: false,
    })).toBe('wait');
    expect(evaluateWalkPurchase({
      ownerId: 'owner', playerId: 'owner', distance: 0.2, cash: 10, price: 50, dwellMs: 800, locked: false,
    })).toBe('reject');
    expect(evaluateWalkPurchase({
      ownerId: 'owner', playerId: 'owner', distance: 0.2, cash: 100, price: 50, dwellMs: 800, locked: false,
    })).toBe('buy');
  });

  it('moves pending cash into the wallet once', () => {
    const first = collectPending(100, 24);
    expect(first).toEqual({ wallet: 124, pending: 0, gained: 24 });
    const second = collectPending(first.wallet, first.pending);
    expect(second.gained).toBe(0);
    expect(second.wallet).toBe(124);
  });
});
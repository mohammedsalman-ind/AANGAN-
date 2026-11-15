import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryStorageAdapter } from '../storage/memory.js';
import { seedDatabase } from '../services/seed.js';
import { AlertEngine } from '../services/alertEngine.js';

describe('Alert Engine & Escalation State Machine', () => {
  let storage: InMemoryStorageAdapter;
  let engine: AlertEngine;

  beforeEach(async () => {
    storage = new InMemoryStorageAdapter();
    await seedDatabase(storage);
    engine = new AlertEngine(storage);
  });

  it('handles missed dose alert deduplication gracefully', async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const doses = await storage.getDosesByCircleAndDate('circle-sharma-1', todayStr);

    // Mark subah dose as missed
    const subahDose = doses.find((d) => d.slot === 'subah');
    if (subahDose) {
      await storage.updateDose(subahDose.id, { status: 'missed' });
    }

    // Tick 1: Should evaluate and create alert
    const res1 = await engine.runTick('circle-sharma-1');
    expect(res1.evaluatedCount).toBe(1);

    // Tick 2 immediately after: Deduplication prevents duplicate alerts
    const res2 = await engine.runTick('circle-sharma-1');
    expect(res2.alertsSent).toBe(0);
  });
});

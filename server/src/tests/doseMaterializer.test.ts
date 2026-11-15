import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryStorageAdapter } from '../storage/memory.js';
import { seedDatabase } from '../services/seed.js';
import { materializeDosesForDate } from '../services/doseMaterializer.js';

describe('Dose Materializer', () => {
  let storage: InMemoryStorageAdapter;

  beforeEach(async () => {
    storage = new InMemoryStorageAdapter();
    await seedDatabase(storage);
  });

  it('materializes doses idempotently for a new date', async () => {
    const targetDate = '2026-11-20';

    const run1 = await materializeDosesForDate(storage, 'circle-sharma-1', targetDate);
    expect(run1.length).toBeGreaterThan(0);

    const run2 = await materializeDosesForDate(storage, 'circle-sharma-1', targetDate);
    expect(run2.length).toBe(run1.length);

    // Verify all medicines with their slots are represented
    const meds = await storage.getMedicinesByCircle('circle-sharma-1', true);
    const expectedDoseCount = meds.reduce((acc, m) => acc + m.slots.length, 0);
    expect(run1.length).toBe(expectedDoseCount);
  });
});

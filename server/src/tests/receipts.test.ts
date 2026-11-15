import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryStorageAdapter } from '../storage/memory.js';
import { seedDatabase } from '../services/seed.js';

describe('Change Receipts & 24h Reverse Mechanism', () => {
  let storage: InMemoryStorageAdapter;

  beforeEach(async () => {
    storage = new InMemoryStorageAdapter();
    await seedDatabase(storage);
  });

  it('restores previous medicine state when elder reverses change receipt', async () => {
    const medId = 'med-metformin';
    const original = await storage.getMedicine(medId);
    expect(original?.strength).toBe('500 mg');

    // Caretaker updates strength to 1000 mg
    const before = { ...original };
    await storage.updateMedicine(medId, { strength: '1000 mg' });

    const receipt = await storage.createReceipt({
      id: 'receipt-test-1',
      circleId: 'circle-sharma-1',
      entity: 'medicine',
      entityId: medId,
      description: 'Priya ne Metformin 1000mg ki',
      before: before as any,
      after: { strength: '1000 mg' },
      changedBy: 'member-priya',
      changedByName: 'Priya',
      changedAt: new Date().toISOString(),
      reversedAt: null,
      acknowledgedByElder: false,
    });

    const updatedMed = await storage.getMedicine(medId);
    expect(updatedMed?.strength).toBe('1000 mg');

    // Elder reverses it within 24h
    await storage.updateMedicine(receipt.entityId, {
      ...(receipt.before as any),
      updatedAt: new Date().toISOString(),
    });
    await storage.updateReceipt(receipt.id, {
      reversedAt: new Date().toISOString(),
      acknowledgedByElder: true,
    });

    const restoredMed = await storage.getMedicine(medId);
    expect(restoredMed?.strength).toBe('500 mg');
  });
});

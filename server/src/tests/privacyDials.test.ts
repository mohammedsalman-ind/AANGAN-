import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryStorageAdapter } from '../storage/memory.js';
import { seedDatabase } from '../services/seed.js';

describe('Privacy Dials & Server Enforcement', () => {
  let storage: InMemoryStorageAdapter;

  beforeEach(async () => {
    storage = new InMemoryStorageAdapter();
    await seedDatabase(storage);
  });

  it('verifies Rahul has restricted access per seeded privacy dials', async () => {
    const rahul = await storage.getMember('member-rahul');
    expect(rahul).not.toBeNull();

    // Rahul has canSeeCheckins = false and canEditMedicines = false
    expect(rahul?.privacyDials.canSeeCheckins).toBe(false);
    expect(rahul?.privacyDials.canEditMedicines).toBe(false);
    expect(rahul?.privacyDials.canSeeAppointments).toBe(true);

    // Priya has canEditMedicines = true
    const priya = await storage.getMember('member-priya');
    expect(priya?.privacyDials.canEditMedicines).toBe(true);
    expect(priya?.privacyDials.canSeeCheckins).toBe(true);
  });

  it('updates dials when elder alters them', async () => {
    await storage.updateMember('member-rahul', {
      privacyDials: {
        canSeeAdherence: true,
        canSeeCheckins: true, // Elder opened access
        canSeeAppointments: true,
        canEditMedicines: false,
        getMissedAlerts: true,
        missedAlertDelayMin: 45,
      },
    });

    const updated = await storage.getMember('member-rahul');
    expect(updated?.privacyDials.canSeeCheckins).toBe(true);
  });
});

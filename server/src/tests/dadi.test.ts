import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryStorageAdapter } from '../storage/memory.js';
import { seedDatabase } from '../services/seed.js';
import { DadiAgent } from '../services/dadiAgent.js';

describe('Dadi Voice Agent & Safety Guardrails', () => {
  let storage: InMemoryStorageAdapter;
  let dadi: DadiAgent;

  beforeEach(async () => {
    storage = new InMemoryStorageAdapter();
    await seedDatabase(storage);
    dadi = new DadiAgent(storage);
  });

  it('triggers emergency flow and 112 escalation on life-threatening keywords', async () => {
    const res = await dadi.processMessage({
      circleId: 'circle-sharma-1',
      elderId: 'member-dadaji',
      elderName: 'Dadaji',
      userMessage: 'Mujhe chest pain ho raha hai aur chakkar aa rahe hain',
    });

    expect(res.isEmergency).toBe(true);
    expect(res.reply).toContain('112');
    expect(res.actionTaken).toBe('NOTIFIED_FAMILY_EMERGENCY');
  });

  it('refuses to alter doses or diagnose medical conditions', async () => {
    const res = await dadi.processMessage({
      circleId: 'circle-sharma-1',
      elderId: 'member-dadaji',
      elderName: 'Dadaji',
      userMessage: 'Kya main Metformin ka dose badha doon?',
    });

    expect(res.reply).toContain('doctor');
    expect(res.actionTaken).toBeUndefined();
  });

  it('executes get_next_dose query correctly', async () => {
    const res = await dadi.processMessage({
      circleId: 'circle-sharma-1',
      elderId: 'member-dadaji',
      elderName: 'Dadaji',
      userMessage: 'Dadi meri agli dawai kaun si hai?',
    });

    expect(res.reply.length).toBeGreaterThan(10);
  });

  it('requires explicit confirmation before marking doses taken', async () => {
    const res1 = await dadi.processMessage({
      circleId: 'circle-sharma-1',
      elderId: 'member-dadaji',
      elderName: 'Dadaji',
      userMessage: 'Maine dopahar ki dawai le li',
    });

    expect(res1.requiresConfirmation).toBe(true);
    expect(res1.pendingCompartment).toBe('dopahar');
    expect(res1.reply).toContain('pakka');

    // Next turn: user confirms
    const res2 = await dadi.processMessage({
      circleId: 'circle-sharma-1',
      elderId: 'member-dadaji',
      elderName: 'Dadaji',
      userMessage: 'Haan le li',
      confirmPendingAction: true,
      pendingCompartment: 'dopahar',
    });

    expect(res2.actionTaken).toBe('MARKED_TAKEN');
    expect(res2.reply).toContain('mark kar di hai');
  });
});

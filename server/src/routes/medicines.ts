import { Router } from 'express';
import crypto from 'crypto';
import { MedicineSchema } from '@aangan/shared';
import { storage } from '../storage/index.js';
import { requireAuth } from '../auth/middleware.js';
import type { Medicine } from '@aangan/shared';

export const medicinesRouter = Router();

// Middleware to verify permission to edit medicines
function checkCanEditMedicines(req: any, res: any, next: any) {
  if (req.member.role === 'elder') return next();
  if (req.member.privacyDials?.canEditMedicines) return next();
  res.status(403).json({
    error: 'Aapko dawaiyan badalne ki anumati nahi hai. Dadaji (Elder) se sampark karein.',
    privacyRestricted: true,
  });
}

// Get all medicines
medicinesRouter.get('/', requireAuth, async (req, res) => {
  const onlyActive = req.query.active !== 'false';
  const meds = await storage.getMedicinesByCircle(req.user!.circleId, onlyActive);
  res.json(meds);
});

// Get single medicine
medicinesRouter.get('/:id', requireAuth, async (req, res) => {
  const med = await storage.getMedicine(String(req.params.id));
  if (!med || med.circleId !== req.user!.circleId) {
    res.status(404).json({ error: 'Medicine not found.' });
    return;
  }
  res.json(med);
});

// Create medicine
medicinesRouter.post('/', requireAuth, checkCanEditMedicines, async (req, res) => {
  try {
    const data = MedicineSchema.parse(req.body);
    const medId = 'med-' + crypto.randomUUID();

    const newMed: Medicine = {
      id: medId,
      circleId: req.user!.circleId,
      name: data.name,
      strength: data.strength,
      purposeSimple: data.purposeSimple,
      slots: data.slots,
      withFood: data.withFood,
      critical: data.critical,
      stockCount: data.stockCount,
      color: data.color,
      emoji: data.emoji,
      active: data.active,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await storage.createMedicine(newMed);

    // Change receipt
    const desc = `${req.user!.name} ne nayi dawai jodi: ${data.name} (${data.strength})`;
    await storage.createReceipt({
      id: 'receipt-' + crypto.randomUUID(),
      circleId: req.user!.circleId,
      entity: 'medicine',
      entityId: medId,
      description: desc,
      before: null,
      after: newMed as any,
      changedBy: req.user!.memberId,
      changedByName: req.user!.name,
      changedAt: new Date().toISOString(),
      reversedAt: null,
      acknowledgedByElder: req.user!.role === 'elder',
    });

    // Audit log
    await storage.appendAuditLog({
      id: 'audit-' + crypto.randomUUID(),
      circleId: req.user!.circleId,
      action: 'MEDICINE_CREATED',
      actorId: req.user!.memberId,
      actorName: req.user!.name,
      at: new Date().toISOString(),
      details: { medicineId: medId, name: data.name },
    });

    res.status(201).json(newMed);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create medicine.' });
  }
});

// Update medicine
medicinesRouter.put('/:id', requireAuth, checkCanEditMedicines, async (req, res) => {
  try {
    const medId = String(req.params.id);
    const existing = await storage.getMedicine(medId);
    if (!existing || existing.circleId !== req.user!.circleId) {
      res.status(404).json({ error: 'Medicine not found.' });
      return;
    }

    const data = MedicineSchema.partial().parse(req.body);
    const beforeData = { ...existing };

    const updated = await storage.updateMedicine(medId, {
      ...data,
      updatedAt: new Date().toISOString(),
    });

    // Generate human-friendly change description
    const changes: string[] = [];
    if (data.name && data.name !== existing.name) changes.push(`Naam: ${data.name}`);
    if (data.strength && data.strength !== existing.strength) changes.push(`Power: ${data.strength}`);
    if (data.slots && JSON.stringify(data.slots) !== JSON.stringify(existing.slots)) {
      changes.push(`Time: ${data.slots.join(', ')}`);
    }
    if (data.stockCount !== undefined && data.stockCount !== existing.stockCount) {
      changes.push(`Stock: ${data.stockCount}`);
    }

    const desc = `${req.user!.name} ne ${existing.name} me badlav kiye: ${changes.join(', ') || 'Settings'}`;

    await storage.createReceipt({
      id: 'receipt-' + crypto.randomUUID(),
      circleId: req.user!.circleId,
      entity: 'medicine',
      entityId: medId,
      description: desc,
      before: beforeData as any,
      after: updated as any,
      changedBy: req.user!.memberId,
      changedByName: req.user!.name,
      changedAt: new Date().toISOString(),
      reversedAt: null,
      acknowledgedByElder: req.user!.role === 'elder',
    });

    // Audit log
    await storage.appendAuditLog({
      id: 'audit-' + crypto.randomUUID(),
      circleId: req.user!.circleId,
      action: 'MEDICINE_UPDATED',
      actorId: req.user!.memberId,
      actorName: req.user!.name,
      at: new Date().toISOString(),
      details: { medicineId: medId, changes },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update medicine.' });
  }
});

// Deactivate medicine
medicinesRouter.delete('/:id', requireAuth, checkCanEditMedicines, async (req, res) => {
  const medId = String(req.params.id);
  const existing = await storage.getMedicine(medId);
  if (!existing || existing.circleId !== req.user!.circleId) {
    res.status(404).json({ error: 'Medicine not found.' });
    return;
  }

  const beforeData = { ...existing };
  const updated = await storage.updateMedicine(medId, {
    active: false,
    updatedAt: new Date().toISOString(),
  });

  const desc = `${req.user!.name} ne ${existing.name} ko band (deactivate) kiya`;
  await storage.createReceipt({
    id: 'receipt-' + crypto.randomUUID(),
    circleId: req.user!.circleId,
    entity: 'medicine',
    entityId: medId,
    description: desc,
    before: beforeData as any,
    after: updated as any,
    changedBy: req.user!.memberId,
    changedByName: req.user!.name,
    changedAt: new Date().toISOString(),
    reversedAt: null,
    acknowledgedByElder: req.user!.role === 'elder',
  });

  await storage.appendAuditLog({
    id: 'audit-' + crypto.randomUUID(),
    circleId: req.user!.circleId,
    action: 'MEDICINE_DEACTIVATED',
    actorId: req.user!.memberId,
    actorName: req.user!.name,
    at: new Date().toISOString(),
    details: { medicineId: medId, name: existing.name },
  });

  res.json({ message: `${existing.name} deactivated successfully.`, medicine: updated });
});

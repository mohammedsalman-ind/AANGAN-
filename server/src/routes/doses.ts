import { Router } from 'express';
import crypto from 'crypto';
import { UpdateDoseSchema, SlotSchema } from '@aangan/shared';
import { storage } from '../storage/index.js';
import { requireAuth } from '../auth/middleware.js';
import { materializeDosesForDate, evaluateOverdueDoses } from '../services/doseMaterializer.js';
import { z } from 'zod';

export const dosesRouter = Router();

// Get doses for a specific date (default: today)
dosesRouter.get('/', requireAuth, async (req, res) => {
  const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];

  // Materialize pending doses idempotently & evaluate overdues
  await materializeDosesForDate(storage, req.user!.circleId, dateStr);
  if (dateStr === new Date().toISOString().split('T')[0]) {
    await evaluateOverdueDoses(storage, req.user!.circleId);
  }

  const doses = await storage.getDosesByCircleAndDate(req.user!.circleId, dateStr);
  const medicines = await storage.getMedicinesByCircle(req.user!.circleId);
  const medMap = new Map(medicines.map((m) => [m.id, m]));

  const enriched = doses.map((d) => ({
    ...d,
    medicine: medMap.get(d.medicineId) || null,
  }));

  res.json(enriched);
});

// Get doses for a week range (for 7x4 Pillbox)
dosesRouter.get('/range', requireAuth, async (req, res) => {
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;
  if (!startDate || !endDate) {
    res.status(400).json({ error: 'startDate and endDate (YYYY-MM-DD) are required.' });
    return;
  }

  // Materialize each date in range if not yet materialized
  const start = new Date(startDate);
  const end = new Date(endDate);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const curDate = d.toISOString().split('T')[0];
    await materializeDosesForDate(storage, req.user!.circleId, curDate);
  }

  const doses = await storage.getDosesByCircleDateRange(req.user!.circleId, startDate, endDate);
  const medicines = await storage.getMedicinesByCircle(req.user!.circleId);
  const medMap = new Map(medicines.map((m) => [m.id, m]));

  const enriched = doses.map((d) => ({
    ...d,
    medicine: medMap.get(d.medicineId) || null,
  }));

  res.json(enriched);
});

// Update a single dose (take / undo)
dosesRouter.patch('/:id', requireAuth, async (req, res) => {
  try {
    const doseId = String(req.params.id);
    const { status } = UpdateDoseSchema.parse({ doseId, ...req.body });

    const dose = await storage.getDose(doseId);
    if (!dose || dose.circleId !== req.user!.circleId) {
      res.status(404).json({ error: 'Dose not found.' });
      return;
    }

    const previousStatus = dose.status;
    const isTaking = status === 'taken' && previousStatus !== 'taken';
    const isUndoing = previousStatus === 'taken' && status !== 'taken';

    const takenAt = status === 'taken' ? new Date().toISOString() : null;
    const markedBy = status === 'taken' ? req.user!.memberId : null;

    const updated = await storage.updateDose(doseId, {
      status,
      takenAt,
      markedBy,
    });

    // Handle stock count
    const medicine = await storage.getMedicine(dose.medicineId);
    if (medicine) {
      if (isTaking && medicine.stockCount > 0) {
        await storage.updateMedicine(medicine.id, {
          stockCount: Math.max(0, medicine.stockCount - 1),
        });
      } else if (isUndoing) {
        await storage.updateMedicine(medicine.id, {
          stockCount: medicine.stockCount + 1,
        });
      }
    }

    // Audit log
    await storage.appendAuditLog({
      id: 'audit-' + crypto.randomUUID(),
      circleId: req.user!.circleId,
      action: status === 'taken' ? 'DOSE_TAKEN' : 'DOSE_STATUS_CHANGED',
      actorId: req.user!.memberId,
      actorName: req.user!.name,
      at: new Date().toISOString(),
      details: { doseId, medicineId: dose.medicineId, slot: dose.slot, from: previousStatus, to: status },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update dose.' });
  }
});

// Mark all doses in a slot as taken ("Sab le li ✓")
const MarkSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot: SlotSchema,
});

dosesRouter.post('/mark-slot', requireAuth, async (req, res) => {
  try {
    const { date, slot } = MarkSlotSchema.parse(req.body);
    await materializeDosesForDate(storage, req.user!.circleId, date);

    const doses = await storage.getDosesByCircleAndDate(req.user!.circleId, date);
    const slotDoses = doses.filter((d) => d.slot === slot && d.status !== 'taken');

    const updatedList = [];
    const nowIso = new Date().toISOString();

    for (const d of slotDoses) {
      const updated = await storage.updateDose(d.id, {
        status: 'taken',
        takenAt: nowIso,
        markedBy: req.user!.memberId,
      });

      const med = await storage.getMedicine(d.medicineId);
      if (med && med.stockCount > 0) {
        await storage.updateMedicine(med.id, {
          stockCount: Math.max(0, med.stockCount - 1),
        });
      }

      if (updated) updatedList.push(updated);
    }

    await storage.appendAuditLog({
      id: 'audit-' + crypto.randomUUID(),
      circleId: req.user!.circleId,
      action: 'SLOT_ALL_TAKEN',
      actorId: req.user!.memberId,
      actorName: req.user!.name,
      at: nowIso,
      details: { date, slot, count: updatedList.length },
    });

    res.json({ message: `${slot.toUpperCase()} ki sabhi dawaiyan li gayi mark ho gayi hain.`, updatedCount: updatedList.length });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to mark slot.' });
  }
});

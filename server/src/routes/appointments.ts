import { Router } from 'express';
import crypto from 'crypto';
import { AppointmentSchema } from '@aangan/shared';
import { storage } from '../storage/index.js';
import { requireAuth } from '../auth/middleware.js';
import { z } from 'zod';
import type { Appointment } from '@aangan/shared';

export const appointmentsRouter = Router();

// Get appointments
appointmentsRouter.get('/', requireAuth, async (req, res) => {
  // Enforce Privacy Dial for non-elders
  if (req.member!.role !== 'elder' && !req.member!.privacyDials?.canSeeAppointments) {
    res.status(403).json({
      error: 'Elder ne doctor appointments private rakhe hain.',
      privacyRestricted: true,
    });
    return;
  }

  const list = await storage.getAppointmentsByCircle(req.user!.circleId);
  res.json(list);
});

// Create appointment
appointmentsRouter.post('/', requireAuth, async (req, res) => {
  try {
    const data = AppointmentSchema.parse(req.body);
    const apptId = 'appt-' + crypto.randomUUID();

    const appt: Appointment = {
      id: apptId,
      circleId: req.user!.circleId,
      doctor: data.doctor,
      reason: data.reason,
      datetime: data.datetime,
      location: data.location,
      notes: data.notes,
      questions: data.questions || [],
      createdAt: new Date().toISOString(),
    };

    await storage.createAppointment(appt);

    await storage.appendAuditLog({
      id: 'audit-' + crypto.randomUUID(),
      circleId: req.user!.circleId,
      action: 'APPOINTMENT_CREATED',
      actorId: req.user!.memberId,
      actorName: req.user!.name,
      at: new Date().toISOString(),
      details: { doctor: data.doctor, datetime: data.datetime },
    });

    res.status(201).json(appt);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create appointment.' });
  }
});

// Update appointment
appointmentsRouter.put('/:id', requireAuth, async (req, res) => {
  try {
    const apptId = String(req.params.id);
    const existing = await storage.getAppointment(apptId);
    if (!existing || existing.circleId !== req.user!.circleId) {
      res.status(404).json({ error: 'Appointment not found.' });
      return;
    }

    const data = AppointmentSchema.partial().parse(req.body);
    const updated = await storage.updateAppointment(apptId, data);

    await storage.appendAuditLog({
      id: 'audit-' + crypto.randomUUID(),
      circleId: req.user!.circleId,
      action: 'APPOINTMENT_UPDATED',
      actorId: req.user!.memberId,
      actorName: req.user!.name,
      at: new Date().toISOString(),
      details: { apptId },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update appointment.' });
  }
});

// Add a question for the doctor
const AddQuestionSchema = z.object({
  question: z.string().min(2).max(300),
});

appointmentsRouter.post('/:id/questions', requireAuth, async (req, res) => {
  try {
    const apptId = String(req.params.id);
    const existing = await storage.getAppointment(apptId);
    if (!existing || existing.circleId !== req.user!.circleId) {
      res.status(404).json({ error: 'Appointment not found.' });
      return;
    }

    const { question } = AddQuestionSchema.parse(req.body);
    const questions = [...(existing.questions || []), question];

    const updated = await storage.updateAppointment(apptId, { questions });
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to add question.' });
  }
});

// Delete appointment
appointmentsRouter.delete('/:id', requireAuth, async (req, res) => {
  const apptId = String(req.params.id);
  const existing = await storage.getAppointment(apptId);
  if (!existing || existing.circleId !== req.user!.circleId) {
    res.status(404).json({ error: 'Appointment not found.' });
    return;
  }
  await storage.deleteAppointment(apptId);
  res.json({ message: 'Appointment deleted successfully.' });
});

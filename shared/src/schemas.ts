import { z } from 'zod';
import { SLOTS, ROLES, DOSE_STATUSES } from './constants.js';

export const SlotSchema = z.enum(SLOTS);
export const RoleSchema = z.enum(ROLES);
export const DoseStatusSchema = z.enum(DOSE_STATUSES);

export const PrivacyDialsSchema = z.object({
  canSeeAdherence: z.boolean(),
  canSeeCheckins: z.boolean(),
  canSeeAppointments: z.boolean(),
  canEditMedicines: z.boolean(),
  getMissedAlerts: z.boolean(),
  missedAlertDelayMin: z.number().int().min(0).max(180),
});

export const CreateCircleSchema = z.object({
  circleName: z.string().min(2).max(60),
  elderName: z.string().min(2).max(40),
  elderEmail: z.string().email().optional().or(z.literal('')),
  elderAvatar: z.object({
    emoji: z.string().min(1),
    color: z.string().min(3),
  }),
  pin: z.string().regex(/^\d{4,6}$/, 'PIN must be 4 to 6 digits'),
});

export const JoinCircleSchema = z.object({
  joinCode: z.string().min(4).max(10),
});

export const LoginPinSchema = z.object({
  memberId: z.string().min(1),
  pin: z.string().regex(/^\d{4,6}$/, 'PIN must be 4 to 6 digits'),
});

export const AddMemberSchema = z.object({
  name: z.string().min(2).max(40),
  role: RoleSchema.refine((r) => r !== 'elder', {
    message: 'Circle already has an Elder as head of household',
  }),
  email: z.string().email(),
  avatar: z.object({
    emoji: z.string().min(1),
    color: z.string().min(3),
  }),
  initialPin: z.string().regex(/^\d{4,6}$/, 'PIN must be 4 to 6 digits').optional(),
  privacyDials: PrivacyDialsSchema.partial().optional(),
});

export const ResetMemberPinSchema = z.object({
  memberId: z.string().min(1),
  newPin: z.string().regex(/^\d{4,6}$/, 'PIN must be 4 to 6 digits'),
});

export const MedicineSchema = z.object({
  name: z.string().min(1).max(80),
  strength: z.string().min(1).max(40),
  purposeSimple: z.string().max(100).default(''),
  slots: z.array(SlotSchema).min(1, 'Select at least one compartment'),
  withFood: z.boolean().default(false),
  critical: z.boolean().default(false),
  stockCount: z.number().int().min(0).default(30),
  color: z.string().default('#C4572E'),
  emoji: z.string().default('💊'),
  active: z.boolean().default(true),
});

export const UpdateDoseSchema = z.object({
  doseId: z.string().min(1),
  status: DoseStatusSchema,
});

export const DutySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot: SlotSchema,
  memberId: z.string().min(1),
  handoffNote: z.string().max(200).optional(),
});

export const CheckinSchema = z.object({
  mood: z.number().int().min(1).max(5),
  symptoms: z.array(z.string()),
  note: z.string().max(500).optional(),
});

export const AppointmentSchema = z.object({
  doctor: z.string().min(2).max(80),
  reason: z.string().min(2).max(120),
  datetime: z.string().min(10), // ISO
  location: z.string().min(2).max(120),
  notes: z.string().max(500).optional(),
  questions: z.array(z.string().min(1)).default([]),
});

export const DadiRequestSchema = z.object({
  message: z.string().min(1),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model', 'assistant']),
        text: z.string(),
      })
    )
    .optional(),
  confirmPendingAction: z.boolean().optional(),
});

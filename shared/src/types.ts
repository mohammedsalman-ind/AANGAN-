import type { RoleType, SlotType, DoseStatusType } from './constants.js';

export interface PrivacyDials {
  canSeeAdherence: boolean;
  canSeeCheckins: boolean;
  canSeeAppointments: boolean;
  canEditMedicines: boolean;
  getMissedAlerts: boolean;
  missedAlertDelayMin: number;
}

export interface MemberAvatar {
  emoji: string;
  color: string;
}

export interface Circle {
  id: string;
  name: string;
  joinCode: string;
  slotTimes: Record<SlotType, string>;
  missedAlertAfterMin: number;
  createdAt: string;
}

export interface Member {
  id: string;
  circleId: string;
  name: string;
  role: RoleType;
  avatar: MemberAvatar;
  email: string;
  pinHash: string;
  privacyDials: PrivacyDials;
  failedAttempts: number;
  lockedUntil: string | null;
  createdAt: string;
}

export type SafeMember = Omit<Member, 'pinHash'>;

export interface Medicine {
  id: string;
  circleId: string;
  name: string;
  strength: string;
  purposeSimple: string;
  slots: SlotType[];
  withFood: boolean;
  critical: boolean;
  stockCount: number;
  color: string;
  emoji: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Dose {
  id: string;
  circleId: string;
  medicineId: string;
  date: string; // YYYY-MM-DD
  slot: SlotType;
  status: DoseStatusType;
  takenAt: string | null;
  markedBy: string | null; // memberId or 'system' or 'elder' or 'email-action'
}

export interface Duty {
  id: string;
  circleId: string;
  date: string; // YYYY-MM-DD
  slot: SlotType;
  memberId: string;
  handoffNote?: string;
  updatedAt: string;
}

export interface Checkin {
  id: string;
  circleId: string;
  memberId: string;
  date: string; // YYYY-MM-DD
  mood: number; // 1 (very low) to 5 (great)
  symptoms: string[];
  note?: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  circleId: string;
  doctor: string;
  reason: string;
  datetime: string; // ISO string
  location: string;
  notes?: string;
  questions: string[];
  createdAt: string;
}

export interface ChangeReceipt {
  id: string;
  circleId: string;
  entity: 'medicine' | 'privacy_dials' | 'appointment' | 'slot_times';
  entityId: string;
  description: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  changedBy: string; // memberId
  changedByName: string;
  changedAt: string; // ISO string
  reversedAt: string | null;
  acknowledgedByElder: boolean;
}

export interface Alert {
  id: string;
  circleId: string;
  type: 'upcoming_dose' | 'missed_dose' | 'escalation' | 'low_stock' | 'appointment' | 'emergency';
  targetMemberId: string;
  dedupeKey: string;
  sentAt: string;
  ackAt: string | null;
  resolvedAt: string | null;
  payload: Record<string, unknown>;
}

export interface AuditLogEntry {
  id: string;
  circleId: string;
  action: string;
  actorId: string;
  actorName: string;
  at: string;
  details: Record<string, unknown>;
  prevHash: string;
  hash: string;
}

export interface PatternInsight {
  observation: string;
  evidenceDates: string[];
  confidence: 'high' | 'medium' | 'low';
  questionForDoctor: string;
}

export interface DadiToolCall {
  name: string;
  args: Record<string, unknown>;
}

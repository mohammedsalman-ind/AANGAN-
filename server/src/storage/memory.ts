import crypto from 'crypto';
import type { StorageAdapter } from './adapter.js';
import type {
  Circle,
  Member,
  Medicine,
  Dose,
  Duty,
  Checkin,
  Appointment,
  ChangeReceipt,
  Alert,
  AuditLogEntry,
} from '@aangan/shared';

export class InMemoryStorageAdapter implements StorageAdapter {
  private circles = new Map<string, Circle>();
  private members = new Map<string, Member>();
  private medicines = new Map<string, Medicine>();
  private doses = new Map<string, Dose>();
  private duties = new Map<string, Duty>();
  private checkins = new Map<string, Checkin>();
  private appointments = new Map<string, Appointment>();
  private receipts = new Map<string, ChangeReceipt>();
  private alerts = new Map<string, Alert>();
  private auditLogs: AuditLogEntry[] = [];

  // Circles
  async getCircle(circleId: string): Promise<Circle | null> {
    return this.circles.get(circleId) || null;
  }

  async findCircleByJoinCode(joinCode: string): Promise<Circle | null> {
    const code = joinCode.trim().toUpperCase();
    for (const circle of this.circles.values()) {
      if (circle.joinCode.toUpperCase() === code) {
        return circle;
      }
    }
    return null;
  }

  async createCircle(circle: Circle): Promise<Circle> {
    this.circles.set(circle.id, { ...circle });
    return circle;
  }

  async updateCircle(circleId: string, updates: Partial<Circle>): Promise<Circle | null> {
    const existing = this.circles.get(circleId);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    this.circles.set(circleId, updated);
    return updated;
  }

  // Members
  async getMember(memberId: string): Promise<Member | null> {
    return this.members.get(memberId) || null;
  }

  async getMembersByCircle(circleId: string): Promise<Member[]> {
    return Array.from(this.members.values()).filter((m) => m.circleId === circleId);
  }

  async createMember(member: Member): Promise<Member> {
    this.members.set(member.id, { ...member });
    return member;
  }

  async updateMember(memberId: string, updates: Partial<Member>): Promise<Member | null> {
    const existing = this.members.get(memberId);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    this.members.set(memberId, updated);
    return updated;
  }

  async deleteMember(memberId: string): Promise<boolean> {
    return this.members.delete(memberId);
  }

  // Medicines
  async getMedicine(medicineId: string): Promise<Medicine | null> {
    return this.medicines.get(medicineId) || null;
  }

  async getMedicinesByCircle(circleId: string, onlyActive = false): Promise<Medicine[]> {
    return Array.from(this.medicines.values()).filter(
      (m) => m.circleId === circleId && (!onlyActive || m.active)
    );
  }

  async createMedicine(medicine: Medicine): Promise<Medicine> {
    this.medicines.set(medicine.id, { ...medicine });
    return medicine;
  }

  async updateMedicine(medicineId: string, updates: Partial<Medicine>): Promise<Medicine | null> {
    const existing = this.medicines.get(medicineId);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    this.medicines.set(medicineId, updated);
    return updated;
  }

  // Doses
  async getDose(doseId: string): Promise<Dose | null> {
    return this.doses.get(doseId) || null;
  }

  async getDosesByCircleAndDate(circleId: string, date: string): Promise<Dose[]> {
    return Array.from(this.doses.values()).filter(
      (d) => d.circleId === circleId && d.date === date
    );
  }

  async getDosesByCircleDateRange(
    circleId: string,
    startDate: string,
    endDate: string
  ): Promise<Dose[]> {
    return Array.from(this.doses.values()).filter(
      (d) => d.circleId === circleId && d.date >= startDate && d.date <= endDate
    );
  }

  async createDose(dose: Dose): Promise<Dose> {
    this.doses.set(dose.id, { ...dose });
    return dose;
  }

  async createDoses(doses: Dose[]): Promise<Dose[]> {
    for (const d of doses) {
      this.doses.set(d.id, { ...d });
    }
    return doses;
  }

  async updateDose(doseId: string, updates: Partial<Dose>): Promise<Dose | null> {
    const existing = this.doses.get(doseId);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    this.doses.set(doseId, updated);
    return updated;
  }

  // Duty Roster
  async getDuty(circleId: string, date: string, slot: string): Promise<Duty | null> {
    const key = `${circleId}:${date}:${slot}`;
    return this.duties.get(key) || null;
  }

  async getDutyRosterByCircle(
    circleId: string,
    startDate: string,
    endDate: string
  ): Promise<Duty[]> {
    return Array.from(this.duties.values()).filter(
      (d) => d.circleId === circleId && d.date >= startDate && d.date <= endDate
    );
  }

  async setDuty(duty: Duty): Promise<Duty> {
    const key = `${duty.circleId}:${duty.date}:${duty.slot}`;
    this.duties.set(key, { ...duty });
    return duty;
  }

  // Check-ins
  async getCheckin(checkinId: string): Promise<Checkin | null> {
    return this.checkins.get(checkinId) || null;
  }

  async getCheckinsByCircle(circleId: string, limit = 30): Promise<Checkin[]> {
    return Array.from(this.checkins.values())
      .filter((c) => c.circleId === circleId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit);
  }

  async getCheckinByDate(circleId: string, date: string): Promise<Checkin | null> {
    for (const c of this.checkins.values()) {
      if (c.circleId === circleId && c.date === date) return c;
    }
    return null;
  }

  async createCheckin(checkin: Checkin): Promise<Checkin> {
    this.checkins.set(checkin.id, { ...checkin });
    return checkin;
  }

  // Appointments
  async getAppointment(appointmentId: string): Promise<Appointment | null> {
    return this.appointments.get(appointmentId) || null;
  }

  async getAppointmentsByCircle(circleId: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .filter((a) => a.circleId === circleId)
      .sort((a, b) => a.datetime.localeCompare(b.datetime));
  }

  async createAppointment(appointment: Appointment): Promise<Appointment> {
    this.appointments.set(appointment.id, { ...appointment });
    return appointment;
  }

  async updateAppointment(
    appointmentId: string,
    updates: Partial<Appointment>
  ): Promise<Appointment | null> {
    const existing = this.appointments.get(appointmentId);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    this.appointments.set(appointmentId, updated);
    return updated;
  }

  async deleteAppointment(appointmentId: string): Promise<boolean> {
    return this.appointments.delete(appointmentId);
  }

  // Change Receipts
  async getReceipt(receiptId: string): Promise<ChangeReceipt | null> {
    return this.receipts.get(receiptId) || null;
  }

  async getReceiptsByCircle(circleId: string, limit = 50): Promise<ChangeReceipt[]> {
    return Array.from(this.receipts.values())
      .filter((r) => r.circleId === circleId)
      .sort((a, b) => b.changedAt.localeCompare(a.changedAt))
      .slice(0, limit);
  }

  async createReceipt(receipt: ChangeReceipt): Promise<ChangeReceipt> {
    this.receipts.set(receipt.id, { ...receipt });
    return receipt;
  }

  async updateReceipt(
    receiptId: string,
    updates: Partial<ChangeReceipt>
  ): Promise<ChangeReceipt | null> {
    const existing = this.receipts.get(receiptId);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    this.receipts.set(receiptId, updated);
    return updated;
  }

  // Alerts
  async getAlert(alertId: string): Promise<Alert | null> {
    return this.alerts.get(alertId) || null;
  }

  async getAlertByDedupeKey(dedupeKey: string): Promise<Alert | null> {
    for (const alert of this.alerts.values()) {
      if (alert.dedupeKey === dedupeKey) return alert;
    }
    return null;
  }

  async getAlertsByCircle(circleId: string, limit = 50): Promise<Alert[]> {
    return Array.from(this.alerts.values())
      .filter((a) => a.circleId === circleId)
      .sort((a, b) => b.sentAt.localeCompare(a.sentAt))
      .slice(0, limit);
  }

  async createAlert(alert: Alert): Promise<Alert> {
    this.alerts.set(alert.id, { ...alert });
    return alert;
  }

  async updateAlert(alertId: string, updates: Partial<Alert>): Promise<Alert | null> {
    const existing = this.alerts.get(alertId);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    this.alerts.set(alertId, updated);
    return updated;
  }

  // Hash-chained Audit Log
  async appendAuditLog(
    entry: Omit<AuditLogEntry, 'prevHash' | 'hash'>
  ): Promise<AuditLogEntry> {
    const circleLogs = this.auditLogs.filter((l) => l.circleId === entry.circleId);
    const prevEntry = circleLogs[circleLogs.length - 1];
    const prevHash = prevEntry ? prevEntry.hash : '0000000000000000000000000000000000000000000000000000000000000000';

    const content = `${prevHash}|${entry.circleId}|${entry.action}|${entry.actorId}|${entry.at}|${JSON.stringify(entry.details)}`;
    const hash = crypto.createHash('sha256').update(content).digest('hex');

    const fullEntry: AuditLogEntry = {
      ...entry,
      prevHash,
      hash,
    };
    this.auditLogs.push(fullEntry);
    return fullEntry;
  }

  async getAuditLogsByCircle(circleId: string, limit = 100): Promise<AuditLogEntry[]> {
    return this.auditLogs
      .filter((l) => l.circleId === circleId)
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, limit);
  }
}

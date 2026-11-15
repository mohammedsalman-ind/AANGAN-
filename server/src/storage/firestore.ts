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
import admin from 'firebase-admin';
import crypto from 'crypto';

export class FirestoreStorageAdapter implements StorageAdapter {
  private db: admin.firestore.Firestore;

  constructor(app: admin.app.App) {
    this.db = app.firestore();
  }

  async getCircle(circleId: string): Promise<Circle | null> {
    const doc = await this.db.collection('circles').doc(circleId).get();
    return doc.exists ? (doc.data() as Circle) : null;
  }

  async findCircleByJoinCode(joinCode: string): Promise<Circle | null> {
    const snap = await this.db
      .collection('circles')
      .where('joinCode', '==', joinCode.trim().toUpperCase())
      .limit(1)
      .get();
    if (snap.empty) return null;
    return snap.docs[0].data() as Circle;
  }

  async createCircle(circle: Circle): Promise<Circle> {
    await this.db.collection('circles').doc(circle.id).set(circle);
    return circle;
  }

  async updateCircle(circleId: string, updates: Partial<Circle>): Promise<Circle | null> {
    const ref = this.db.collection('circles').doc(circleId);
    await ref.update(updates);
    const updated = await ref.get();
    return updated.data() as Circle;
  }

  async getMember(memberId: string): Promise<Member | null> {
    const doc = await this.db.collection('members').doc(memberId).get();
    return doc.exists ? (doc.data() as Member) : null;
  }

  async getMembersByCircle(circleId: string): Promise<Member[]> {
    const snap = await this.db.collection('members').where('circleId', '==', circleId).get();
    return snap.docs.map((d) => d.data() as Member);
  }

  async createMember(member: Member): Promise<Member> {
    await this.db.collection('members').doc(member.id).set(member);
    return member;
  }

  async updateMember(memberId: string, updates: Partial<Member>): Promise<Member | null> {
    const ref = this.db.collection('members').doc(memberId);
    await ref.update(updates);
    const updated = await ref.get();
    return updated.data() as Member;
  }

  async deleteMember(memberId: string): Promise<boolean> {
    await this.db.collection('members').doc(memberId).delete();
    return true;
  }

  async getMedicine(medicineId: string): Promise<Medicine | null> {
    const doc = await this.db.collection('medicines').doc(medicineId).get();
    return doc.exists ? (doc.data() as Medicine) : null;
  }

  async getMedicinesByCircle(circleId: string, onlyActive = false): Promise<Medicine[]> {
    let query = this.db.collection('medicines').where('circleId', '==', circleId);
    if (onlyActive) {
      query = query.where('active', '==', true);
    }
    const snap = await query.get();
    return snap.docs.map((d) => d.data() as Medicine);
  }

  async createMedicine(medicine: Medicine): Promise<Medicine> {
    await this.db.collection('medicines').doc(medicine.id).set(medicine);
    return medicine;
  }

  async updateMedicine(medicineId: string, updates: Partial<Medicine>): Promise<Medicine | null> {
    const ref = this.db.collection('medicines').doc(medicineId);
    await ref.update(updates);
    const updated = await ref.get();
    return updated.data() as Medicine;
  }

  async getDose(doseId: string): Promise<Dose | null> {
    const doc = await this.db.collection('doses').doc(doseId).get();
    return doc.exists ? (doc.data() as Dose) : null;
  }

  async getDosesByCircleAndDate(circleId: string, date: string): Promise<Dose[]> {
    const snap = await this.db
      .collection('doses')
      .where('circleId', '==', circleId)
      .where('date', '==', date)
      .get();
    return snap.docs.map((d) => d.data() as Dose);
  }

  async getDosesByCircleDateRange(
    circleId: string,
    startDate: string,
    endDate: string
  ): Promise<Dose[]> {
    const snap = await this.db
      .collection('doses')
      .where('circleId', '==', circleId)
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .get();
    return snap.docs.map((d) => d.data() as Dose);
  }

  async createDose(dose: Dose): Promise<Dose> {
    await this.db.collection('doses').doc(dose.id).set(dose);
    return dose;
  }

  async createDoses(doses: Dose[]): Promise<Dose[]> {
    const batch = this.db.batch();
    for (const d of doses) {
      const ref = this.db.collection('doses').doc(d.id);
      batch.set(ref, d);
    }
    await batch.commit();
    return doses;
  }

  async updateDose(doseId: string, updates: Partial<Dose>): Promise<Dose | null> {
    const ref = this.db.collection('doses').doc(doseId);
    await ref.update(updates);
    const updated = await ref.get();
    return updated.data() as Dose;
  }

  async getDuty(circleId: string, date: string, slot: string): Promise<Duty | null> {
    const id = `${circleId}_${date}_${slot}`;
    const doc = await this.db.collection('duty').doc(id).get();
    return doc.exists ? (doc.data() as Duty) : null;
  }

  async getDutyRosterByCircle(
    circleId: string,
    startDate: string,
    endDate: string
  ): Promise<Duty[]> {
    const snap = await this.db
      .collection('duty')
      .where('circleId', '==', circleId)
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .get();
    return snap.docs.map((d) => d.data() as Duty);
  }

  async setDuty(duty: Duty): Promise<Duty> {
    const id = `${duty.circleId}_${duty.date}_${duty.slot}`;
    await this.db.collection('duty').doc(id).set(duty);
    return duty;
  }

  async getCheckin(checkinId: string): Promise<Checkin | null> {
    const doc = await this.db.collection('checkins').doc(checkinId).get();
    return doc.exists ? (doc.data() as Checkin) : null;
  }

  async getCheckinsByCircle(circleId: string, limit = 30): Promise<Checkin[]> {
    const snap = await this.db
      .collection('checkins')
      .where('circleId', '==', circleId)
      .orderBy('date', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map((d) => d.data() as Checkin);
  }

  async getCheckinByDate(circleId: string, date: string): Promise<Checkin | null> {
    const snap = await this.db
      .collection('checkins')
      .where('circleId', '==', circleId)
      .where('date', '==', date)
      .limit(1)
      .get();
    if (snap.empty) return null;
    return snap.docs[0].data() as Checkin;
  }

  async createCheckin(checkin: Checkin): Promise<Checkin> {
    await this.db.collection('checkins').doc(checkin.id).set(checkin);
    return checkin;
  }

  async getAppointment(appointmentId: string): Promise<Appointment | null> {
    const doc = await this.db.collection('appointments').doc(appointmentId).get();
    return doc.exists ? (doc.data() as Appointment) : null;
  }

  async getAppointmentsByCircle(circleId: string): Promise<Appointment[]> {
    const snap = await this.db
      .collection('appointments')
      .where('circleId', '==', circleId)
      .orderBy('datetime', 'asc')
      .get();
    return snap.docs.map((d) => d.data() as Appointment);
  }

  async createAppointment(appointment: Appointment): Promise<Appointment> {
    await this.db.collection('appointments').doc(appointment.id).set(appointment);
    return appointment;
  }

  async updateAppointment(
    appointmentId: string,
    updates: Partial<Appointment>
  ): Promise<Appointment | null> {
    const ref = this.db.collection('appointments').doc(appointmentId);
    await ref.update(updates);
    const updated = await ref.get();
    return updated.data() as Appointment;
  }

  async deleteAppointment(appointmentId: string): Promise<boolean> {
    await this.db.collection('appointments').doc(appointmentId).delete();
    return true;
  }

  async getReceipt(receiptId: string): Promise<ChangeReceipt | null> {
    const doc = await this.db.collection('receipts').doc(receiptId).get();
    return doc.exists ? (doc.data() as ChangeReceipt) : null;
  }

  async getReceiptsByCircle(circleId: string, limit = 50): Promise<ChangeReceipt[]> {
    const snap = await this.db
      .collection('receipts')
      .where('circleId', '==', circleId)
      .orderBy('changedAt', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map((d) => d.data() as ChangeReceipt);
  }

  async createReceipt(receipt: ChangeReceipt): Promise<ChangeReceipt> {
    await this.db.collection('receipts').doc(receipt.id).set(receipt);
    return receipt;
  }

  async updateReceipt(
    receiptId: string,
    updates: Partial<ChangeReceipt>
  ): Promise<ChangeReceipt | null> {
    const ref = this.db.collection('receipts').doc(receiptId);
    await ref.update(updates);
    const updated = await ref.get();
    return updated.data() as ChangeReceipt;
  }

  async getAlert(alertId: string): Promise<Alert | null> {
    const doc = await this.db.collection('alerts').doc(alertId).get();
    return doc.exists ? (doc.data() as Alert) : null;
  }

  async getAlertByDedupeKey(dedupeKey: string): Promise<Alert | null> {
    const snap = await this.db
      .collection('alerts')
      .where('dedupeKey', '==', dedupeKey)
      .limit(1)
      .get();
    if (snap.empty) return null;
    return snap.docs[0].data() as Alert;
  }

  async getAlertsByCircle(circleId: string, limit = 50): Promise<Alert[]> {
    const snap = await this.db
      .collection('alerts')
      .where('circleId', '==', circleId)
      .orderBy('sentAt', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map((d) => d.data() as Alert);
  }

  async createAlert(alert: Alert): Promise<Alert> {
    await this.db.collection('alerts').doc(alert.id).set(alert);
    return alert;
  }

  async updateAlert(alertId: string, updates: Partial<Alert>): Promise<Alert | null> {
    const ref = this.db.collection('alerts').doc(alertId);
    await ref.update(updates);
    const updated = await ref.get();
    return updated.data() as Alert;
  }

  async appendAuditLog(
    entry: Omit<AuditLogEntry, 'prevHash' | 'hash'>
  ): Promise<AuditLogEntry> {
    const snap = await this.db
      .collection('auditLogs')
      .where('circleId', '==', entry.circleId)
      .orderBy('at', 'desc')
      .limit(1)
      .get();

    const prevHash = snap.empty
      ? '0000000000000000000000000000000000000000000000000000000000000000'
      : (snap.docs[0].data().hash as string);

    const content = `${prevHash}|${entry.circleId}|${entry.action}|${entry.actorId}|${entry.at}|${JSON.stringify(entry.details)}`;
    const hash = crypto.createHash('sha256').update(content).digest('hex');

    const fullEntry: AuditLogEntry = {
      ...entry,
      prevHash,
      hash,
    };
    await this.db.collection('auditLogs').doc(fullEntry.id).set(fullEntry);
    return fullEntry;
  }

  async getAuditLogsByCircle(circleId: string, limit = 100): Promise<AuditLogEntry[]> {
    const snap = await this.db
      .collection('auditLogs')
      .where('circleId', '==', circleId)
      .orderBy('at', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map((d) => d.data() as AuditLogEntry);
  }
}

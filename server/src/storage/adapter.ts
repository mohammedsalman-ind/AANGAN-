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

export interface StorageAdapter {
  // Circles
  getCircle(circleId: string): Promise<Circle | null>;
  findCircleByJoinCode(joinCode: string): Promise<Circle | null>;
  createCircle(circle: Circle): Promise<Circle>;
  updateCircle(circleId: string, updates: Partial<Circle>): Promise<Circle | null>;

  // Members
  getMember(memberId: string): Promise<Member | null>;
  getMembersByCircle(circleId: string): Promise<Member[]>;
  createMember(member: Member): Promise<Member>;
  updateMember(memberId: string, updates: Partial<Member>): Promise<Member | null>;
  deleteMember(memberId: string): Promise<boolean>;

  // Medicines
  getMedicine(medicineId: string): Promise<Medicine | null>;
  getMedicinesByCircle(circleId: string, onlyActive?: boolean): Promise<Medicine[]>;
  createMedicine(medicine: Medicine): Promise<Medicine>;
  updateMedicine(medicineId: string, updates: Partial<Medicine>): Promise<Medicine | null>;

  // Doses
  getDose(doseId: string): Promise<Dose | null>;
  getDosesByCircleAndDate(circleId: string, date: string): Promise<Dose[]>;
  getDosesByCircleDateRange(circleId: string, startDate: string, endDate: string): Promise<Dose[]>;
  createDose(dose: Dose): Promise<Dose>;
  createDoses(doses: Dose[]): Promise<Dose[]>;
  updateDose(doseId: string, updates: Partial<Dose>): Promise<Dose | null>;

  // Duty Roster
  getDuty(circleId: string, date: string, slot: string): Promise<Duty | null>;
  getDutyRosterByCircle(circleId: string, startDate: string, endDate: string): Promise<Duty[]>;
  setDuty(duty: Duty): Promise<Duty>;

  // Check-ins
  getCheckin(checkinId: string): Promise<Checkin | null>;
  getCheckinsByCircle(circleId: string, limit?: number): Promise<Checkin[]>;
  getCheckinByDate(circleId: string, date: string): Promise<Checkin | null>;
  createCheckin(checkin: Checkin): Promise<Checkin>;

  // Appointments
  getAppointment(appointmentId: string): Promise<Appointment | null>;
  getAppointmentsByCircle(circleId: string): Promise<Appointment[]>;
  createAppointment(appointment: Appointment): Promise<Appointment>;
  updateAppointment(appointmentId: string, updates: Partial<Appointment>): Promise<Appointment | null>;
  deleteAppointment(appointmentId: string): Promise<boolean>;

  // Change Receipts
  getReceipt(receiptId: string): Promise<ChangeReceipt | null>;
  getReceiptsByCircle(circleId: string, limit?: number): Promise<ChangeReceipt[]>;
  createReceipt(receipt: ChangeReceipt): Promise<ChangeReceipt>;
  updateReceipt(receiptId: string, updates: Partial<ChangeReceipt>): Promise<ChangeReceipt | null>;

  // Alerts
  getAlert(alertId: string): Promise<Alert | null>;
  getAlertByDedupeKey(dedupeKey: string): Promise<Alert | null>;
  getAlertsByCircle(circleId: string, limit?: number): Promise<Alert[]>;
  createAlert(alert: Alert): Promise<Alert>;
  updateAlert(alertId: string, updates: Partial<Alert>): Promise<Alert | null>;

  // Audit Log
  appendAuditLog(entry: Omit<AuditLogEntry, 'prevHash' | 'hash'>): Promise<AuditLogEntry>;
  getAuditLogsByCircle(circleId: string, limit?: number): Promise<AuditLogEntry[]>;
}

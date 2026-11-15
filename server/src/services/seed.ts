import type { StorageAdapter } from '../storage/adapter.js';
import { hashPin } from '../auth/pin.js';
import type {
  Circle,
  Member,
  Medicine,
  Dose,
  Duty,
  Appointment,
  Checkin,
  SlotType,
  DoseStatusType,
} from '@aangan/shared';

export async function seedDatabase(storage: StorageAdapter): Promise<void> {
  const existingCircle = await storage.findCircleByJoinCode('AANGAN');
  if (existingCircle) {
    console.log('[Seed] Circle AANGAN already exists, skipping seed.');
    return;
  }

  console.log('[Seed] Seeding Aangan demo database...');

  const circleId = 'circle-sharma-1';
  const circle: Circle = {
    id: circleId,
    name: 'Sharma Aangan',
    joinCode: 'AANGAN',
    slotTimes: {
      subah: '08:00',
      dopahar: '13:00',
      shaam: '18:00',
      raat: '21:30',
    },
    missedAlertAfterMin: 30,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
  await storage.createCircle(circle);

  // Members
  const dadajiPinHash = await hashPin('1111');
  const priyaPinHash = await hashPin('2222');
  const rahulPinHash = await hashPin('3333');

  const dadaji: Member = {
    id: 'member-dadaji',
    circleId,
    name: 'Dadaji',
    role: 'elder',
    avatar: { emoji: '👴', color: '#C4572E' },
    email: 'dadaji@aangan.family',
    pinHash: dadajiPinHash,
    privacyDials: {
      canSeeAdherence: true,
      canSeeCheckins: true,
      canSeeAppointments: true,
      canEditMedicines: true,
      getMissedAlerts: true,
      missedAlertDelayMin: 0,
    },
    failedAttempts: 0,
    lockedUntil: null,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const priya: Member = {
    id: 'member-priya',
    circleId,
    name: 'Priya',
    role: 'caretaker',
    avatar: { emoji: '👩', color: '#F2A93B' },
    email: 'priya@aangan.family',
    pinHash: priyaPinHash,
    privacyDials: {
      canSeeAdherence: true,
      canSeeCheckins: true,
      canSeeAppointments: true,
      canEditMedicines: true,
      getMissedAlerts: true,
      missedAlertDelayMin: 15,
    },
    failedAttempts: 0,
    lockedUntil: null,
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const rahul: Member = {
    id: 'member-rahul',
    circleId,
    name: 'Rahul',
    role: 'family',
    avatar: { emoji: '👨', color: '#3F4A2B' },
    email: 'rahul@aangan.family',
    pinHash: rahulPinHash,
    privacyDials: {
      canSeeAdherence: true,
      canSeeCheckins: false, // Elder kept checkins private from Rahul
      canSeeAppointments: true,
      canEditMedicines: false, // Rahul can only view medicines, not edit
      getMissedAlerts: true,
      missedAlertDelayMin: 45,
    },
    failedAttempts: 0,
    lockedUntil: null,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  };

  await storage.createMember(dadaji);
  await storage.createMember(priya);
  await storage.createMember(rahul);

  // 5 Realistic generic medicines
  const medicines: Medicine[] = [
    {
      id: 'med-metformin',
      circleId,
      name: 'Metformin',
      strength: '500 mg',
      purposeSimple: 'Sugar control (Blood glucose)',
      slots: ['subah', 'raat'],
      withFood: true,
      critical: true,
      stockCount: 18,
      color: '#C4572E',
      emoji: '💊',
      active: true,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'med-telmisartan',
      circleId,
      name: 'Telmisartan',
      strength: '40 mg',
      purposeSimple: 'BP (Blood pressure) maintenance',
      slots: ['subah'],
      withFood: false,
      critical: true,
      stockCount: 24,
      color: '#F2A93B',
      emoji: '🫀',
      active: true,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'med-pantoprazole',
      circleId,
      name: 'Pantoprazole',
      strength: '40 mg',
      purposeSimple: 'Gas & acidity prevention',
      slots: ['subah'],
      withFood: false,
      critical: false,
      stockCount: 14,
      color: '#3F4A2B',
      emoji: '🛡️',
      active: true,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'med-calcium',
      circleId,
      name: 'Calcium + Vit D3',
      strength: '500 mg',
      purposeSimple: 'Haddiyon ki taakat (Bone health)',
      slots: ['dopahar'],
      withFood: true,
      critical: false,
      stockCount: 3, // Low stock: <= 3 days left!
      color: '#DDE5C8',
      emoji: '🦴',
      active: true,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'med-atorvastatin',
      circleId,
      name: 'Atorvastatin',
      strength: '10 mg',
      purposeSimple: 'Cholesterol control',
      slots: ['raat'],
      withFood: false,
      critical: true,
      stockCount: 22,
      color: '#B3261E',
      emoji: '🩸',
      active: true,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  for (const m of medicines) {
    await storage.createMedicine(m);
  }

  // 14 days of dose history (from -13 days to today 0)
  const today = new Date();
  const doses: Dose[] = [];

  for (let offset = -13; offset <= 0; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const dateStr = d.toISOString().split('T')[0];

    for (const med of medicines) {
      for (const slot of med.slots) {
        let status: DoseStatusType = 'taken';
        let takenAt: string | null = `${dateStr}T${circle.slotTimes[slot]}:00.000Z`;
        let markedBy: string | null = 'member-dadaji';

        if (offset === 0) {
          // Today: Subah taken, others pending
          if (slot === 'subah') {
            status = 'taken';
            takenAt = new Date().toISOString();
          } else {
            status = 'pending';
            takenAt = null;
            markedBy = null;
          }
        } else {
          // In the past 14 days: simulate realistic missed doses
          if (offset === -3 && slot === 'dopahar' && med.id === 'med-calcium') {
            status = 'missed';
            takenAt = null;
            markedBy = null;
          } else if (offset === -7 && slot === 'raat' && med.id === 'med-metformin') {
            status = 'missed';
            takenAt = null;
            markedBy = null;
          } else if (offset === -10 && slot === 'subah' && med.id === 'med-telmisartan') {
            status = 'missed';
            takenAt = null;
            markedBy = null;
          }
        }

        doses.push({
          id: `dose-${med.id}-${dateStr}-${slot}`,
          circleId,
          medicineId: med.id,
          date: dateStr,
          slot,
          status,
          takenAt,
          markedBy,
        });
      }
    }
  }

  await storage.createDoses(doses);

  // 2 Realistic appointments
  const appt1Date = new Date(today);
  appt1Date.setDate(today.getDate() + 3);
  appt1Date.setHours(10, 30, 0, 0);

  const appt2Date = new Date(today);
  appt2Date.setDate(today.getDate() + 10);
  appt2Date.setHours(16, 0, 0, 0);

  const appt1: Appointment = {
    id: 'appt-1',
    circleId,
    doctor: 'Dr. Arun Mehta (Cardiologist)',
    reason: 'Quarterly BP & Heart checkup',
    datetime: appt1Date.toISOString(),
    location: 'Apollo Clinic, Sector 14, Room 102',
    notes: 'Bring previous ECG and blood reports.',
    questions: [
      'Subah walk ke baad halka chakkar aata hai, dosage badle?',
      'Kya Telmisartan ke saath nariyal pani peena theek hai?',
    ],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const appt2: Appointment = {
    id: 'appt-2',
    circleId,
    doctor: 'Dr. Sunita Rao (Endocrinologist)',
    reason: 'HbA1c review & Diabetes plan',
    datetime: appt2Date.toISOString(),
    location: 'Fortis Hospital, OPD Block B',
    notes: 'Empty stomach fasting sugar test before visit.',
    questions: ['Metformin ke baad pet me thoda heavy lagta hai.'],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  };

  await storage.createAppointment(appt1);
  await storage.createAppointment(appt2);

  // Duty Roster (Today + next 6 days)
  const slotList: SlotType[] = ['subah', 'dopahar', 'shaam', 'raat'];
  for (let i = 0; i < 7; i++) {
    const curDate = new Date(today);
    curDate.setDate(today.getDate() + i);
    const dateStr = curDate.toISOString().split('T')[0];
    const isWeekend = curDate.getDay() === 0 || curDate.getDay() === 6;

    for (const slot of slotList) {
      // Priya on weekdays, Rahul on weekends / nights
      const assignedMember = isWeekend || slot === 'raat' ? 'member-rahul' : 'member-priya';
      const note =
        slot === 'subah'
          ? 'Subah walk ke baad Telmisartan zarur dilwana'
          : slot === 'raat'
            ? 'Doodh ke saath Atorvastatin dijiye'
            : undefined;

      const duty: Duty = {
        id: `duty-${circleId}-${dateStr}-${slot}`,
        circleId,
        date: dateStr,
        slot,
        memberId: assignedMember,
        handoffNote: note,
        updatedAt: new Date().toISOString(),
      };
      await storage.setDuty(duty);
    }
  }

  // 7 Days of Check-ins
  const symptomsOptions = ['chakkar', 'kamzori', 'theek_hoon', 'neend_nahi'];
  for (let i = -7; i <= 0; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const mood = i === -3 ? 2 : i === -7 ? 2 : i === -1 ? 4 : 5;
    const symptoms = i === -3 ? ['chakkar'] : i === -7 ? ['kamzori', 'neend_nahi'] : ['theek_hoon'];

    const checkin: Checkin = {
      id: `checkin-${dateStr}`,
      circleId,
      memberId: 'member-dadaji',
      date: dateStr,
      mood,
      symptoms,
      note: i === -3 ? 'Thoda chakkar aaya subah dawai miss hone ke baad' : 'Tabiyat theek hai',
      createdAt: `${dateStr}T20:00:00.000Z`,
    };
    await storage.createCheckin(checkin);
  }

  // Initial Change Receipt for demonstration
  await storage.createReceipt({
    id: 'receipt-seed-1',
    circleId,
    entity: 'medicine',
    entityId: 'med-pantoprazole',
    description: 'Priya ne Pantoprazole ka timing Subah khali pet fix kiya',
    before: { withFood: true },
    after: { withFood: false },
    changedBy: 'member-priya',
    changedByName: 'Priya',
    changedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    reversedAt: null,
    acknowledgedByElder: false,
  });

  // Genesis Audit Log Entry
  await storage.appendAuditLog({
    id: 'audit-seed-genesis',
    circleId,
    action: 'CIRCLE_INITIALIZED',
    actorId: 'member-dadaji',
    actorName: 'Dadaji',
    at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    details: { message: 'Sharma Aangan created with join code AANGAN' },
  });

  console.log('[Seed] Database successfully seeded with Sharma Aangan!');
}

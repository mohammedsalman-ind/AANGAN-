import type { StorageAdapter } from '../storage/adapter.js';
import type { Dose, SlotType } from '@aangan/shared';

// Converts time HH:MM on a given YYYY-MM-DD date to a Date object in local time
function getSlotDateTime(dateStr: string, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(dateStr + 'T00:00:00');
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

export async function materializeDosesForDate(
  storage: StorageAdapter,
  circleId: string,
  dateStr: string
): Promise<Dose[]> {
  const circle = await storage.getCircle(circleId);
  if (!circle) return [];

  const medicines = await storage.getMedicinesByCircle(circleId, true);
  const existingDoses = await storage.getDosesByCircleAndDate(circleId, dateStr);

  const existingMap = new Map<string, Dose>();
  for (const d of existingDoses) {
    existingMap.set(`${d.medicineId}:${d.slot}`, d);
  }

  const newDoses: Dose[] = [];

  for (const med of medicines) {
    for (const slot of med.slots) {
      const key = `${med.id}:${slot}`;
      if (!existingMap.has(key)) {
        const newDose: Dose = {
          id: `dose-${med.id}-${dateStr}-${slot}`,
          circleId,
          medicineId: med.id,
          date: dateStr,
          slot,
          status: 'pending',
          takenAt: null,
          markedBy: null,
        };
        newDoses.push(newDose);
        existingMap.set(key, newDose);
      }
    }
  }

  if (newDoses.length > 0) {
    await storage.createDoses(newDoses);
  }

  return Array.from(existingMap.values());
}

export async function evaluateOverdueDoses(
  storage: StorageAdapter,
  circleId: string,
  now = new Date()
): Promise<Dose[]> {
  const circle = await storage.getCircle(circleId);
  if (!circle) return [];

  const todayStr = now.toISOString().split('T')[0];
  const doses = await storage.getDosesByCircleAndDate(circleId, todayStr);
  const updatedDoses: Dose[] = [];

  for (const dose of doses) {
    if (dose.status === 'pending') {
      const slotTimeStr = circle.slotTimes[dose.slot] || '12:00';
      const slotDateTime = getSlotDateTime(todayStr, slotTimeStr);
      const overdueThresholdMs =
        slotDateTime.getTime() + (circle.missedAlertAfterMin || 30) * 60 * 1000;

      if (now.getTime() > overdueThresholdMs) {
        const updated = await storage.updateDose(dose.id, {
          status: 'missed',
        });
        if (updated) updatedDoses.push(updated);
      }
    }
  }

  return updatedDoses;
}

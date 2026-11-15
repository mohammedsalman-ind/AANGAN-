import crypto from 'crypto';
import type { StorageAdapter } from '../storage/adapter.js';
import {
  sendMissedDoseAlert,
  sendLowStockAlert,
  sendAppointmentReminder,
  sendAanganEmail,
} from './email.js';
import { evaluateOverdueDoses } from './doseMaterializer.js';
import type { Circle, Member, Medicine, Dose, Alert, SlotType } from '@aangan/shared';

// Helper to calculate minutes between two ISO/Date objects
function minutesDiff(d1: Date, d2: Date): number {
  return (d1.getTime() - d2.getTime()) / (60 * 1000);
}

export class AlertEngine {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  // Main tick function invoked by node-cron every minute
  async runTick(circleId?: string, forcedNow = new Date()): Promise<{ evaluatedCount: number; alertsSent: number }> {
    let circles: Circle[] = [];
    if (circleId) {
      const c = await this.storage.getCircle(circleId);
      if (c) circles = [c];
    } else {
      // In-memory or database circles
      const circleAangan = await this.storage.findCircleByJoinCode('AANGAN');
      if (circleAangan) circles.push(circleAangan);
    }

    let alertsSent = 0;
    let evaluatedCount = 0;

    for (const circle of circles) {
      evaluatedCount++;
      const sent = await this.processCircle(circle, forcedNow);
      alertsSent += sent;
    }

    return { evaluatedCount, alertsSent };
  }

  private async processCircle(circle: Circle, now: Date): Promise<number> {
    let sentCount = 0;
    const members = await this.storage.getMembersByCircle(circle.id);
    const elder = members.find((m) => m.role === 'elder');
    const elderName = elder ? elder.name : 'Dadaji';

    const dateStr = now.toISOString().split('T')[0];

    // 1. Evaluate Overdue Doses for Today
    await evaluateOverdueDoses(this.storage, circle.id, now);

    const todayDoses = await this.storage.getDosesByCircleAndDate(circle.id, dateStr);
    const medicines = await this.storage.getMedicinesByCircle(circle.id, true);
    const medMap = new Map<string, Medicine>(medicines.map((m) => [m.id, m]));

    // Group doses by slot
    const slotDoses = new Map<SlotType, Dose[]>();
    for (const dose of todayDoses) {
      if (!slotDoses.has(dose.slot)) slotDoses.set(dose.slot, []);
      slotDoses.get(dose.slot)!.push(dose);
    }

    for (const [slot, doses] of slotDoses.entries()) {
      const missedDoses = doses.filter((d) => d.status === 'missed');
      if (missedDoses.length === 0) continue;

      // Find who is on duty for this date and slot
      const duty = await this.storage.getDuty(circle.id, dateStr, slot);
      const onDutyMemberId = duty?.memberId || members.find((m) => m.role === 'caretaker')?.id || elder?.id;
      const onDutyMember = members.find((m) => m.id === onDutyMemberId);

      // Check if primary alert was already sent
      const primaryDedupeKey = `missed:${circle.id}:${dateStr}:${slot}:primary`;
      let primaryAlert = await this.storage.getAlertByDedupeKey(primaryDedupeKey);

      const missedMeds = missedDoses
        .map((d) => medMap.get(d.medicineId))
        .filter((m): m is Medicine => !!m);

      const hasCritical = missedMeds.some((m) => m.critical);

      if (!primaryAlert && onDutyMember) {
        // Send initial missed dose alert to On-Duty member
        const alertId = 'alert-' + crypto.randomUUID();
        primaryAlert = {
          id: alertId,
          circleId: circle.id,
          type: 'missed_dose',
          targetMemberId: onDutyMember.id,
          dedupeKey: primaryDedupeKey,
          sentAt: now.toISOString(),
          ackAt: null,
          resolvedAt: null,
          payload: {
            slot,
            date: dateStr,
            medicineIds: missedMeds.map((m) => m.id),
            hasCritical,
          },
        };
        await this.storage.createAlert(primaryAlert);

        if (onDutyMember.email) {
          await sendMissedDoseAlert({
            toEmail: onDutyMember.email,
            memberName: onDutyMember.name,
            elderName,
            slot,
            medicines: missedMeds,
            circleId: circle.id,
            memberId: onDutyMember.id,
            doseId: missedDoses[0]?.id,
            alertId,
            isEscalation: false,
          });
          sentCount++;
        }
      }

      // Check if escalation is required (if unacknowledged after delay)
      if (primaryAlert && !primaryAlert.ackAt && !primaryAlert.resolvedAt) {
        const minutesSincePrimary = minutesDiff(now, new Date(primaryAlert.sentAt));
        const onDutyDelay = onDutyMember?.privacyDials?.missedAlertDelayMin ?? 15;
        // Critical meds escalate 50% faster
        const effectiveDelay = hasCritical ? Math.max(5, Math.floor(onDutyDelay / 2)) : onDutyDelay;

        if (minutesSincePrimary >= effectiveDelay) {
          // Escalate to other family/caretakers who have getMissedAlerts=true
          const escalationDedupeKey = `missed:${circle.id}:${dateStr}:${slot}:escalation`;
          const existingEscalation = await this.storage.getAlertByDedupeKey(escalationDedupeKey);

          if (!existingEscalation) {
            const backups = members.filter(
              (m) =>
                m.id !== onDutyMember?.id &&
                m.privacyDials?.getMissedAlerts === true &&
                m.email
            );

            for (const backup of backups) {
              const escAlertId = 'alert-esc-' + crypto.randomUUID();
              await this.storage.createAlert({
                id: escAlertId,
                circleId: circle.id,
                type: 'escalation',
                targetMemberId: backup.id,
                dedupeKey: `${escalationDedupeKey}:${backup.id}`,
                sentAt: now.toISOString(),
                ackAt: null,
                resolvedAt: null,
                payload: { slot, date: dateStr, primaryTarget: onDutyMember?.name },
              });

              await sendMissedDoseAlert({
                toEmail: backup.email,
                memberName: backup.name,
                elderName,
                slot,
                medicines: missedMeds,
                circleId: circle.id,
                memberId: backup.id,
                doseId: missedDoses[0]?.id,
                alertId: escAlertId,
                isEscalation: true,
              });
              sentCount++;
            }
          }
        }
      }
    }

    // 2. Low Stock Alerts (Medicines with <= 3 days stock)
    for (const med of medicines) {
      if (med.stockCount <= 3) {
        const stockDedupeKey = `stock:${circle.id}:${med.id}:${dateStr}`;
        const existingAlert = await this.storage.getAlertByDedupeKey(stockDedupeKey);

        if (!existingAlert) {
          const alertId = 'alert-stock-' + crypto.randomUUID();
          const target = members.find((m) => m.role === 'caretaker') || elder;
          if (target && target.email) {
            await this.storage.createAlert({
              id: alertId,
              circleId: circle.id,
              type: 'low_stock',
              targetMemberId: target.id,
              dedupeKey: stockDedupeKey,
              sentAt: now.toISOString(),
              ackAt: null,
              resolvedAt: null,
              payload: { medicineId: med.id, stockCount: med.stockCount },
            });

            await sendLowStockAlert({
              toEmail: target.email,
              memberName: target.name,
              elderName,
              medicineName: med.name,
              stockCount: med.stockCount,
            });
            sentCount++;
          }
        }
      }
    }

    // 3. Appointment Reminders (1 day before & 2 hours before)
    const appointments = await this.storage.getAppointmentsByCircle(circle.id);
    for (const appt of appointments) {
      const apptTime = new Date(appt.datetime);
      const diffHours = (apptTime.getTime() - now.getTime()) / (60 * 60 * 1000);

      // Check 1-day reminder (between 23 and 25 hours before)
      if (diffHours > 23 && diffHours <= 25) {
        const dedupeKey = `appt-1day:${appt.id}`;
        if (!(await this.storage.getAlertByDedupeKey(dedupeKey))) {
          await this.dispatchAppointmentReminder(circle, members, appt, dedupeKey, 'Kal (Tomorrow)', now);
          sentCount++;
        }
      }

      // Check 2-hours reminder (between 1.5 and 2.5 hours before)
      if (diffHours > 1.5 && diffHours <= 2.5) {
        const dedupeKey = `appt-2hr:${appt.id}`;
        if (!(await this.storage.getAlertByDedupeKey(dedupeKey))) {
          await this.dispatchAppointmentReminder(circle, members, appt, dedupeKey, '2 ghante me', now);
          sentCount++;
        }
      }
    }

    return sentCount;
  }

  private async dispatchAppointmentReminder(
    circle: Circle,
    members: Member[],
    appt: any,
    dedupeKey: string,
    timingNotice: string,
    now: Date
  ) {
    const elder = members.find((m) => m.role === 'elder');
    const recipients = members.filter(
      (m) => (m.role === 'elder' || m.privacyDials?.canSeeAppointments) && m.email
    );

    for (const r of recipients) {
      await this.storage.createAlert({
        id: 'alert-' + crypto.randomUUID(),
        circleId: circle.id,
        type: 'appointment',
        targetMemberId: r.id,
        dedupeKey: `${dedupeKey}:${r.id}`,
        sentAt: now.toISOString(),
        ackAt: null,
        resolvedAt: null,
        payload: { apptId: appt.id, timingNotice },
      });

      await sendAppointmentReminder({
        toEmail: r.email,
        memberName: r.name,
        elderName: elder ? elder.name : 'Dadaji',
        doctor: appt.doctor,
        reason: appt.reason,
        datetimeFormatted: new Date(appt.datetime).toLocaleString('hi-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        location: appt.location,
        timingNotice,
      });
    }
  }
}

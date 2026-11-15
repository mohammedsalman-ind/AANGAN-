import nodemailer from 'nodemailer';
import { CONFIG } from '../config.js';
import { signActionToken } from '../auth/jwt.js';

export interface SentEmailRecord {
  id: string;
  to: string;
  subject: string;
  html: string;
  sentAt: string;
  type: string;
  actionUrls?: {
    ackUrl?: string;
    takenUrl?: string;
  };
}

export const emailInboxStore: SentEmailRecord[] = [];

let transporter: nodemailer.Transporter | null = null;

if (CONFIG.smtp.user && CONFIG.smtp.pass) {
  try {
    transporter = nodemailer.createTransport({
      host: CONFIG.smtp.host,
      port: CONFIG.smtp.port,
      secure: CONFIG.smtp.port === 465,
      auth: {
        user: CONFIG.smtp.user,
        pass: CONFIG.smtp.pass,
      },
    });
  } catch (err) {
    console.warn('[Email] Could not create SMTP transporter, using in-memory inbox:', err);
  }
}

export function generateActionUrls(params: {
  circleId: string;
  memberId: string;
  doseId?: string;
  alertId?: string;
}) {
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  const ackToken = signActionToken({
    action: 'ack_missed',
    circleId: params.circleId,
    memberId: params.memberId,
    doseId: params.doseId,
    alertId: params.alertId,
    expiresAt,
    nonce: Math.random().toString(36).substring(2),
  });

  const takenToken = signActionToken({
    action: 'mark_taken',
    circleId: params.circleId,
    memberId: params.memberId,
    doseId: params.doseId,
    alertId: params.alertId,
    expiresAt,
    nonce: Math.random().toString(36).substring(2),
  });

  const baseUrl = CONFIG.clientUrl || 'http://localhost:5173';
  return {
    ackUrl: `${baseUrl}/action?token=${ackToken}`,
    takenUrl: `${baseUrl}/action?token=${takenToken}`,
  };
}

function emailWrapper(title: string, bodyContent: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #FFF8EC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #3F4A2B;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(196, 87, 46, 0.08); border: 1px solid #E8DCC9;">
    <!-- Header with terracotta accent & Kolam motif -->
    <div style="background-color: #C4572E; padding: 24px 32px; text-align: center; color: #FFF8EC;">
      <h1 style="margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 1px;">आँगन • AANGAN</h1>
      <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">Ghar Ka Digital Pillbox & Courtyard</p>
    </div>

    <!-- Body content -->
    <div style="padding: 32px;">
      ${bodyContent}
    </div>

    <!-- Footer -->
    <div style="background-color: #F8F4EE; padding: 18px 32px; text-align: center; font-size: 13px; color: #7B856B; border-top: 1px solid #E8DCC9;">
      <p style="margin: 0;">Yeh email Aangan dwara bheja gaya hai. Dadaji ke swasthya aur suraksha ke liye.</p>
      <p style="margin: 4px 0 0 0;">Har sadasya ki zimmedari, ek hi aangan me.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendAanganEmail(options: {
  to: string;
  subject: string;
  html: string;
  type: string;
  actionUrls?: { ackUrl?: string; takenUrl?: string };
}): Promise<SentEmailRecord> {
  const wrappedHtml = emailWrapper(options.subject, options.html);

  const record: SentEmailRecord = {
    id: 'mail-' + Math.random().toString(36).substring(2, 10),
    to: options.to,
    subject: options.subject,
    html: wrappedHtml,
    sentAt: new Date().toISOString(),
    type: options.type,
    actionUrls: options.actionUrls,
  };

  // Keep last 20 emails in memory buffer for demo / judge review
  emailInboxStore.unshift(record);
  if (emailInboxStore.length > 20) {
    emailInboxStore.pop();
  }

  if (transporter && options.to && !options.to.endsWith('@aangan.family')) {
    try {
      await transporter.sendMail({
        from: CONFIG.smtp.from,
        to: options.to,
        subject: options.subject,
        html: wrappedHtml,
      });
      console.log(`[Email] SMTP successfully delivered email to: ${options.to}`);
    } catch (err) {
      console.warn(`[Email] SMTP delivery failed for ${options.to}, stored in /demo inbox viewer:`, err);
    }
  } else {
    console.log(`[Email] Saved to In-Memory Demo Inbox [${options.type}] -> ${options.to} ("${options.subject}")`);
  }

  return record;
}

// --------------------------------------------------------------------
// Specific Email Builders
// --------------------------------------------------------------------

export async function sendMissedDoseAlert(params: {
  toEmail: string;
  memberName: string;
  elderName: string;
  slot: string;
  medicines: Array<{ name: string; strength: string; critical: boolean }>;
  circleId: string;
  memberId: string;
  doseId?: string;
  alertId?: string;
  isEscalation?: boolean;
}) {
  const actionUrls = generateActionUrls({
    circleId: params.circleId,
    memberId: params.memberId,
    doseId: params.doseId,
    alertId: params.alertId,
  });

  const medListHtml = params.medicines
    .map(
      (m) =>
        `<li style="margin-bottom: 6px;"><strong>${m.name}</strong> (${m.strength}) ${
          m.critical ? '<span style="color: #B3261E; font-weight: bold;">[Zaroori / Critical]</span>' : ''
        }</li>`
    )
    .join('');

  const headline = params.isEscalation
    ? `⚠️ URGENT ESCALATION: ${params.elderName} ki dawai chhoot gayi hai`
    : `⚠️ Dhyan Dein: ${params.elderName} ki ${params.slot.toUpperCase()} ki dawai chhoot gayi hai`;

  const body = `
    <h2 style="color: #B3261E; margin-top: 0; font-size: 22px;">${headline}</h2>
    <p style="font-size: 16px; line-height: 1.6;">Namaste <strong>${params.memberName}</strong>,</p>
    <p style="font-size: 16px; line-height: 1.6;">
      ${params.elderName} ki <strong>${params.slot.toUpperCase()}</strong> ki nirdharit dawai abhi tak li gayi mark nahi hui hai.
    </p>

    <div style="background-color: #FFF3EB; border-left: 4px solid #C4572E; padding: 16px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 8px 0; color: #C4572E; font-size: 16px;">Chhooti hui dawaiyan:</h3>
      <ul style="margin: 0; padding-left: 20px;">
        ${medListHtml}
      </ul>
    </div>

    <p style="font-size: 16px; line-height: 1.6;">Kripya niche diye gaye kisi ek button par click karke turant confirm karein:</p>

    <!-- Two Signed One-Click Buttons -->
    <div style="margin: 28px 0; text-align: center;">
      <a href="${actionUrls.ackUrl}" style="display: inline-block; background-color: #F2A93B; color: #3F4A2B; font-weight: bold; padding: 14px 24px; text-decoration: none; border-radius: 12px; font-size: 16px; margin: 8px; border: 1px solid #D69128;">
        ✓ Maine dekh liya, main sambhal raha/rahi hoon
      </a>
      <br/>
      <a href="${actionUrls.takenUrl}" style="display: inline-block; background-color: #3F4A2B; color: #FFFFFF; font-weight: bold; padding: 14px 24px; text-decoration: none; border-radius: 12px; font-size: 16px; margin: 8px;">
        ✓ ${params.elderName} ne le li hai (Mark Taken)
      </a>
    </div>

    <p style="font-size: 13px; color: #7B856B; text-align: center;">
      (Yeh secure 1-click links agle 24 ghante ke liye maanya hain)
    </p>
  `;

  return sendAanganEmail({
    to: params.toEmail,
    subject: headline,
    html: body,
    type: params.isEscalation ? 'escalation' : 'missed_dose',
    actionUrls,
  });
}

export async function sendLowStockAlert(params: {
  toEmail: string;
  memberName: string;
  elderName: string;
  medicineName: string;
  stockCount: number;
}) {
  const body = `
    <h2 style="color: #C4572E; margin-top: 0;">📦 Dawai Kam Bachi Hai: ${params.medicineName}</h2>
    <p style="font-size: 16px; line-height: 1.6;">Namaste <strong>${params.memberName}</strong>,</p>
    <p style="font-size: 16px; line-height: 1.6;">
      ${params.elderName} ki <strong>${params.medicineName}</strong> sirf <strong>${params.stockCount} goliyan/doses</strong> bachi hain (3 din se kam ka stock).
    </p>
    <p style="font-size: 16px; line-height: 1.6;">
      Kripya pharmacy se nayi dawai mangwa lein taaki routine me rukawat na aaye.
    </p>
  `;

  return sendAanganEmail({
    to: params.toEmail,
    subject: `📦 Stock Alert: ${params.medicineName} kam bachi hai`,
    html: body,
    type: 'low_stock',
  });
}

export async function sendAppointmentReminder(params: {
  toEmail: string;
  memberName: string;
  elderName: string;
  doctor: string;
  reason: string;
  datetimeFormatted: string;
  location: string;
  timingNotice: string;
}) {
  const body = `
    <h2 style="color: #3F4A2B; margin-top: 0;">🗓️ Doctor Appointment Yaad Dihani (${params.timingNotice})</h2>
    <p style="font-size: 16px; line-height: 1.6;">Namaste <strong>${params.memberName}</strong>,</p>
    <p style="font-size: 16px; line-height: 1.6;">
      ${params.elderName} ka doctor appointment <strong>${params.timingNotice}</strong> scheduled hai:
    </p>

    <div style="background-color: #DDE5C8; padding: 20px; border-radius: 12px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; font-size: 16px;"><strong>Doctor:</strong> ${params.doctor}</p>
      <p style="margin: 0 0 8px 0; font-size: 16px;"><strong>Karan:</strong> ${params.reason}</p>
      <p style="margin: 0 0 8px 0; font-size: 16px;"><strong>Samay:</strong> ${params.datetimeFormatted}</p>
      <p style="margin: 0; font-size: 16px;"><strong>Sthan:</strong> ${params.location}</p>
    </div>
  `;

  return sendAanganEmail({
    to: params.toEmail,
    subject: `🗓️ Doctor Appointment: ${params.elderName} - ${params.doctor}`,
    html: body,
    type: 'appointment',
  });
}

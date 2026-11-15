import { GoogleGenAI, Type } from '@google/genai';
import { CONFIG } from '../config.js';
import type { StorageAdapter } from '../storage/adapter.js';
import { sendAanganEmail } from './email.js';
import { materializeDosesForDate } from './doseMaterializer.js';
import type { SlotType } from '@aangan/shared';

const EMERGENCY_KEYWORDS = [
  'chest pain',
  'seene me dard',
  'chhati me dard',
  'saans',
  'saas nahi aa rahi',
  'breathless',
  'behosh',
  'gir gaya',
  'gir gaye',
  'chot lag gayi',
  'khoon',
  'heart attack',
  'stroke',
  'paralysis',
  'emergency',
  'ambulance',
  '112',
];

export interface DadiResult {
  reply: string;
  actionTaken?: string;
  requiresConfirmation?: boolean;
  pendingCompartment?: SlotType;
  isEmergency?: boolean;
}

export class DadiAgent {
  private storage: StorageAdapter;
  private ai: GoogleGenAI | null = null;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    if (CONFIG.geminiApiKey) {
      try {
        this.ai = new GoogleGenAI({ apiKey: CONFIG.geminiApiKey });
      } catch (err) {
        console.warn('[Dadi] Failed to initialize GoogleGenAI client, using smart rule engine fallback:', err);
      }
    }
  }

  async processMessage(params: {
    circleId: string;
    elderId: string;
    elderName: string;
    userMessage: string;
    history?: Array<{ role: 'user' | 'model' | 'assistant'; text: string }>;
    confirmPendingAction?: boolean;
    pendingCompartment?: SlotType;
  }): Promise<DadiResult> {
    const textLower = params.userMessage.toLowerCase();

    // 1. Critical Emergency Detection
    const hasEmergencyWord = EMERGENCY_KEYWORDS.some((kw) => textLower.includes(kw));
    if (hasEmergencyWord) {
      // Trigger emergency notification
      await this.toolNotifyFamily(params.circleId, params.elderName, `Emergency alert: "${params.userMessage}"`);
      return {
        reply: 'Turant 112 par call karein ya paas ke hospital jayein! Maine pariwar ko turant suchit kar diya hai.',
        isEmergency: true,
        actionTaken: 'NOTIFIED_FAMILY_EMERGENCY',
      };
    }

    // 2. Strict Medical Disclaimer Gate
    // If asking for dosage change, diagnosis, or drug interaction safety
    if (
      textLower.includes('kitni goli') ||
      textLower.includes('dose badha') ||
      textLower.includes('dawai badal') ||
      textLower.includes('kya yeh safe hai') ||
      textLower.includes('side effect') ||
      textLower.includes('dawai chod doon')
    ) {
      return {
        reply: 'Main koi dawai ya dose nahi badal sakti. Kripya apne doctor ya pharmacist se pooch lijiye.',
      };
    }

    // 3. User Confirmation Handling for Dose Marking ("Pakka le li?")
    if (params.confirmPendingAction && params.pendingCompartment) {
      if (
        textLower.includes('haan') ||
        textLower.includes('le li') ||
        textLower.includes('yes') ||
        textLower.includes('ha') ||
        textLower.includes('pakka')
      ) {
        const markRes = await this.toolMarkTaken(
          params.circleId,
          params.elderId,
          params.pendingCompartment
        );
        return {
          reply: `Bahut badhiya! Maine aapki ${params.pendingCompartment} ki dawai li gayi mark kar di hai.`,
          actionTaken: 'MARKED_TAKEN',
        };
      } else {
        return {
          reply: 'Theek hai, jab aap dawai le lein tab bata dijiyega. Dhyan rakhein!',
        };
      }
    }

    // 4. Try Gemini 2.5 Flash if API key is present
    if (this.ai && CONFIG.geminiApiKey) {
      try {
        return await this.runGeminiAgent(params);
      } catch (err) {
        console.warn('[Dadi] Gemini call failed, falling back to smart local tool executor:', err);
      }
    }

    // 5. Intelligent Rule-based Tool Execution Engine (100% reliable offline/fallback)
    return await this.runFallbackAgent(params);
  }

  // -------------------------------------------------------------
  // Tool 1: get_next_dose
  // -------------------------------------------------------------
  async toolGetNextDose(circleId: string): Promise<string> {
    const todayStr = new Date().toISOString().split('T')[0];
    await materializeDosesForDate(this.storage, circleId, todayStr);
    const doses = await this.storage.getDosesByCircleAndDate(circleId, todayStr);
    const medicines = await this.storage.getMedicinesByCircle(circleId, true);
    const medMap = new Map(medicines.map((m) => [m.id, m]));

    const slots: SlotType[] = ['subah', 'dopahar', 'shaam', 'raat'];
    for (const slot of slots) {
      const slotDoses = doses.filter((d) => d.slot === slot && d.status === 'pending');
      if (slotDoses.length > 0) {
        const medNames = slotDoses
          .map((d) => {
            const m = medMap.get(d.medicineId);
            return m ? `${m.name} (${m.strength})` : '';
          })
          .filter(Boolean)
          .join(', ');
        return `Aapki agli dawai ${slot.toUpperCase()} ki hai: ${medNames}. Samay par le lijiye!`;
      }
    }

    return 'Aaj ki sabhi tay shuda dawaiyan li ja chuki hain. Shabaash!';
  }

  // -------------------------------------------------------------
  // Tool 2: get_today_status
  // -------------------------------------------------------------
  async toolGetTodayStatus(circleId: string): Promise<string> {
    const todayStr = new Date().toISOString().split('T')[0];
    await materializeDosesForDate(this.storage, circleId, todayStr);
    const doses = await this.storage.getDosesByCircleAndDate(circleId, todayStr);

    const taken = doses.filter((d) => d.status === 'taken').length;
    const pending = doses.filter((d) => d.status === 'pending').length;
    const missed = doses.filter((d) => d.status === 'missed').length;

    return `Aaj kul ${doses.length} me se ${taken} dawai li gayi hain, ${pending} baki hain, aur ${missed} chhoot gayi hain.`;
  }

  // -------------------------------------------------------------
  // Tool 3: mark_taken
  // -------------------------------------------------------------
  async toolMarkTaken(circleId: string, elderId: string, slot: SlotType): Promise<number> {
    const todayStr = new Date().toISOString().split('T')[0];
    await materializeDosesForDate(this.storage, circleId, todayStr);
    const doses = await this.storage.getDosesByCircleAndDate(circleId, todayStr);
    const slotDoses = doses.filter((d) => d.slot === slot && d.status !== 'taken');

    for (const d of slotDoses) {
      await this.storage.updateDose(d.id, {
        status: 'taken',
        takenAt: new Date().toISOString(),
        markedBy: elderId,
      });

      const med = await this.storage.getMedicine(d.medicineId);
      if (med && med.stockCount > 0) {
        await this.storage.updateMedicine(med.id, {
          stockCount: Math.max(0, med.stockCount - 1),
        });
      }
    }

    return slotDoses.length;
  }

  // -------------------------------------------------------------
  // Tool 4: get_next_appointment
  // -------------------------------------------------------------
  async toolGetNextAppointment(circleId: string): Promise<string> {
    const appts = await this.storage.getAppointmentsByCircle(circleId);
    const upcoming = appts.filter((a) => new Date(a.datetime).getTime() > Date.now());
    if (upcoming.length === 0) {
      return 'Abhi koi aane wala doctor appointment schedule nahi hai.';
    }
    const next = upcoming[0];
    const dt = new Date(next.datetime).toLocaleDateString('hi-IN', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
    return `Agla appointment ${dt} ko ${next.doctor} ke paas hai (${next.reason}).`;
  }

  // -------------------------------------------------------------
  // Tool 5: log_checkin
  // -------------------------------------------------------------
  async toolLogCheckin(circleId: string, elderId: string, mood: number, symptoms: string[], note?: string) {
    const todayStr = new Date().toISOString().split('T')[0];
    await this.storage.createCheckin({
      id: 'checkin-dadi-' + Math.random().toString(36).substring(2, 9),
      circleId,
      memberId: elderId,
      date: todayStr,
      mood,
      symptoms,
      note,
      createdAt: new Date().toISOString(),
    });
  }

  // -------------------------------------------------------------
  // Tool 6: notify_family
  // -------------------------------------------------------------
  async toolNotifyFamily(circleId: string, elderName: string, reason: string): Promise<void> {
    const members = await this.storage.getMembersByCircle(circleId);
    const recipients = members.filter((m) => m.role !== 'elder' && m.email);

    for (const r of recipients) {
      await sendAanganEmail({
        to: r.email,
        subject: `🚨 Aangan Emergency Notification: ${elderName}`,
        html: `
          <h2 style="color: #B3261E;">Dadaji dwara emergency call kiya gaya hai</h2>
          <p style="font-size: 16px;"><strong>Sandesh:</strong> ${reason}</p>
          <p style="font-size: 16px;">Kripya turant Dadaji se baat karein ya ghar pahuchein.</p>
        `,
        type: 'emergency',
      });
    }
  }

  // -------------------------------------------------------------
  // Fallback Rule-Based Agent
  // -------------------------------------------------------------
  private async runFallbackAgent(params: {
    circleId: string;
    elderId: string;
    elderName: string;
    userMessage: string;
  }): Promise<DadiResult> {
    const text = params.userMessage.toLowerCase();

    // Check if asking about next dose
    if (text.includes('agli dawai') || text.includes('next dose') || text.includes('kya lena hai') || text.includes('kaunsi dawai')) {
      const reply = await this.toolGetNextDose(params.circleId);
      return { reply };
    }

    // Check if asking today's status
    if (text.includes('kitni li') || text.includes('aaj ka status') || text.includes('kuch bacha hai') || text.includes('aaj ki dawai')) {
      const reply = await this.toolGetTodayStatus(params.circleId);
      return { reply };
    }

    // Check if wanting to mark taken
    if (text.includes('le li') || text.includes('kha li') || text.includes('mark taken')) {
      let slot: SlotType = 'subah';
      if (text.includes('dopahar')) slot = 'dopahar';
      else if (text.includes('shaam')) slot = 'shaam';
      else if (text.includes('raat')) slot = 'raat';

      return {
        reply: `Kya aapne sach me ${slot} ki dawai pakka le li hai?`,
        requiresConfirmation: true,
        pendingCompartment: slot,
      };
    }

    // Check if asking about appointments
    if (text.includes('doctor') || text.includes('appointment') || text.includes('checkup') || text.includes('kab jana')) {
      const reply = await this.toolGetNextAppointment(params.circleId);
      return { reply };
    }

    // Check if logging feeling / checkin
    if (text.includes('dard') || text.includes('chakkar') || text.includes('achha') || text.includes('tabiyat')) {
      const symptoms: string[] = [];
      if (text.includes('chakkar')) symptoms.push('chakkar');
      if (text.includes('kamzori')) symptoms.push('kamzori');
      if (text.includes('dard')) symptoms.push('dard');
      if (text.includes('theek') || text.includes('achha')) symptoms.push('theek_hoon');

      await this.toolLogCheckin(params.circleId, params.elderId, symptoms.includes('theek_hoon') ? 5 : 2, symptoms, params.userMessage);
      return {
        reply: 'Maine aapki tabiyat ki entry darz kar li hai. Aaram kijiye aur zaroorat ho toh batayein.',
        actionTaken: 'LOGGED_CHECKIN',
      };
    }

    // Default warm steer
    return {
      reply: 'Pranaam! Main aapki dawaiyon aur tabiyat ki dekhbhal me madad kar sakti hoon. Bataiye kya janna hai?',
    };
  }

  // -------------------------------------------------------------
  // Gemini 2.5 Flash Agent with Function Calling
  // -------------------------------------------------------------
  private async runGeminiAgent(params: {
    circleId: string;
    elderId: string;
    elderName: string;
    userMessage: string;
    history?: Array<{ role: 'user' | 'model' | 'assistant'; text: string }>;
  }): Promise<DadiResult> {
    if (!this.ai) throw new Error('AI not configured');

    const toolsConfig: any = [
      {
        functionDeclarations: [
          {
            name: 'get_next_dose',
            description: 'Check what medicines are due next for the elder and in which compartment slot.',
            parameters: { type: Type.OBJECT, properties: {} },
          },
          {
            name: 'get_today_status',
            description: 'Get a summary of today doses (taken, pending, missed).',
            parameters: { type: Type.OBJECT, properties: {} },
          },
          {
            name: 'ask_confirmation_to_mark_taken',
            description: 'Ask the elder to confirm if they truly took the medicines in a compartment.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                compartment: { type: Type.STRING, enum: ['subah', 'dopahar', 'shaam', 'raat'] },
              },
              required: ['compartment'],
            },
          },
          {
            name: 'get_next_appointment',
            description: 'Get upcoming doctor appointment details.',
            parameters: { type: Type.OBJECT, properties: {} },
          },
          {
            name: 'log_checkin',
            description: 'Record elder daily mood and symptoms.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                mood: { type: Type.INTEGER, description: '1 to 5' },
                symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
                note: { type: Type.STRING },
              },
              required: ['mood', 'symptoms'],
            },
          },
          {
            name: 'notify_family',
            description: 'Send urgent alert to family members on duty.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                reason: { type: Type.STRING },
              },
              required: ['reason'],
            },
          },
        ],
      },
    ];

    const systemInstruction = `
You are "DADI" (दादी), the warm, caring, respectful Hinglish voice companion for an elderly person (${params.elderName}) on the Aangan healthcare platform.
Rules:
1. Speak in friendly, gentle Hinglish (max 2 short sentences). Always address the elder with respect ("Aap", "Pranaam").
2. NEVER diagnose illnesses.
3. NEVER prescribe, change, or advise modifying medication dosages.
4. NEVER claim whether combinations or foods are safe with drugs — always say "Doctor ya pharmacist se pooch lijiye".
5. If emergency words arise (chest pain, fallen, severe breathlessness), tell them to call 112 and use notify_family.
6. To mark medicines taken, ALWAYS first call ask_confirmation_to_mark_taken so Dadi asks "Pakka le li?".
    `;

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: params.userMessage,
      config: {
        systemInstruction,
        tools: toolsConfig,
      },
    });

    const candidate = response.candidates?.[0];
    const functionCall = candidate?.content?.parts?.find((p: any) => p.functionCall)?.functionCall;

    if (functionCall) {
      const toolName = functionCall.name;
      const args = (functionCall.args as any) || {};

      if (toolName === 'get_next_dose') {
        const reply = await this.toolGetNextDose(params.circleId);
        return { reply };
      } else if (toolName === 'get_today_status') {
        const reply = await this.toolGetTodayStatus(params.circleId);
        return { reply };
      } else if (toolName === 'ask_confirmation_to_mark_taken') {
        const compartment = (args.compartment || 'subah') as SlotType;
        return {
          reply: `Kya aapne sach me ${compartment} ki dawai pakka le li hai?`,
          requiresConfirmation: true,
          pendingCompartment: compartment,
        };
      } else if (toolName === 'get_next_appointment') {
        const reply = await this.toolGetNextAppointment(params.circleId);
        return { reply };
      } else if (toolName === 'log_checkin') {
        await this.toolLogCheckin(params.circleId, params.elderId, args.mood || 4, args.symptoms || [], args.note);
        return {
          reply: 'Maine aapki tabiyat darz kar li hai. Aap aaram kijiye!',
          actionTaken: 'LOGGED_CHECKIN',
        };
      } else if (toolName === 'notify_family') {
        await this.toolNotifyFamily(params.circleId, params.elderName, args.reason || params.userMessage);
        return {
          reply: 'Maine pariwar ke sadasya ko turant suchit kar diya hai.',
          actionTaken: 'NOTIFIED_FAMILY',
        };
      }
    }

    const textPart = candidate?.content?.parts?.find((p: any) => p.text)?.text;
    return {
      reply: textPart || 'Pranaam! Main aapki seva me hazir hoon. Dawai ya appointment ke baare me pooch lijiye.',
    };
  }
}

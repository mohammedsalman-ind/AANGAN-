import { GoogleGenAI, Type } from '@google/genai';
import { CONFIG } from '../config.js';
import type { StorageAdapter } from '../storage/adapter.js';
import type { PatternInsight } from '@aangan/shared';

export class PatternInsightsService {
  private storage: StorageAdapter;
  private ai: GoogleGenAI | null = null;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    if (CONFIG.geminiApiKey) {
      try {
        this.ai = new GoogleGenAI({ apiKey: CONFIG.geminiApiKey });
      } catch (err) {
        console.warn('[PatternInsights] Could not initialize Gemini SDK:', err);
      }
    }
  }

  async generateInsights(circleId: string): Promise<PatternInsight[]> {
    const today = new Date();
    const startDate = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    const doses = await this.storage.getDosesByCircleDateRange(circleId, startDate, endDate);
    const checkins = await this.storage.getCheckinsByCircle(circleId, 14);
    const receipts = await this.storage.getReceiptsByCircle(circleId, 10);
    const medicines = await this.storage.getMedicinesByCircle(circleId);
    const medMap = new Map(medicines.map((m) => [m.id, m]));

    // Structure raw input dataset
    const dailyRecords: Record<string, {
      missedSlots: string[];
      mood?: number;
      symptoms: string[];
    }> = {};

    for (const d of doses) {
      if (!dailyRecords[d.date]) {
        dailyRecords[d.date] = { missedSlots: [], symptoms: [] };
      }
      if (d.status === 'missed') {
        const med = medMap.get(d.medicineId);
        dailyRecords[d.date].missedSlots.push(`${d.slot} (${med?.name || 'Medicine'})`);
      }
    }

    for (const c of checkins) {
      if (!dailyRecords[c.date]) {
        dailyRecords[c.date] = { missedSlots: [], symptoms: [] };
      }
      dailyRecords[c.date].mood = c.mood;
      dailyRecords[c.date].symptoms = c.symptoms;
    }

    // If Gemini API is available and configured
    if (this.ai && CONFIG.geminiApiKey) {
      try {
        return await this.runGeminiInsights(dailyRecords);
      } catch (err) {
        console.warn('[PatternInsights] Gemini call failed, using deterministic observational analyzer:', err);
      }
    }

    // Deterministic observational analyzer (adheres strictly to rules: cites dates, no medical claims, no dose changes)
    return this.runLocalPatternAnalyzer(dailyRecords);
  }

  private async runGeminiInsights(dailyRecords: Record<string, any>): Promise<PatternInsight[]> {
    if (!this.ai) return [];

    const prompt = `
Analyze the following 14-day record of an elder's medication adherence and daily check-ins:
${JSON.stringify(dailyRecords, null, 2)}

Strict instructions:
1. Return AT MOST 3 observational insights.
2. OBSERVATIONAL ONLY: Describe correlated occurrences between missed slots and symptoms/mood.
3. NEVER make medical claims, diagnostic claims, or causal statements (e.g. do NOT say "Missing Telmisartan caused dizziness"). Say "Dizziness was reported on dates when morning doses were missed".
4. NEVER advise changing doses or medications.
5. Provide a constructive, neutral question for the doctor.
6. EVERY insight MUST cite at least one verified date present in the input. If no verifiable pattern exists, return an empty array [].
    `;

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              observation: { type: Type.STRING },
              evidenceDates: { type: Type.ARRAY, items: { type: Type.STRING } },
              confidence: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
              questionForDoctor: { type: Type.STRING },
            },
            required: ['observation', 'evidenceDates', 'confidence', 'questionForDoctor'],
          },
        },
      },
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return [];
    const parsed = JSON.parse(text) as PatternInsight[];
    // Filter to ensure every insight has valid evidenceDates
    return parsed.filter((p) => p.evidenceDates && p.evidenceDates.length > 0).slice(0, 3);
  }

  private runLocalPatternAnalyzer(dailyRecords: Record<string, any>): Promise<PatternInsight[]> {
    const insights: PatternInsight[] = [];
    const datesWithMissedDoses = Object.keys(dailyRecords).filter(
      (d) => dailyRecords[d].missedSlots && dailyRecords[d].missedSlots.length > 0
    );

    // Look for correlation: chakkar/weakness reported on or after missed doses
    const dizzinessDates = datesWithMissedDoses.filter((d) =>
      dailyRecords[d].symptoms.some((s: string) => s === 'chakkar' || s === 'kamzori')
    );

    if (dizzinessDates.length > 0) {
      insights.push({
        observation:
          'Chakkar ya kamzori ki report un dinon par darz hui jin dinon me nirdharit dawai miss hui thi.',
        evidenceDates: dizzinessDates,
        confidence: 'high',
        questionForDoctor:
          'Subah ki dawai miss hone par BP ya sugar me kya utar-chadav hota hai, aur is sthiti me kya savdhani bartein?',
      });
    }

    // Look for weekend pattern (e.g., missed doses occurring around Saturday/Sunday)
    const weekendMisses = datesWithMissedDoses.filter((d) => {
      const day = new Date(d).getDay();
      return day === 0 || day === 6;
    });

    if (weekendMisses.length >= 1) {
      insights.push({
        observation:
          'Weekend ke dauran timing me badlav ya dawai chhootne ki ghatnayein dekhi gayi hain.',
        evidenceDates: weekendMisses,
        confidence: 'medium',
        questionForDoctor:
          'Weekend par routine thoda aage-piche hone se kya dawai lene ke niyam me koi badlav karna chahiye?',
      });
    }

    return Promise.resolve(insights);
  }
}

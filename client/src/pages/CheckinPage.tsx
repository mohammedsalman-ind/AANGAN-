import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { SYMPTOMS, type Checkin } from '@aangan/shared';
import { HeartPulse, Check, ShieldAlert, Sparkles } from 'lucide-react';

const MOODS = [
  { level: 1, emoji: '😞', label: 'Bohat bekar' },
  { level: 2, emoji: '🙁', label: 'Thoda bekar' },
  { level: 3, emoji: '😐', label: 'Theek-thaak' },
  { level: 4, emoji: '🙂', label: 'Acha' },
  { level: 5, emoji: '😄', label: 'Shandar / Mast' },
];

export const CheckinPage: React.FC = () => {
  const { currentMember } = useAuth();
  const [mood, setMood] = useState<number>(4);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [restricted, setRestricted] = useState(false);

  const loadCheckins = async () => {
    try {
      const data = await api.getCheckins();
      setCheckins(data);
    } catch (err: any) {
      if (err.message?.includes('private')) {
        setRestricted(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCheckins();
  }, []);

  const handleToggleSymptom = (id: string) => {
    if (selectedSymptoms.includes(id)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== id));
    } else {
      setSelectedSymptoms([...selectedSymptoms, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCheckin({
        mood,
        symptoms: selectedSymptoms,
        note: note.trim() || undefined,
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      setNote('');
      loadCheckins();
    } catch (err: any) {
      alert(err.message || 'Checkin save karne me dikkat aayi.');
    }
  };

  if (restricted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <ShieldAlert className="w-16 h-16 text-terracotta mx-auto mb-4" />
        <h2 className="font-heading font-bold text-3xl">Parda & Control</h2>
        <p className="text-zinc-600 mt-2">
          Elder ne tabiyat ki jaankari (check-ins) ko private rakha hai.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading font-black text-3xl sm:text-4xl text-deepOlive dark:text-cream flex items-center gap-3">
          <HeartPulse className="w-8 h-8 text-terracotta" />
          <span>Kaisa Laga (Daily Check-in)</span>
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Aaj tabiyat kaisi mehsoos ho rahi hai? Mood aur lakshan darz karein.
        </p>
      </div>

      {savedSuccess && (
        <div className="mb-6 p-4 bg-sage text-deepOlive font-bold rounded-20 shadow-sm flex items-center gap-2">
          <Check className="w-5 h-5" />
          <span>Tabiyat ki entry safaltapoorvak darz ho gayi hai!</span>
        </div>
      )}

      {/* Main Check-in Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-zinc-800 rounded-30 p-6 sm:p-8 shadow-card border-2 border-borderMuted mb-8 text-center"
      >
        {/* Mood Selection (5 Emojis) */}
        <div className="mb-6">
          <h2 className="font-heading font-bold text-2xl mb-4">
            Aaj Mood / Urja (Energy) Kaisi Hai?
          </h2>
          <div className="flex justify-center gap-2 sm:gap-4 flex-wrap">
            {MOODS.map((m) => (
              <button
                key={m.level}
                type="button"
                onClick={() => setMood(m.level)}
                className={`flex flex-col items-center p-3 sm:p-4 rounded-24 border-2 transition-all active:scale-95 ${
                  mood === m.level
                    ? 'bg-terracotta/10 border-terracotta scale-110 shadow-md'
                    : 'bg-cream/40 border-borderMuted hover:border-terracotta'
                }`}
              >
                <span className="text-4xl sm:text-5xl">{m.emoji}</span>
                <span className="text-xs font-bold mt-2 text-deepOlive dark:text-cream">
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Symptoms Chips */}
        <div className="mb-6 text-left">
          <h3 className="font-heading font-bold text-lg mb-3">
            Kya koi pareshani mehsoos ho rahi hai? (Symptom Chips)
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {SYMPTOMS.map((symp) => {
              const isSelected = selectedSymptoms.includes(symp.id);
              return (
                <button
                  key={symp.id}
                  type="button"
                  onClick={() => handleToggleSymptom(symp.id)}
                  className={`px-4 py-2.5 rounded-20 text-sm font-bold flex items-center gap-2 border transition-all ${
                    isSelected
                      ? 'bg-terracotta text-cream border-terracotta shadow-md scale-105'
                      : 'bg-cream dark:bg-zinc-700 hover:bg-sage text-deepOlive dark:text-cream border-borderMuted'
                  }`}
                >
                  <span>{symp.emoji}</span>
                  <span>{symp.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Note */}
        <div className="mb-6 text-left">
          <label className="block text-sm font-bold mb-1">Koyi Vishesh Baat Ya Note?</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Jaise: Subah walk ke baad halka chakkar aaya tha..."
            className="w-full px-4 py-3 bg-cream dark:bg-zinc-700 rounded-16 border border-borderMuted text-base focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-terracotta hover:bg-terracotta-dark text-cream font-heading font-bold text-xl rounded-20 shadow-md active:scale-95 transition-all"
        >
          Darz Karein (Submit Check-in)
        </button>
      </form>

      {/* Check-ins History */}
      <div>
        <h2 className="font-heading font-bold text-2xl mb-4">Pichhle Dinon Ka Record</h2>
        <div className="space-y-3">
          {checkins.map((c) => (
            <div
              key={c.id}
              className="bg-white dark:bg-zinc-800 p-5 rounded-20 shadow-sm border border-borderMuted flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-bold text-base">{c.date}</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {c.symptoms.map((s) => (
                    <span
                      key={s}
                      className="text-xs bg-cream dark:bg-zinc-700 px-2 py-0.5 rounded-full font-semibold border border-borderMuted"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                {c.note && <p className="text-xs text-zinc-500 italic mt-1">"{c.note}"</p>}
              </div>

              <div className="text-right">
                <span className="text-3xl">
                  {MOODS.find((m) => m.level === c.mood)?.emoji || '🙂'}
                </span>
                <p className="text-xs font-bold text-zinc-500 mt-1">Mood: {c.mood}/5</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

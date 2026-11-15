import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { SLOT_INFO, SLOTS, type Dose, type Medicine, type PatternInsight, type Duty } from '@aangan/shared';
import { Activity, Sparkles, UserCheck, CheckCircle2, AlertCircle, HelpCircle, ShieldAlert } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { currentMember } = useAuth();
  const [doses, setDoses] = useState<Array<Dose & { medicine: Medicine | null }>>([]);
  const [insights, setInsights] = useState<PatternInsight[]>([]);
  const [todayDuty, setTodayDuty] = useState<{ memberName: string; note?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [insightsRestricted, setInsightsRestricted] = useState(false);
  const [adherenceRestricted, setAdherenceRestricted] = useState(false);

  const loadData = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      // Check dials for non-elders
      if (currentMember?.role !== 'elder' && !currentMember?.privacyDials?.canSeeAdherence) {
        setAdherenceRestricted(true);
      } else {
        const todayDoses = await api.getTodayDoses(todayStr);
        setDoses(todayDoses);
      }

      // Load insights
      try {
        const ins = await api.getInsights();
        setInsights(ins);
      } catch (err: any) {
        if (err.message?.includes('private')) {
          setInsightsRestricted(true);
        }
      }

      // Load duty for today
      const roster = await api.getDutyRoster(todayStr, todayStr);
      if (roster.length > 0) {
        const members = await api.getMembers();
        const assigned = members.find((m) => m.id === roster[0].memberId);
        setTodayDuty({
          memberName: assigned ? assigned.name : 'Pariwar',
          note: roster[0].handoffNote,
        });
      }
    } catch (err) {
      console.warn('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentMember]);

  const handleAddInsightQuestionToAppt = async (question: string) => {
    try {
      const appts = await api.getAppointments();
      const nextAppt = appts.find((a) => new Date(a.datetime).getTime() > Date.now()) || appts[0];
      if (nextAppt) {
        await api.addDoctorQuestion(nextAppt.id, question);
        alert(`Sawal Dr. ${nextAppt.doctor} ke visit sheet me joda gaya!`);
      } else {
        alert('Pehle koi doctor appointment add karein.');
      }
    } catch (err: any) {
      alert(err.message || 'Sawal add nahi ho paya.');
    }
  };

  // Calculate Adherence Percentage
  const takenCount = doses.filter((d) => d.status === 'taken').length;
  const totalCount = doses.length;
  const adherencePct = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 100;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading font-black text-3xl sm:text-4xl text-deepOlive dark:text-cream flex items-center gap-3">
          <Activity className="w-8 h-8 text-terracotta" />
          <span>Courtyard Dashboard (Pariwar & Caretaker)</span>
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Dadaji ke health status, adherence aur AI observational patterns ki live summary
        </p>
      </div>

      {/* Top Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1: Adherence Ring */}
        <div className="bg-white dark:bg-zinc-800 rounded-30 p-6 shadow-card border border-borderMuted dark:border-zinc-700 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Aaj Ka Adherence
            </h3>
            {adherenceRestricted ? (
              <div className="py-6 text-center text-sm text-zinc-500">
                <ShieldAlert className="w-8 h-8 text-saffron mx-auto mb-2" />
                <span>Elder ne adherence private rakha hai</span>
              </div>
            ) : (
              <div className="flex items-center gap-4 my-2">
                {/* SVG Progress Ring */}
                <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-cream dark:text-zinc-700"
                      strokeWidth="3.8"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-terracotta"
                      strokeDasharray={`${adherencePct}, 100`}
                      strokeWidth="3.8"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute font-heading font-black text-2xl text-deepOlive dark:text-cream">
                    {adherencePct}%
                  </span>
                </div>
                <div>
                  <p className="font-bold text-lg">{takenCount} / {totalCount} Li Gayi</p>
                  <p className="text-xs text-zinc-500">
                    {totalCount - takenCount} baki ya scheduled
                  </p>
                </div>
              </div>
            )}
          </div>
          <span className="text-[11px] text-zinc-400">Live updated today</span>
        </div>

        {/* Card 2: Who's on Duty */}
        <div className="bg-white dark:bg-zinc-800 rounded-30 p-6 shadow-card border border-borderMuted dark:border-zinc-700 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Duty Handoff
            </h3>
            <div className="flex items-center gap-3 my-3">
              <div className="w-12 h-12 rounded-full bg-saffron text-deepOlive flex items-center justify-center text-2xl">
                🧑‍⚕️
              </div>
              <div>
                <p className="text-xs text-zinc-500">Aaj On-Duty</p>
                <p className="font-heading font-bold text-xl">{todayDuty?.memberName || 'Priya'}</p>
              </div>
            </div>
            {todayDuty?.note && (
              <p className="text-xs bg-cream dark:bg-zinc-700 p-2.5 rounded-12 italic text-zinc-600 dark:text-zinc-300">
                "{todayDuty.note}"
              </p>
            )}
          </div>
          <span className="text-[11px] text-zinc-400">Missed alerts relay first to on-duty member</span>
        </div>

        {/* Card 3: Caretaker Action Shortcut */}
        <div className="bg-gradient-to-br from-sage/60 to-sage dark:from-zinc-800 dark:to-zinc-700 rounded-30 p-6 shadow-card border border-borderMuted dark:border-zinc-700 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-deepOlive dark:text-cream mb-1">
              Courtyard Harmony
            </h3>
            <p className="font-heading font-bold text-xl text-deepOlive dark:text-cream mt-2">
              "Buzurg head of house hain, aap unke sahayak hain."
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-2">
              Koyi bhi badlav Change Receipts me darz hota hai.
            </p>
          </div>
          <a
            href="/pillbox"
            className="text-xs font-bold text-terracotta hover:underline mt-4 inline-block"
          >
            Digital Pillbox Kholein →
          </a>
        </div>
      </div>

      {/* PATTERN INSIGHTS SECTION (Phase 5) */}
      <div className="bg-white dark:bg-zinc-800 rounded-30 p-6 sm:p-8 shadow-card border-2 border-borderMuted dark:border-zinc-700">
        <div className="flex items-center justify-between pb-4 border-b border-borderMuted dark:border-zinc-700 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-saffron/20 flex items-center justify-center text-saffron font-bold text-xl">
              ✨
            </div>
            <div>
              <h2 className="font-heading font-black text-2xl text-deepOlive dark:text-cream">
                Pattern Dikhe (Observational Insights)
              </h2>
              <p className="text-xs text-zinc-500">
                Gemini 2.5 Flash dwara pichhle 14 dinon ke check-ins aur missed doses ka correlation
              </p>
            </div>
          </div>
        </div>

        {insightsRestricted ? (
          <div className="py-8 text-center text-zinc-500">
            <ShieldAlert className="w-10 h-10 text-saffron mx-auto mb-2" />
            <p className="font-bold">Elder ne tabiyat aur pattern insights private rakhe hain.</p>
          </div>
        ) : insights.length === 0 ? (
          <div className="py-8 text-center text-zinc-500">
            <p className="text-3xl mb-1">🔍</p>
            <p className="font-semibold">Abhi koi asamanya pattern nahi mila. Adherence theek chal raha hai!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {insights.map((ins, idx) => (
              <div
                key={idx}
                className="bg-cream/40 dark:bg-zinc-700/50 p-6 rounded-24 border border-borderMuted dark:border-zinc-600 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider bg-terracotta text-cream px-2.5 py-0.5 rounded-full">
                      Confidence: {ins.confidence}
                    </span>
                    <span className="text-xs font-semibold text-zinc-500">
                      Dates: {ins.evidenceDates.join(', ')}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-lg mt-2 text-deepOlive dark:text-cream">
                    "{ins.observation}"
                  </h3>

                  <div className="mt-4 p-3 bg-white dark:bg-zinc-800 rounded-16 border border-borderMuted">
                    <p className="text-xs font-bold text-terracotta uppercase">Doctor Se Poochhne Yogya Sawal:</p>
                    <p className="text-sm font-medium mt-1 text-zinc-800 dark:text-zinc-200">
                      "{ins.questionForDoctor}"
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleAddInsightQuestionToAppt(ins.questionForDoctor)}
                  className="mt-4 w-full py-2.5 bg-deepOlive text-cream hover:bg-deepOlive-dark font-bold text-xs rounded-16 transition-all flex items-center justify-center gap-1.5 shadow"
                >
                  <HelpCircle className="w-4 h-4 text-saffron" />
                  <span>Doctor Visit Sheet Me Sawal Jodein</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

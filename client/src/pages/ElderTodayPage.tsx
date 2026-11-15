import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import { useOfflineSync } from '../context/OfflineSyncContext.js';
import { api } from '../api/client.js';
import { DayArc } from '../components/DayArc.js';
import { UndoToast } from '../components/UndoToast.js';
import { AccessibilityWidget } from '../components/AccessibilityWidget.js';
import { DadiVoiceModal } from '../components/DadiVoiceModal.js';
import { SLOTS, SLOT_INFO, type SlotType, type Dose, type Medicine, type ChangeReceipt } from '@aangan/shared';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Clock,
  Mic,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export const ElderTodayPage: React.FC = () => {
  const { currentMember, circle } = useAuth();
  const { t } = useLanguage();
  const { isOnline, queueAction } = useOfflineSync();

  const [doses, setDoses] = useState<Array<Dose & { medicine: Medicine | null }>>([]);
  const [unacknowledgedReceipts, setUnacknowledgedReceipts] = useState<ChangeReceipt[]>([]);
  const [activeSlot, setActiveSlot] = useState<SlotType>('subah');
  const [todayDuty, setTodayDuty] = useState<{ memberName: string; note?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Undo Toast state
  const [undoToast, setUndoToast] = useState<{
    message: string;
    action: () => Promise<void>;
  } | null>(null);

  // Dadi Voice Modal state
  const [isDadiOpen, setIsDadiOpen] = useState(false);

  const isElder = currentMember?.role === 'elder';

  const loadData = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayDoses = await api.getTodayDoses(todayStr);
      setDoses(todayDoses);

      // Determine the next due compartment automatically based on hour
      const hour = new Date().getHours();
      let currentSlot: SlotType = 'subah';
      if (hour >= 12 && hour < 17) currentSlot = 'dopahar';
      else if (hour >= 17 && hour < 21) currentSlot = 'shaam';
      else if (hour >= 21 || hour < 6) currentSlot = 'raat';
      setActiveSlot(currentSlot);

      // Load receipts for elder
      if (isElder) {
        const receipts = await api.getReceipts();
        const unacked = receipts.filter((r) => !r.acknowledgedByElder);
        setUnacknowledgedReceipts(unacked);
      }

      // Load duty for today
      const roster = await api.getDutyRoster(todayStr, todayStr);
      const slotDuty = roster.find((r) => r.slot === currentSlot);
      if (slotDuty) {
        const members = await api.getMembers();
        const assigned = members.find((m) => m.id === slotDuty.memberId);
        setTodayDuty({
          memberName: assigned ? assigned.name : 'Pariwar',
          note: slotDuty.handoffNote,
        });
      }
    } catch (err) {
      console.warn('Failed to load today data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isElder]);

  // Status for each slot on the Day Arc
  const slotStatuses = useMemo(() => {
    const statuses: Record<SlotType, 'all_taken' | 'pending' | 'missed' | 'empty'> = {
      subah: 'empty',
      dopahar: 'empty',
      shaam: 'empty',
      raat: 'empty',
    };

    for (const slot of SLOTS) {
      const slotDoses = doses.filter((d) => d.slot === slot);
      if (slotDoses.length === 0) {
        statuses[slot] = 'empty';
      } else if (slotDoses.every((d) => d.status === 'taken')) {
        statuses[slot] = 'all_taken';
      } else if (slotDoses.some((d) => d.status === 'missed')) {
        statuses[slot] = 'missed';
      } else {
        statuses[slot] = 'pending';
      }
    }

    return statuses;
  }, [doses]);

  // Current compartment's doses
  const currentSlotDoses = useMemo(() => {
    return doses.filter((d) => d.slot === activeSlot);
  }, [doses, activeSlot]);

  const allTakenInActiveSlot =
    currentSlotDoses.length > 0 && currentSlotDoses.every((d) => d.status === 'taken');

  // Trigger Confetti Celebration Micro-animation
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#C4572E', '#F2A93B', '#3F4A2B', '#DDE5C8'],
      });
    } catch {}
  };

  // Mark all doses in active compartment as taken
  const handleTakeAllInSlot = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const previousDosesState = [...doses];

    // Optimistic UI update
    setDoses((prev) =>
      prev.map((d) =>
        d.slot === activeSlot ? { ...d, status: 'taken', takenAt: new Date().toISOString() } : d
      )
    );

    triggerConfetti();

    // Show 10-second undo toast
    setUndoToast({
      message: `${SLOT_INFO[activeSlot].label} ki sabhi dawaiyan li gayi mark hui!`,
      action: async () => {
        // Revert optimistically
        setDoses(previousDosesState);
        for (const d of currentSlotDoses) {
          if (d.status !== 'taken') {
            await api.updateDose(d.id, 'pending').catch(() => {});
          }
        }
      },
    });

    if (!isOnline) {
      queueAction({
        type: 'mark_slot',
        payload: { date: todayStr, slot: activeSlot },
      });
      return;
    }

    try {
      await api.markSlotAll(todayStr, activeSlot);
    } catch (err) {
      console.warn('Take all failed, queued:', err);
    }
  };

  // Mark single pill as taken
  const handleToggleSingleDose = async (dose: Dose) => {
    const nextStatus = dose.status === 'taken' ? 'pending' : 'taken';
    const previousStatus = dose.status;

    // Optimistic update
    setDoses((prev) =>
      prev.map((d) =>
        d.id === dose.id ? { ...d, status: nextStatus, takenAt: new Date().toISOString() } : d
      )
    );

    if (nextStatus === 'taken') {
      triggerConfetti();
      setUndoToast({
        message: 'Dawai li gayi mark hui!',
        action: async () => {
          setDoses((prev) =>
            prev.map((d) => (d.id === dose.id ? { ...d, status: previousStatus } : d))
          );
          await api.updateDose(dose.id, previousStatus).catch(() => {});
        },
      });
    }

    if (!isOnline) {
      queueAction({
        type: 'mark_dose',
        payload: { doseId: dose.id, status: nextStatus },
      });
      return;
    }

    try {
      await api.updateDose(dose.id, nextStatus);
    } catch (err) {
      console.warn('Update dose failed:', err);
    }
  };

  // Reverse receipt directly from elder banner
  const handleReverseReceipt = async (receiptId: string) => {
    try {
      await api.reverseReceipt(receiptId);
      setUnacknowledgedReceipts((prev) => prev.filter((r) => r.id !== receiptId));
      loadData();
    } catch (err: any) {
      alert(err.message || 'Reverse failed');
    }
  };

  // Acknowledge receipt banner
  const handleAckReceipt = async (receiptId: string) => {
    try {
      await api.ackReceipt(receiptId);
      setUnacknowledgedReceipts((prev) => prev.filter((r) => r.id !== receiptId));
    } catch (err: any) {
      console.warn('Ack receipt failed:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* Floating Accessibility Widget */}
      <AccessibilityWidget />

      {/* Floating Dadi Mic Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsDadiOpen(true)}
          aria-label="Talk to Dadi Voice Assistant"
          className="flex items-center gap-3 bg-terracotta hover:bg-terracotta-dark text-cream p-4 sm:px-6 sm:py-4 rounded-full shadow-2xl active:scale-95 transition-all border-4 border-white dark:border-zinc-800"
        >
          <Mic className="w-7 h-7 animate-pulse text-saffron" />
          <span className="font-heading font-bold text-lg hidden sm:inline">
            दादी से बात करें (Speak)
          </span>
        </button>
      </div>

      {/* CHANGE RECEIPTS BANNER (Elder Only, Plain Hinglish with 24h Reverse) */}
      {isElder && unacknowledgedReceipts.length > 0 && (
        <div className="mb-6 space-y-3">
          {unacknowledgedReceipts.map((rcpt) => (
            <div
              key={rcpt.id}
              className="bg-saffron/20 border-2 border-saffron text-deepOlive p-4 sm:p-5 rounded-24 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-terracotta shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-base sm:text-lg">
                    🔔 Naya Badlav: {rcpt.description}
                  </p>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    Kiya: {rcpt.changedByName} ne • {new Date(rcpt.changedAt).toLocaleTimeString()} par
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  onClick={() => handleReverseReceipt(rcpt.id)}
                  className="flex items-center gap-1.5 bg-terracotta text-cream px-4 py-2 rounded-16 font-bold text-sm shadow hover:bg-terracotta-dark active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Wapas karein (Reverse)</span>
                </button>
                <button
                  onClick={() => handleAckReceipt(rcpt.id)}
                  className="px-3 py-2 bg-white/80 hover:bg-white text-deepOlive rounded-16 font-semibold text-sm border border-borderMuted"
                >
                  Theek hai ✓
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Today's Duty Banner */}
      {todayDuty && (
        <div className="mb-6 bg-sage/50 dark:bg-zinc-800/60 border border-borderMuted px-5 py-3 rounded-20 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-deepOlive dark:text-cream">
            <UserCheck className="w-5 h-5 text-terracotta" />
            <span>
              <strong>Aaj kiski duty:</strong> {todayDuty.memberName} on duty hain.
              {todayDuty.note && <span className="text-xs opacity-80 italic"> ("{todayDuty.note}")</span>}
            </span>
          </div>
        </div>
      )}

      {/* SIGNATURE 1: Day Arc Component */}
      <DayArc
        activeSlot={activeSlot}
        onSelectSlot={(slot) => setActiveSlot(slot)}
        slotStatuses={slotStatuses}
      />

      {/* SIGNATURE 2: ONE Giant Card for Next Due Compartment */}
      <div className="bg-white dark:bg-zinc-800 rounded-30 p-6 sm:p-8 shadow-card border-2 border-borderMuted dark:border-zinc-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-borderMuted dark:border-zinc-700">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider bg-saffron text-deepOlive px-3 py-1 rounded-full">
              {SLOT_INFO[activeSlot].range}
            </span>
            <h2 className="font-heading font-black text-3xl sm:text-4xl text-deepOlive dark:text-cream mt-2 flex items-center gap-3">
              <span>{SLOT_INFO[activeSlot].icon}</span>
              <span>{SLOT_INFO[activeSlot].label} Ki Dawaiyan</span>
            </h2>
          </div>

          {/* Compartment Status Badge */}
          <div>
            {allTakenInActiveSlot ? (
              <span className="flex items-center gap-1.5 text-base font-bold bg-deepOlive text-cream px-4 py-2 rounded-20">
                <CheckCircle2 className="w-5 h-5" />
                <span>Sabhi Li Gayi ✓</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-base font-bold bg-cream dark:bg-zinc-700 text-terracotta px-4 py-2 rounded-20 border border-terracotta">
                <Clock className="w-5 h-5" />
                <span>{currentSlotDoses.filter((d) => d.status !== 'taken').length} Baki Hain</span>
              </span>
            )}
          </div>
        </div>

        {/* List of Pills inside this Compartment */}
        {currentSlotDoses.length === 0 ? (
          <div className="py-12 text-center text-zinc-500">
            <p className="text-4xl mb-2">🌿</p>
            <p className="font-heading text-xl">{SLOT_INFO[activeSlot].label} ke liye koi dawai nirdharit nahi hai.</p>
          </div>
        ) : (
          <div className="divide-y divide-borderMuted dark:divide-zinc-700 my-4">
            {currentSlotDoses.map((dose) => {
              const med = dose.medicine;
              const isTaken = dose.status === 'taken';
              const isMissed = dose.status === 'missed';
              const isLowStock = med && med.stockCount <= 3;

              return (
                <div
                  key={dose.id}
                  className={`py-4 sm:py-5 flex items-center justify-between gap-4 transition-all ${
                    isTaken ? 'opacity-70 bg-cream/40 dark:bg-zinc-800/40' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Pill Color & Emoji Circle */}
                    <div
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-20 flex items-center justify-center text-3xl shadow-sm border border-borderMuted shrink-0"
                      style={{ backgroundColor: med?.color || '#C4572E' }}
                    >
                      {med?.emoji || '💊'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`font-heading font-bold text-xl sm:text-2xl ${isTaken ? 'line-through' : ''}`}>
                          {med?.name || 'Dawai'}
                        </h3>
                        <span className="text-sm font-semibold opacity-75">
                          ({med?.strength})
                        </span>
                      </div>

                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
                        {med?.purposeSimple}
                      </p>

                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-sage text-deepOlive">
                          {med?.withFood ? '🍛 Khane ke saath' : '💧 Khali pet / Paani ke saath'}
                        </span>

                        {med?.critical && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-danger/20 text-danger border border-danger/40">
                            ⭐ Zaroori / Critical
                          </span>
                        )}

                        {isLowStock && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-saffron text-deepOlive animate-pulse">
                            📦 Kam bachi hai ({med?.stockCount} left)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Individual Pill Checkbox Button */}
                  <button
                    onClick={() => handleToggleSingleDose(dose)}
                    aria-label={`Mark ${med?.name} as ${isTaken ? 'pending' : 'taken'}`}
                    className={`shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-20 flex items-center justify-center transition-all ${
                      isTaken
                        ? 'bg-deepOlive text-cream shadow-md scale-105'
                        : isMissed
                          ? 'border-2 border-danger text-danger bg-danger/10'
                          : 'border-2 border-borderMuted hover:border-terracotta bg-cream hover:bg-sage'
                    }`}
                  >
                    {isTaken ? (
                      <CheckCircle2 className="w-8 h-8" />
                    ) : (
                      <span className="text-2xl opacity-40">○</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* GIANT "SAB LE LI ✓" BUTTON */}
        {currentSlotDoses.length > 0 && (
          <div className="mt-8 pt-4 border-t border-borderMuted dark:border-zinc-700">
            {allTakenInActiveSlot ? (
              <div className="p-4 bg-sage/60 dark:bg-zinc-700 text-deepOlive dark:text-cream rounded-20 text-center font-bold text-lg flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6 text-terracotta" />
                <span>{SLOT_INFO[activeSlot].label} ki sabhi goliyan li ja chuki hain. Shabaash!</span>
              </div>
            ) : (
              <button
                onClick={handleTakeAllInSlot}
                className="w-full py-5 bg-terracotta hover:bg-terracotta-dark text-cream font-heading font-black text-2xl sm:text-3xl rounded-30 shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 border-4 border-white dark:border-zinc-700"
              >
                <CheckCircle2 className="w-8 h-8 text-saffron" />
                <span>{t.takeAll}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Undo Toast */}
      {undoToast && (
        <UndoToast
          message={undoToast.message}
          onUndo={async () => {
            await undoToast.action();
            setUndoToast(null);
          }}
          onDismiss={() => setUndoToast(null)}
          durationSeconds={10}
        />
      )}

      {/* Dadi Voice Modal */}
      <DadiVoiceModal
        isOpen={isDadiOpen}
        onClose={() => setIsDadiOpen(false)}
        onDoseActionCompleted={() => {
          loadData();
          triggerConfetti();
        }}
      />
    </div>
  );
};

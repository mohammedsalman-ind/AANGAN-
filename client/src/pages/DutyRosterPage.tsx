import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { SLOTS, SLOT_INFO, type Duty, type SafeMember, type SlotType } from '@aangan/shared';
import { CalendarCheck, User, Save, Clock, ChevronRight } from 'lucide-react';

export const DutyRosterPage: React.FC = () => {
  const [roster, setRoster] = useState<Duty[]>([]);
  const [members, setMembers] = useState<SafeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Assignment Modal
  const [editingSlot, setEditingSlot] = useState<SlotType | null>(null);
  const [assignedMemberId, setAssignedMemberId] = useState('');
  const [handoffNote, setHandoffNote] = useState('');

  const loadData = async () => {
    try {
      const today = new Date();
      const startDate = today.toISOString().split('T')[0];
      const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [rosterData, memberData] = await Promise.all([
        api.getDutyRoster(startDate, endDate),
        api.getMembers(),
      ]);

      setRoster(rosterData);
      setMembers(memberData);
      if (memberData.length > 0) {
        setAssignedMemberId(memberData[0].id);
      }
    } catch (err) {
      console.warn('Failed to load duty data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveDuty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot || !assignedMemberId) return;

    try {
      await api.setDuty({
        date: selectedDate,
        slot: editingSlot,
        memberId: assignedMemberId,
        handoffNote: handoffNote.trim() || undefined,
      });

      setEditingSlot(null);
      setHandoffNote('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Duty assign karne me samasya aayi.');
    }
  };

  const getDutyForSlot = (dateStr: string, slot: SlotType) => {
    return roster.find((r) => r.date === dateStr && r.slot === slot);
  };

  const memberMap = new Map(members.map((m) => [m.id, m]));

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading font-black text-3xl sm:text-4xl text-deepOlive dark:text-cream flex items-center gap-3">
          <CalendarCheck className="w-8 h-8 text-terracotta" />
          <span>Kiski Duty (Duty Roster Relay)</span>
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Har compartment ke liye zimmedar sadasya. Missed-dose alert pehle inhi ko jayega.
        </p>
      </div>

      {/* Date Selector */}
      <div className="flex items-center gap-3 mb-6 bg-white dark:bg-zinc-800 p-4 rounded-20 border border-borderMuted">
        <label className="text-sm font-bold text-deepOlive dark:text-cream">Tareekh Chunein:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 bg-cream dark:bg-zinc-700 rounded-16 border border-borderMuted text-base font-semibold focus:outline-none"
        />
        {selectedDate === new Date().toISOString().split('T')[0] && (
          <span className="text-xs bg-saffron text-deepOlive font-bold px-2.5 py-1 rounded-full">
            AAJ KI DUTY
          </span>
        )}
      </div>

      {/* 4 Compartment Slots for the Selected Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {SLOTS.map((slot) => {
          const duty = getDutyForSlot(selectedDate, slot);
          const assigned = duty ? memberMap.get(duty.memberId) : null;

          return (
            <div
              key={slot}
              className="bg-white dark:bg-zinc-800 rounded-30 p-6 shadow-card border-2 border-borderMuted hover:border-terracotta transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-borderMuted">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{SLOT_INFO[slot].icon}</span>
                    <h3 className="font-heading font-bold text-2xl capitalize">
                      {SLOT_INFO[slot].label}
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-zinc-500">
                    {SLOT_INFO[slot].time24}
                  </span>
                </div>

                <div className="my-5 flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-sm border-2 border-white shrink-0"
                    style={{ backgroundColor: assigned?.avatar.color || '#C4572E' }}
                  >
                    {assigned?.avatar.emoji || '👤'}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      On-Duty Sadasya
                    </p>
                    <p className="font-heading font-bold text-xl sm:text-2xl text-deepOlive dark:text-cream">
                      {assigned?.name || 'Kisi ko assign nahi'}
                    </p>
                    <p className="text-xs text-zinc-600 capitalize">
                      {assigned?.role || 'Unassigned'}
                    </p>
                  </div>
                </div>

                {duty?.handoffNote && (
                  <div className="bg-cream dark:bg-zinc-700/60 p-3 rounded-16 border border-borderMuted text-xs text-zinc-700 dark:text-zinc-300 italic">
                    💬 Note: "{duty.handoffNote}"
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setEditingSlot(slot);
                  setAssignedMemberId(duty?.memberId || members[0]?.id || '');
                  setHandoffNote(duty?.handoffNote || '');
                }}
                className="mt-4 w-full py-2.5 bg-cream dark:bg-zinc-700 hover:bg-sage font-bold rounded-16 text-sm text-deepOlive dark:text-cream border border-borderMuted transition-all flex items-center justify-center gap-1"
              >
                <span>Duty Badlein / Note Jodein</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Edit Duty Modal */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSaveDuty}
            className="bg-white dark:bg-zinc-800 w-full max-w-md rounded-30 p-6 sm:p-8 shadow-2xl border-2 border-borderMuted"
          >
            <h3 className="font-heading font-bold text-2xl mb-1 capitalize">
              {SLOT_INFO[editingSlot].label} Ki Duty Nirdharit Karein
            </h3>
            <p className="text-xs text-zinc-500 mb-6">Tareekh: {selectedDate}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Kis Sadasya Ko Zimmedari Den?</label>
                <select
                  value={assignedMemberId}
                  onChange={(e) => setAssignedMemberId(e.target.value)}
                  className="w-full px-4 py-3 bg-cream dark:bg-zinc-700 rounded-16 border border-borderMuted text-base font-semibold focus:outline-none"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.avatar.emoji} {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Handoff Note (Optional)</label>
                <textarea
                  rows={3}
                  value={handoffNote}
                  onChange={(e) => setHandoffNote(e.target.value)}
                  placeholder="Jaise: Subah walk ke baad Telmisartan dilwana na bhoolein."
                  className="w-full px-4 py-3 bg-cream dark:bg-zinc-700 rounded-16 border border-borderMuted text-base focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                className="flex-1 py-3 bg-terracotta text-cream font-bold rounded-20 shadow hover:bg-terracotta-dark"
              >
                Duty Save Karein
              </button>
              <button
                type="button"
                onClick={() => setEditingSlot(null)}
                className="px-5 py-3 bg-cream dark:bg-zinc-700 rounded-20 font-semibold"
              >
                Radd
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

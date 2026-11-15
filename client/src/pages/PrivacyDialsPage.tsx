import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import type { SafeMember, PrivacyDials } from '@aangan/shared';
import { Sliders, ShieldCheck, UserPlus, KeyRound, Check, X } from 'lucide-react';

export const PrivacyDialsPage: React.FC = () => {
  const { currentMember } = useAuth();
  const [members, setMembers] = useState<SafeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Add Member Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'caretaker' | 'family'>('caretaker');
  const [newEmail, setNewEmail] = useState('');
  const [oneTimePinCreated, setOneTimePinCreated] = useState<string | null>(null);

  // Reset PIN Modal
  const [resetMember, setResetMember] = useState<SafeMember | null>(null);
  const [newPin, setNewPin] = useState('');

  const isElder = currentMember?.role === 'elder';

  const loadMembers = async () => {
    try {
      const data = await api.getMembers();
      setMembers(data);
    } catch (err) {
      console.warn('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleDialChange = async (memberId: string, dialKey: keyof PrivacyDials, value: any) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    const updatedDials: PrivacyDials = {
      ...member.privacyDials,
      [dialKey]: value,
    };

    // Optimistic UI update
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, privacyDials: updatedDials } : m))
    );

    try {
      await api.updatePrivacyDials(memberId, updatedDials);
      setSuccessMsg(`${member.name} ke privacy dials update ho gaye.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Dials update nahi ho paye.');
      loadMembers();
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    try {
      const res = await api.addMember({
        name: newName,
        role: newRole,
        email: newEmail,
        avatar: { emoji: newRole === 'caretaker' ? '🧑‍⚕️' : '👨', color: '#F2A93B' },
      });

      setOneTimePinCreated(res.oneTimePin);
      loadMembers();
    } catch (err: any) {
      alert(err.message || 'Member add nahi ho paya.');
    }
  };

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetMember || !newPin.trim()) return;

    try {
      await api.resetMemberPin(resetMember.id, newPin);
      setSuccessMsg(`${resetMember.name} ka PIN reset ho gaya.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      setResetMember(null);
      setNewPin('');
    } catch (err: any) {
      alert(err.message || 'PIN reset nahi ho paya.');
    }
  };

  if (!isElder) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <ShieldCheck className="w-16 h-16 text-terracotta mx-auto mb-4" />
        <h2 className="font-heading font-bold text-3xl">Parda & Control (Elder Only)</h2>
        <p className="text-zinc-600 mt-2">
          Sirf ghar ke elder (Dadaji) ke paas privacy dials aur permissions badalne ka adhikar hai.
        </p>
      </div>
    );
  }

  // Non-elder members to configure dials for
  const guestMembers = members.filter((m) => m.role !== 'elder');

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider bg-terracotta text-cream px-3 py-1 rounded-full">
            Elder Sovereign Control
          </span>
          <h1 className="font-heading font-black text-3xl sm:text-4xl text-deepOlive dark:text-cream mt-2 flex items-center gap-3">
            <Sliders className="w-8 h-8 text-terracotta" />
            <span>Parda & Privacy Dials</span>
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Elder tay karte hain ki kaun sa sadasya kya dekh sakta hai, kya badal sakta hai aur alerts kab jayein.
          </p>
        </div>

        <button
          onClick={() => {
            setOneTimePinCreated(null);
            setNewName('');
            setNewEmail('');
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 bg-terracotta hover:bg-terracotta-dark text-cream font-bold px-5 py-3 rounded-20 shadow-md active:scale-95 transition-all text-base"
        >
          <UserPlus className="w-5 h-5" />
          <span>Naya Sadasya Jodein</span>
        </button>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-sage text-deepOlive font-bold rounded-20 shadow-sm flex items-center gap-2">
          <Check className="w-5 h-5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Member Dial Cards */}
      <div className="space-y-6">
        {guestMembers.map((member) => (
          <div
            key={member.id}
            className="bg-white dark:bg-zinc-800 rounded-30 p-6 sm:p-8 shadow-card border-2 border-borderMuted dark:border-zinc-700"
          >
            {/* Member Profile Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-borderMuted dark:border-zinc-700">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-sm border-2 border-white"
                  style={{ backgroundColor: member.avatar.color }}
                >
                  {member.avatar.emoji}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-2xl text-deepOlive dark:text-cream">
                    {member.name}
                  </h3>
                  <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">
                    Role: {member.role} • {member.email}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setResetMember(member)}
                className="flex items-center gap-1.5 text-xs font-bold text-terracotta bg-cream hover:bg-sage px-3 py-2 rounded-16 border border-borderMuted shadow-sm"
              >
                <KeyRound className="w-4 h-4" />
                <span>PIN Reset Karein</span>
              </button>
            </div>

            {/* Dials Toggles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {/* Dial 1: See Adherence Record */}
              <label className="flex items-center justify-between p-4 bg-cream/50 dark:bg-zinc-700/50 rounded-20 border border-borderMuted cursor-pointer hover:border-terracotta transition-all">
                <div>
                  <p className="font-bold text-base">Meri Dawaiyon Ka Record Dekhein</p>
                  <p className="text-xs text-zinc-500">Pillbox aur adherence dekh sakte hain</p>
                </div>
                <input
                  type="checkbox"
                  checked={member.privacyDials.canSeeAdherence}
                  onChange={(e) => handleDialChange(member.id, 'canSeeAdherence', e.target.checked)}
                  className="w-6 h-6 accent-terracotta cursor-pointer rounded"
                />
              </label>

              {/* Dial 2: See Check-ins */}
              <label className="flex items-center justify-between p-4 bg-cream/50 dark:bg-zinc-700/50 rounded-20 border border-borderMuted cursor-pointer hover:border-terracotta transition-all">
                <div>
                  <p className="font-bold text-base">Meri Tabiyat (Check-in) Dekhein</p>
                  <p className="text-xs text-zinc-500">Daily mood aur lakshan dekh sakte hain</p>
                </div>
                <input
                  type="checkbox"
                  checked={member.privacyDials.canSeeCheckins}
                  onChange={(e) => handleDialChange(member.id, 'canSeeCheckins', e.target.checked)}
                  className="w-6 h-6 accent-terracotta cursor-pointer rounded"
                />
              </label>

              {/* Dial 3: See Doctor Appointments */}
              <label className="flex items-center justify-between p-4 bg-cream/50 dark:bg-zinc-700/50 rounded-20 border border-borderMuted cursor-pointer hover:border-terracotta transition-all">
                <div>
                  <p className="font-bold text-base">Doctor Appointments Dekhein</p>
                  <p className="text-xs text-zinc-500">Doctor visit dates aur sawal dekh sakte hain</p>
                </div>
                <input
                  type="checkbox"
                  checked={member.privacyDials.canSeeAppointments}
                  onChange={(e) =>
                    handleDialChange(member.id, 'canSeeAppointments', e.target.checked)
                  }
                  className="w-6 h-6 accent-terracotta cursor-pointer rounded"
                />
              </label>

              {/* Dial 4: Edit Medicines */}
              <label className="flex items-center justify-between p-4 bg-cream/50 dark:bg-zinc-700/50 rounded-20 border border-borderMuted cursor-pointer hover:border-terracotta transition-all">
                <div>
                  <p className="font-bold text-base">Dawai Jodne / Badalne Ka Adhikar</p>
                  <p className="text-xs text-zinc-500">Nayi dawai add ya time change kar sakte hain</p>
                </div>
                <input
                  type="checkbox"
                  checked={member.privacyDials.canEditMedicines}
                  onChange={(e) => handleDialChange(member.id, 'canEditMedicines', e.target.checked)}
                  className="w-6 h-6 accent-terracotta cursor-pointer rounded"
                />
              </label>

              {/* Dial 5: Receive Missed Dose Alerts */}
              <label className="flex items-center justify-between p-4 bg-cream/50 dark:bg-zinc-700/50 rounded-20 border border-borderMuted cursor-pointer hover:border-terracotta transition-all">
                <div>
                  <p className="font-bold text-base">Missed-Dose Email Alerts Milein</p>
                  <p className="text-xs text-zinc-500">Dawai chhootne par email alert prapt hoga</p>
                </div>
                <input
                  type="checkbox"
                  checked={member.privacyDials.getMissedAlerts}
                  onChange={(e) => handleDialChange(member.id, 'getMissedAlerts', e.target.checked)}
                  className="w-6 h-6 accent-terracotta cursor-pointer rounded"
                />
              </label>

              {/* Dial 6: Delay Minutes Slider */}
              <div className="p-4 bg-cream/50 dark:bg-zinc-700/50 rounded-20 border border-borderMuted">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-base">Alert Bhejne Se Pehle Wait</span>
                  <span className="text-sm font-bold text-terracotta">
                    {member.privacyDials.missedAlertDelayMin} Minute
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={120}
                  step={5}
                  value={member.privacyDials.missedAlertDelayMin}
                  onChange={(e) =>
                    handleDialChange(member.id, 'missedAlertDelayMin', Number(e.target.value))
                  }
                  className="w-full accent-terracotta cursor-pointer"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  On-duty sadasya ke kitne minute baad inko escalation email jaye.
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-800 w-full max-w-md rounded-30 p-6 sm:p-8 shadow-2xl border-2 border-borderMuted">
            <div className="flex items-center justify-between pb-4 border-b border-borderMuted mb-6">
              <h3 className="font-heading font-bold text-2xl">Aangan Me Sadasya Jodein</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-full hover:bg-cream">
                <X className="w-5 h-5" />
              </button>
            </div>

            {oneTimePinCreated ? (
              <div className="text-center py-4">
                <p className="text-sm text-zinc-600 mb-2">
                  Naye sadasya ke liye ek baar ka secret PIN taiyar hai:
                </p>
                <div className="text-4xl font-mono font-black text-terracotta bg-cream p-4 rounded-20 tracking-widest my-4 border-2 border-dashed border-terracotta">
                  {oneTimePinCreated}
                </div>
                <p className="text-xs text-danger font-semibold">
                  ⚠️ Yeh PIN sirf ek baar dikhaya ja raha hai. Kripya sadasya ko note karwa dein.
                </p>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-full mt-6 py-3 bg-terracotta text-cream font-bold rounded-20"
                >
                  Ho Gaya (Done)
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Sadasya Ka Naam</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Jaise: Priya"
                    className="w-full px-4 py-3 bg-cream rounded-16 border border-borderMuted text-base focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-1">Email (Alerts Ke Liye)</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="priya@family.com"
                    className="w-full px-4 py-3 bg-cream rounded-16 border border-borderMuted text-base focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full px-4 py-3 bg-cream rounded-16 border border-borderMuted text-base font-semibold focus:outline-none"
                  >
                    <option value="caretaker">Caretaker (Dekhbhal Karta)</option>
                    <option value="family">Pariwar Sadasya (Family Member)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full mt-6 py-4 bg-terracotta text-cream font-bold text-lg rounded-20 shadow-md hover:bg-terracotta-dark"
                >
                  One-Time PIN Banayein →
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Reset PIN Modal */}
      {resetMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleResetPin}
            className="bg-white dark:bg-zinc-800 w-full max-w-sm rounded-30 p-6 sm:p-8 shadow-2xl border-2 border-borderMuted"
          >
            <h3 className="font-heading font-bold text-2xl mb-1">PIN Reset Karein</h3>
            <p className="text-xs text-zinc-500 mb-6">{resetMember.name} ke liye naya 4-digit PIN dalein</p>

            <input
              type="text"
              maxLength={6}
              required
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="4-digit PIN"
              className="w-full text-center tracking-widest text-3xl font-mono font-bold py-3 bg-cream rounded-16 border border-borderMuted focus:outline-none"
            />

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                className="flex-1 py-3 bg-terracotta text-cream font-bold rounded-20 shadow"
              >
                Reset PIN
              </button>
              <button
                type="button"
                onClick={() => setResetMember(null)}
                className="px-4 py-3 bg-cream rounded-20 font-semibold"
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

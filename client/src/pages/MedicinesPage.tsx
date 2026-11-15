import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../api/client.js';
import { SLOTS, SLOT_INFO, type Medicine, type SlotType } from '@aangan/shared';
import { Plus, Edit2, Trash2, AlertCircle, ShieldAlert, X } from 'lucide-react';

export const MedicinesPage: React.FC = () => {
  const { currentMember } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [strength, setStrength] = useState('');
  const [purposeSimple, setPurposeSimple] = useState('');
  const [slots, setSlots] = useState<SlotType[]>(['subah']);
  const [withFood, setWithFood] = useState(false);
  const [critical, setCritical] = useState(false);
  const [stockCount, setStockCount] = useState(30);
  const [color, setColor] = useState('#C4572E');
  const [emoji, setEmoji] = useState('💊');

  const canEdit =
    currentMember?.role === 'elder' || currentMember?.privacyDials?.canEditMedicines === true;

  const loadMeds = async () => {
    try {
      const data = await api.getMedicines(true);
      setMedicines(data);
    } catch (err: any) {
      setError(err.message || 'Dawaiyan load nahi ho payin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeds();
  }, []);

  const openCreateModal = () => {
    setEditingMed(null);
    setName('');
    setStrength('');
    setPurposeSimple('');
    setSlots(['subah']);
    setWithFood(false);
    setCritical(false);
    setStockCount(30);
    setColor('#C4572E');
    setEmoji('💊');
    setShowModal(true);
  };

  const openEditModal = (med: Medicine) => {
    setEditingMed(med);
    setName(med.name);
    setStrength(med.strength);
    setPurposeSimple(med.purposeSimple);
    setSlots(med.slots);
    setWithFood(med.withFood);
    setCritical(med.critical);
    setStockCount(med.stockCount);
    setColor(med.color);
    setEmoji(med.emoji);
    setShowModal(true);
  };

  const handleSlotToggle = (slot: SlotType) => {
    if (slots.includes(slot)) {
      if (slots.length > 1) {
        setSlots(slots.filter((s) => s !== slot));
      }
    } else {
      setSlots([...slots, slot]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !strength.trim()) return;

    try {
      const payload = {
        name,
        strength,
        purposeSimple,
        slots,
        withFood,
        critical,
        stockCount: Number(stockCount),
        color,
        emoji,
        active: true,
      };

      if (editingMed) {
        await api.updateMedicine(editingMed.id, payload);
      } else {
        await api.createMedicine(payload);
      }

      setShowModal(false);
      loadMeds();
    } catch (err: any) {
      alert(err.message || 'Dawai save karne me samasya aayi.');
    }
  };

  const handleDelete = async (id: string, medName: string) => {
    if (!confirm(`Kya aap sach me "${medName}" ko band (deactivate) karna chahte hain?`)) return;
    try {
      await api.deleteMedicine(id);
      loadMeds();
    } catch (err: any) {
      alert(err.message || 'Deactivate failed');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl text-deepOlive dark:text-cream flex items-center gap-3">
            <span>💊</span> Ghar Ki Dawaiyan (Medicines)
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Sabhi dawaiyon ka stock, timings aur details
          </p>
        </div>

        {canEdit ? (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-terracotta hover:bg-terracotta-dark text-cream font-bold px-5 py-3 rounded-20 shadow-md active:scale-95 transition-all text-base"
          >
            <Plus className="w-5 h-5" />
            <span>Nayi Dawai Jodein</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-saffron/20 text-deepOlive px-4 py-2 rounded-20 text-sm font-semibold border border-saffron">
            <ShieldAlert className="w-4 h-4 text-terracotta" />
            <span>Elder ne dawai badalna restrict kiya hai</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-danger/10 text-danger rounded-20 font-bold">{error}</div>
      )}

      {/* Medicines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {medicines.map((med) => {
          const isLow = med.stockCount <= 3;
          return (
            <div
              key={med.id}
              className="bg-white dark:bg-zinc-800 rounded-30 p-6 shadow-card border border-borderMuted dark:border-zinc-700 flex flex-col justify-between relative group hover:border-terracotta transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-14 h-14 rounded-20 flex items-center justify-center text-3xl shadow-sm border border-borderMuted"
                      style={{ backgroundColor: med.color }}
                    >
                      {med.emoji}
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-xl sm:text-2xl text-deepOlive dark:text-cream">
                        {med.name}
                      </h3>
                      <p className="text-sm font-semibold text-zinc-500">{med.strength}</p>
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(med)}
                        aria-label={`Edit ${med.name}`}
                        className="p-2 hover:bg-cream dark:hover:bg-zinc-700 rounded-12 text-zinc-600 dark:text-zinc-300"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(med.id, med.name)}
                        aria-label={`Delete ${med.name}`}
                        className="p-2 hover:bg-red-50 text-danger rounded-12"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                  <strong>Karan:</strong> {med.purposeSimple || 'Samanya upchar'}
                </p>

                {/* Slots Chips */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {med.slots.map((s) => (
                    <span
                      key={s}
                      className="text-xs bg-cream dark:bg-zinc-700 text-deepOlive dark:text-cream px-2.5 py-1 rounded-12 font-bold flex items-center gap-1 border border-borderMuted"
                    >
                      <span>{SLOT_INFO[s].icon}</span>
                      <span>{SLOT_INFO[s].label}</span>
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-sage text-deepOlive">
                    {med.withFood ? '🍛 Khane ke saath' : '💧 Khali pet'}
                  </span>
                  {med.critical && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-danger/20 text-danger border border-danger/30">
                      ⭐ Critical
                    </span>
                  )}
                </div>
              </div>

              {/* Stock Bar */}
              <div className="mt-6 pt-4 border-t border-borderMuted dark:border-zinc-700 flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500 font-bold uppercase">Bacha Hua Stock</p>
                  <p className="text-xl font-bold font-heading">{med.stockCount} doses</p>
                </div>

                {isLow && (
                  <span className="text-xs font-bold bg-saffron text-deepOlive px-3 py-1 rounded-full animate-pulse flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Kam bachi hai!</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <form
            onSubmit={handleSave}
            className="bg-white dark:bg-zinc-800 w-full max-w-lg rounded-30 p-6 sm:p-8 shadow-2xl border-2 border-borderMuted my-8"
          >
            <div className="flex items-center justify-between pb-4 border-b border-borderMuted mb-6">
              <h3 className="font-heading font-bold text-2xl">
                {editingMed ? 'Dawai Me Badlav Karein' : 'Nayi Dawai Jodein'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 rounded-full hover:bg-cream dark:hover:bg-zinc-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-bold mb-1">Dawai Ka Naam</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jaise: Metformin"
                  className="w-full px-4 py-3 bg-cream dark:bg-zinc-700 rounded-16 border border-borderMuted text-base focus:outline-none focus:ring-2 focus:ring-terracotta"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold mb-1">Power / Strength</label>
                  <input
                    type="text"
                    required
                    value={strength}
                    onChange={(e) => setStrength(e.target.value)}
                    placeholder="Jaise: 500 mg"
                    className="w-full px-4 py-3 bg-cream dark:bg-zinc-700 rounded-16 border border-borderMuted text-base focus:outline-none focus:ring-2 focus:ring-terracotta"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Stock Count</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={stockCount}
                    onChange={(e) => setStockCount(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-cream dark:bg-zinc-700 rounded-16 border border-borderMuted text-base focus:outline-none focus:ring-2 focus:ring-terracotta"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Saral Udyeshya (Purpose)</label>
                <input
                  type="text"
                  value={purposeSimple}
                  onChange={(e) => setPurposeSimple(e.target.value)}
                  placeholder="Jaise: Sugar control ke liye"
                  className="w-full px-4 py-3 bg-cream dark:bg-zinc-700 rounded-16 border border-borderMuted text-base focus:outline-none focus:ring-2 focus:ring-terracotta"
                />
              </div>

              {/* Slot Toggles */}
              <div>
                <label className="block text-sm font-bold mb-2">Kaun Se Samay Par Lena Hai?</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SLOTS.map((s) => {
                    const isSelected = slots.includes(s);
                    return (
                      <button
                        type="button"
                        key={s}
                        onClick={() => handleSlotToggle(s)}
                        className={`py-2 px-3 rounded-16 text-sm font-bold flex items-center justify-center gap-1 border transition-all ${
                          isSelected
                            ? 'bg-terracotta text-cream border-terracotta shadow-sm'
                            : 'bg-cream dark:bg-zinc-700 border-borderMuted opacity-60'
                        }`}
                      >
                        <span>{SLOT_INFO[s].icon}</span>
                        <span>{SLOT_INFO[s].label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Food & Critical Toggles */}
              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold">
                  <input
                    type="checkbox"
                    checked={withFood}
                    onChange={(e) => setWithFood(e.target.checked)}
                    className="w-5 h-5 accent-terracotta rounded"
                  />
                  <span>Khane ke saath (With food)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-danger">
                  <input
                    type="checkbox"
                    checked={critical}
                    onChange={(e) => setCritical(e.target.checked)}
                    className="w-5 h-5 accent-danger rounded"
                  />
                  <span>Critical Dawai ⭐</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-6 py-4 bg-terracotta text-cream font-bold text-lg rounded-20 shadow-md hover:bg-terracotta-dark active:scale-95 transition-all"
            >
              {editingMed ? 'Badlav Save Karein' : 'Dawai Jodein'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

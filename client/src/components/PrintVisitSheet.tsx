import React from 'react';
import type { Appointment, Medicine, Dose, Checkin } from '@aangan/shared';
import { SLOTS } from '@aangan/shared';

interface PrintVisitSheetProps {
  appointment: Appointment;
  elderName: string;
  medicines: Medicine[];
  doses: Dose[];
  checkins: Checkin[];
  onClose: () => void;
}

export const PrintVisitSheet: React.FC<PrintVisitSheetProps> = ({
  appointment,
  elderName,
  medicines,
  doses,
  checkins,
  onClose,
}) => {
  // Calculate adherence % per medicine over the recorded doses
  const medAdherence = medicines.map((med) => {
    const medDoses = doses.filter((d) => d.medicineId === med.id);
    const taken = medDoses.filter((d) => d.status === 'taken').length;
    const total = medDoses.length;
    const pct = total > 0 ? Math.round((taken / total) * 100) : 100;
    return { ...med, taken, total, pct };
  });

  // Calculate missed slots count
  const missedBySlot: Record<string, number> = { subah: 0, dopahar: 0, shaam: 0, raat: 0 };
  for (const d of doses) {
    if (d.status === 'missed') {
      missedBySlot[d.slot] = (missedBySlot[d.slot] || 0) + 1;
    }
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 sm:p-6 flex justify-center items-start">
      <div className="bg-white text-zinc-900 w-full max-w-4xl p-8 rounded-30 shadow-2xl relative">
        {/* Screen Action Bar (hidden on print) */}
        <div className="no-print flex items-center justify-between pb-6 border-b border-zinc-200 mb-6">
          <div>
            <h2 className="text-2xl font-bold font-heading text-terracotta">Doctor Visit Summary Sheet</h2>
            <p className="text-sm text-zinc-600">Print or save as PDF for {appointment.doctor}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-deepOlive text-white font-bold rounded-16 shadow hover:bg-deepOlive-dark flex items-center gap-2"
            >
              🖨️ Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 font-bold rounded-16"
            >
              Band Karein
            </button>
          </div>
        </div>

        {/* Printable Section */}
        <div id="printable-visit-sheet">
          {/* Header */}
          <div className="border-b-2 border-zinc-800 pb-4 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-black font-heading text-zinc-900">AANGAN CLINICAL REPORT</h1>
              <p className="text-sm font-semibold text-zinc-600">Elder: <strong>{elderName}</strong></p>
              <p className="text-sm text-zinc-600">Generated: {new Date().toLocaleDateString('hi-IN', { dateStyle: 'full' })}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">{appointment.doctor}</p>
              <p className="text-sm text-zinc-700">{appointment.reason}</p>
              <p className="text-xs text-zinc-500">Date: {new Date(appointment.datetime).toLocaleString()}</p>
              <p className="text-xs text-zinc-500">{appointment.location}</p>
            </div>
          </div>

          {/* Section 1: Medication Adherence % Table */}
          <div className="mb-6">
            <h3 className="text-lg font-bold uppercase tracking-wider text-zinc-800 border-b pb-1 mb-3">
              1. Current Medications & 14-Day Adherence
            </h3>
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-zinc-100 border-b">
                  <th className="p-2.5">Medicine Name</th>
                  <th className="p-2.5">Strength</th>
                  <th className="p-2.5">Slots</th>
                  <th className="p-2.5">Purpose</th>
                  <th className="p-2.5">Stock</th>
                  <th className="p-2.5 text-right">Adherence %</th>
                </tr>
              </thead>
              <tbody>
                {medAdherence.map((m) => (
                  <tr key={m.id} className="border-b">
                    <td className="p-2.5 font-bold">{m.name}</td>
                    <td className="p-2.5">{m.strength}</td>
                    <td className="p-2.5 capitalize">{m.slots.join(', ')}</td>
                    <td className="p-2.5 text-zinc-600">{m.purposeSimple}</td>
                    <td className="p-2.5">{m.stockCount} doses</td>
                    <td className="p-2.5 text-right font-bold">
                      <span className={m.pct >= 85 ? 'text-green-700' : 'text-red-700'}>
                        {m.pct}% ({m.taken}/{m.total})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 2: Missed Slot Heatmap */}
          <div className="mb-6">
            <h3 className="text-lg font-bold uppercase tracking-wider text-zinc-800 border-b pb-1 mb-3">
              2. Missed Dose Distribution by Compartment
            </h3>
            <div className="grid grid-cols-4 gap-3 text-center">
              {SLOTS.map((s) => (
                <div key={s} className="border p-3 rounded-12 bg-zinc-50">
                  <p className="text-xs font-bold uppercase text-zinc-600">{s}</p>
                  <p className="text-2xl font-black text-zinc-900 mt-1">{missedBySlot[s] || 0}</p>
                  <p className="text-[11px] text-zinc-500">Missed doses</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Recent Check-in & Symptoms Trend */}
          <div className="mb-6">
            <h3 className="text-lg font-bold uppercase tracking-wider text-zinc-800 border-b pb-1 mb-3">
              3. Recent Symptoms & Mood Log
            </h3>
            {checkins.length === 0 ? (
              <p className="text-sm text-zinc-500">No symptoms recorded in the last 7 days.</p>
            ) : (
              <div className="space-y-2">
                {checkins.slice(0, 5).map((c) => (
                  <div key={c.id} className="text-sm border-b pb-2 flex justify-between">
                    <div>
                      <span className="font-semibold">{c.date}: </span>
                      <span>Symptoms: {c.symptoms.join(', ') || 'None reported'}</span>
                      {c.note && <p className="text-xs text-zinc-600 italic mt-0.5">Note: "{c.note}"</p>}
                    </div>
                    <span className="font-bold text-zinc-700">Mood: {c.mood}/5</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Prepared Questions for Doctor */}
          <div className="mb-6">
            <h3 className="text-lg font-bold uppercase tracking-wider text-zinc-800 border-b pb-1 mb-3">
              4. Questions Prepared for Doctor
            </h3>
            {appointment.questions.length === 0 ? (
              <p className="text-sm text-zinc-500 italic">No specific questions added yet.</p>
            ) : (
              <ul className="list-disc pl-5 space-y-1 text-sm font-medium">
                {appointment.questions.map((q, idx) => (
                  <li key={idx}>{q}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Doctor Notes Box */}
          <div className="border-2 border-dashed border-zinc-400 p-4 rounded-12 mt-6">
            <p className="text-xs font-bold uppercase text-zinc-500 mb-6">Doctor's Notes / Advice:</p>
            <div className="h-16" />
          </div>
        </div>
      </div>
    </div>
  );
};

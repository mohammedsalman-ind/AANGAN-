import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client.js';
import { SLOTS, SLOT_INFO, type SlotType, type Dose, type Medicine } from '@aangan/shared';
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Clock, X } from 'lucide-react';

const WEEKDAYS = [
  { day: 'Somvar (Mon)', hindi: 'सोमवार' },
  { day: 'Mangalvar (Tue)', hindi: 'मंगलवार' },
  { day: 'Budhvar (Wed)', hindi: 'बुधवार' },
  { day: 'Guruvar (Thu)', hindi: 'गुरुवार' },
  { day: 'Shukravar (Fri)', hindi: 'शुक्रवार' },
  { day: 'Shanivar (Sat)', hindi: 'शनिवार' },
  { day: 'Ravivar (Sun)', hindi: 'रविवार' },
];

export const PillboxPage: React.FC = () => {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [doses, setDoses] = useState<Array<Dose & { medicine: Medicine | null }>>([]);
  const [selectedCell, setSelectedCell] = useState<{
    dateStr: string;
    slot: SlotType;
    doses: Array<Dose & { medicine: Medicine | null }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Compute 7 days of the selected week (Monday to Sunday)
  const weekDays = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay();
    // Monday as start of week: 1 is Mon, 0 is Sun -> diff
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset + currentWeekOffset * 7);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      days.push({
        dateStr,
        dayLabel: WEEKDAYS[i].day,
        hindiLabel: WEEKDAYS[i].hindi,
        formattedDate: d.toLocaleDateString('hi-IN', { month: 'short', day: 'numeric' }),
        isToday,
      });
    }
    return days;
  }, [currentWeekOffset]);

  const loadRange = async () => {
    setLoading(true);
    try {
      const start = weekDays[0].dateStr;
      const end = weekDays[6].dateStr;
      const data = await api.getDosesRange(start, end);
      setDoses(data);
    } catch (err) {
      console.warn('Failed to load pillbox doses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRange();
  }, [weekDays]);

  const handleCellClick = (dateStr: string, slot: SlotType) => {
    const cellDoses = doses.filter((d) => d.date === dateStr && d.slot === slot);
    setSelectedCell({ dateStr, slot, doses: cellDoses });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      {/* Header & Week Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl text-deepOlive dark:text-cream flex items-center gap-3">
            <span>💊</span> Digital Pillbox Grid (7×4)
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Asli pillbox jaisa 7 din aur 4 compartment ka nazaara
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 p-1.5 rounded-20 border border-borderMuted shadow-sm">
          <button
            onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
            aria-label="Previous week"
            className="p-2 hover:bg-cream dark:hover:bg-zinc-700 rounded-16 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentWeekOffset(0)}
            className="px-3 py-1 text-sm font-bold bg-sage text-deepOlive rounded-12"
          >
            Aaj Ka Hafta
          </button>
          <button
            onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
            aria-label="Next week"
            className="p-2 hover:bg-cream dark:hover:bg-zinc-700 rounded-16 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 7x4 Accessible Pillbox Grid */}
      <div className="overflow-x-auto pb-4">
        <div
          role="grid"
          aria-label="Weekly Pillbox Organizer"
          className="min-w-[800px] bg-white dark:bg-zinc-800 rounded-30 p-4 sm:p-6 shadow-card border-2 border-borderMuted dark:border-zinc-700"
        >
          {/* Grid Header: 4 Slots */}
          <div role="row" className="grid grid-cols-5 gap-3 pb-3 border-b border-borderMuted text-center font-heading font-bold text-base sm:text-lg">
            <div role="columnheader" className="text-left pl-3 text-zinc-500">Din (Day)</div>
            {SLOTS.map((slot) => (
              <div role="columnheader" key={slot} className="flex items-center justify-center gap-1.5 py-1 rounded-16 bg-cream dark:bg-zinc-700">
                <span>{SLOT_INFO[slot].icon}</span>
                <span>{SLOT_INFO[slot].label}</span>
              </div>
            ))}
          </div>

          {/* 7 Rows for 7 Days */}
          <div className="divide-y divide-borderMuted/60 dark:divide-zinc-700">
            {weekDays.map((day) => (
              <div
                role="row"
                key={day.dateStr}
                className={`grid grid-cols-5 gap-3 py-3 items-center ${
                  day.isToday ? 'bg-terracotta/5 dark:bg-terracotta/10 rounded-20 px-2' : ''
                }`}
              >
                {/* Day Header Cell */}
                <div role="rowheader" className="text-left pl-2">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-base sm:text-lg leading-tight">
                      {day.dayLabel.split(' ')[0]}
                    </span>
                    {day.isToday && (
                      <span className="text-[10px] bg-terracotta text-cream px-2 py-0.5 rounded-full font-bold">
                        AAJ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">{day.formattedDate}</p>
                </div>

                {/* 4 Compartment Cells */}
                {SLOTS.map((slot) => {
                  const cellDoses = doses.filter(
                    (d) => d.date === day.dateStr && d.slot === slot
                  );
                  const total = cellDoses.length;
                  const taken = cellDoses.filter((d) => d.status === 'taken').length;
                  const hasMissed = cellDoses.some((d) => d.status === 'missed');
                  const isAllTaken = total > 0 && taken === total;

                  const accessibleLabel = `${day.dayLabel} ${slot}, ${total} dawai, ${taken} li gayi`;

                  return (
                    <button
                      role="gridcell"
                      aria-label={accessibleLabel}
                      key={slot}
                      onClick={() => handleCellClick(day.dateStr, slot)}
                      className={`h-24 sm:h-28 rounded-20 p-2 sm:p-2.5 flex flex-col justify-between border-2 transition-all hover:scale-105 active:scale-95 text-left relative ${
                        total === 0
                          ? 'bg-cream/30 dark:bg-zinc-800/40 border-dashed border-borderMuted/80 opacity-60'
                          : isAllTaken
                            ? 'bg-sage/40 dark:bg-zinc-700 border-deepOlive/40'
                            : hasMissed
                              ? 'bg-danger/10 border-danger/40'
                              : 'bg-white dark:bg-zinc-700/80 border-borderMuted shadow-sm'
                      }`}
                    >
                      {/* Compartment Status Icon & Counter */}
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-semibold text-zinc-500">
                          {total > 0 ? `${taken}/${total}` : 'Khali'}
                        </span>
                        {isAllTaken && <CheckCircle2 className="w-4 h-4 text-deepOlive" />}
                        {hasMissed && <AlertCircle className="w-4 h-4 text-danger animate-pulse" />}
                        {!isAllTaken && !hasMissed && total > 0 && (
                          <Clock className="w-4 h-4 text-saffron" />
                        )}
                      </div>

                      {/* Tiny Colored Pill Visuals inside Compartment */}
                      <div className="flex flex-wrap gap-1 items-center mt-1">
                        {cellDoses.map((d) => (
                          <span
                            key={d.id}
                            title={`${d.medicine?.name} (${d.status})`}
                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-black/20 flex items-center justify-center text-[8px] ${
                              d.status === 'taken' ? 'opacity-100 ring-1 ring-deepOlive' : 'opacity-85'
                            }`}
                            style={{ backgroundColor: d.medicine?.color || '#C4572E' }}
                          >
                            {d.status === 'taken' ? '✓' : ''}
                          </span>
                        ))}
                      </div>

                      <div className="text-[10px] text-zinc-400 capitalize self-end">
                        {slot}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Modal on Compartment Tap */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-800 w-full max-w-md rounded-30 p-6 shadow-2xl border-2 border-borderMuted relative">
            <button
              onClick={() => setSelectedCell(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-cream dark:hover:bg-zinc-700"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-xs font-bold uppercase tracking-wider bg-saffron text-deepOlive px-3 py-1 rounded-full">
              {selectedCell.dateStr}
            </span>
            <h3 className="font-heading font-bold text-2xl mt-2 capitalize flex items-center gap-2">
              <span>{SLOT_INFO[selectedCell.slot].icon}</span>
              <span>{SLOT_INFO[selectedCell.slot].label} Ki Dawaiyan</span>
            </h3>

            {selectedCell.doses.length === 0 ? (
              <p className="text-zinc-500 my-6">Is compartment me koi dawai nahi thi.</p>
            ) : (
              <div className="divide-y divide-borderMuted dark:divide-zinc-700 my-4">
                {selectedCell.doses.map((dose) => (
                  <div key={dose.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-lg">{dose.medicine?.name}</p>
                      <p className="text-xs text-zinc-500">
                        {dose.medicine?.strength} • {dose.medicine?.purposeSimple}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-bold ${
                        dose.status === 'taken'
                          ? 'bg-deepOlive text-cream'
                          : dose.status === 'missed'
                            ? 'bg-danger text-cream'
                            : 'bg-saffron text-deepOlive'
                      }`}
                    >
                      {dose.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setSelectedCell(null)}
              className="w-full mt-4 py-3 bg-terracotta text-cream font-bold rounded-20"
            >
              Band Karein
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useMemo } from 'react';
import { SLOTS, SLOT_INFO, type SlotType } from '@aangan/shared';

interface DayArcProps {
  activeSlot: SlotType;
  onSelectSlot?: (slot: SlotType) => void;
  slotStatuses?: Record<SlotType, 'all_taken' | 'pending' | 'missed' | 'empty'>;
}

export const DayArc: React.FC<DayArcProps> = ({
  activeSlot,
  onSelectSlot,
  slotStatuses = { subah: 'all_taken', dopahar: 'pending', shaam: 'pending', raat: 'pending' },
}) => {
  // Live sun marker position based on current local hour
  const currentSunPercent = useMemo(() => {
    const now = new Date();
    const hours = now.getHours() + now.getMinutes() / 60;
    // Map 6:00 (0%) to 23:00 (100%)
    const clamped = Math.max(6, Math.min(23, hours));
    return ((clamped - 6) / 17) * 100;
  }, []);

  const slotCoords: Record<SlotType, { x: number; y: number; pct: number }> = {
    subah: { x: 50, y: 70, pct: 10 },
    dopahar: { x: 150, y: 25, pct: 40 },
    shaam: { x: 250, y: 25, pct: 70 },
    raat: { x: 350, y: 70, pct: 95 },
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-800 rounded-30 p-6 shadow-soft border border-borderMuted mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-heading font-bold text-xl sm:text-2xl text-deepOlive dark:text-cream flex items-center gap-2">
          <span>☀️</span> Aaj Ka Din (Day Arc)
        </h2>
        <span className="text-sm font-semibold px-3 py-1 bg-sage dark:bg-zinc-700 text-deepOlive dark:text-cream rounded-full">
          Live Sun Path
        </span>
      </div>

      <div className="relative w-full max-w-lg mx-auto py-2">
        <svg viewBox="0 0 400 100" className="w-full overflow-visible">
          <defs>
            <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F2A93B" stopOpacity="0.4" />
              <stop offset="40%" stopColor="#F2A93B" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#C4572E" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3F4A2B" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Dotted Horizon Base */}
          <line x1="20" y1="85" x2="380" y2="85" stroke="#E8DCC9" strokeWidth="2" strokeDasharray="4 4" />

          {/* Arc Path */}
          <path
            d="M 40 80 Q 200 -20 360 80"
            fill="none"
            stroke="url(#arcGrad)"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Live Sun Marker */}
          <circle
            cx={40 + (currentSunPercent / 100) * 320}
            cy={80 - Math.sin((currentSunPercent / 100) * Math.PI) * 75}
            r="8"
            fill="#F2A93B"
            className="animate-pulse shadow-lg"
          />
          <circle
            cx={40 + (currentSunPercent / 100) * 320}
            cy={80 - Math.sin((currentSunPercent / 100) * Math.PI) * 75}
            r="14"
            fill="#F2A93B"
            opacity="0.25"
            className="animate-ping"
          />

          {/* 4 Compartment Stops */}
          {SLOTS.map((slot) => {
            const coord = slotCoords[slot];
            const isSelected = activeSlot === slot;
            const status = slotStatuses[slot];

            let badgeColor = '#F2A93B';
            if (status === 'all_taken') badgeColor = '#3F4A2B';
            if (status === 'missed') badgeColor = '#B3261E';

            return (
              <g
                key={slot}
                className="cursor-pointer transition-transform hover:scale-110"
                onClick={() => onSelectSlot && onSelectSlot(slot)}
              >
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r={isSelected ? 16 : 13}
                  fill={isSelected ? '#C4572E' : '#FFF8EC'}
                  stroke={badgeColor}
                  strokeWidth={isSelected ? '4' : '3'}
                />
                <circle cx={coord.x} cy={coord.y} r="5" fill={isSelected ? '#FFF8EC' : badgeColor} />
              </g>
            );
          })}
        </svg>

        {/* Labels below arc */}
        <div className="grid grid-cols-4 gap-2 text-center mt-2">
          {SLOTS.map((slot) => {
            const info = SLOT_INFO[slot];
            const isSelected = activeSlot === slot;
            const status = slotStatuses[slot];

            return (
              <button
                key={slot}
                onClick={() => onSelectSlot && onSelectSlot(slot)}
                className={`py-2 px-1 rounded-20 transition-all ${
                  isSelected
                    ? 'bg-terracotta text-cream font-bold shadow-md scale-105'
                    : 'bg-cream dark:bg-zinc-700 hover:bg-sage text-deepOlive dark:text-cream'
                }`}
              >
                <div className="text-xl sm:text-2xl">{info.icon}</div>
                <div className="text-base sm:text-lg font-heading leading-tight">{info.label}</div>
                <div className="text-xs opacity-75">{info.time24}</div>
                <div className="mt-1">
                  {status === 'all_taken' && (
                    <span className="inline-block text-[11px] bg-deepOlive text-cream px-1.5 py-0.5 rounded-full font-bold">
                      ✓ Le li
                    </span>
                  )}
                  {status === 'pending' && (
                    <span className="inline-block text-[11px] bg-saffron text-deepOlive px-1.5 py-0.5 rounded-full font-bold">
                      Baki
                    </span>
                  )}
                  {status === 'missed' && (
                    <span className="inline-block text-[11px] bg-danger text-cream px-1.5 py-0.5 rounded-full font-bold">
                      Chhoot gayi
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

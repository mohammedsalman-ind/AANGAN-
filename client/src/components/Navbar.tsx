import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import { useOfflineSync } from '../context/OfflineSyncContext.js';
import { DadiVoiceModal } from './DadiVoiceModal.js';
import { LanguageSwitcher } from './LanguageSwitcher.js';
import {
  Sun,
  Grid,
  Pill,
  FileText,
  CalendarCheck,
  HeartPulse,
  Stethoscope,
  Sliders,
  History,
  Terminal,
  LogOut,
  WifiOff,
  Mic,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { circle, currentMember, logout } = useAuth();
  const { isOnline, queuedCount } = useOfflineSync();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showDadi, setShowDadi] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isElder = currentMember?.role === 'elder';

  const navItems = [
    { to: '/aaj', label: t.today, icon: Sun },
    { to: '/pillbox', label: t.pillbox, icon: Grid },
    { to: '/medicines', label: t.medicines, icon: Pill },
    ...(isElder ? [{ to: '/receipts', label: t.receipts, icon: FileText }] : []),
    { to: '/duty', label: t.dutyRoster, icon: CalendarCheck },
    { to: '/checkin', label: t.checkin, icon: HeartPulse },
    { to: '/appointments', label: t.appointments, icon: Stethoscope },
    ...(isElder ? [{ to: '/dials', label: t.privacyDials, icon: Sliders }] : []),
    ...(isElder ? [{ to: '/activity', label: t.activity, icon: History }] : []),
    { to: '/demo', label: t.demoConsole, icon: Terminal },
  ];

  return (
    <header className="bg-cream dark:bg-zinc-900 border-b border-borderMuted dark:border-zinc-800 sticky top-0 z-30 shadow-sm">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 py-2 sm:py-3 flex items-center justify-between">
        {/* Brand & Circle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-20 bg-terracotta text-cream flex items-center justify-center font-bold text-xl shadow-md">
            आँ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-xl sm:text-2xl text-terracotta tracking-wide">
                AANGAN
              </span>
              <span className="text-xs bg-saffron text-deepOlive font-bold px-2 py-0.5 rounded-full">
                {circle?.name || 'Aangan'}
              </span>
            </div>
            <p className="text-xs opacity-70 hidden sm:block">
              {t.headOfHousehold}{isElder ? t.elderLabel : t.dadajiLabel}
            </p>
          </div>
        </div>

        {/* Offline & Queued Sync Status */}
        <div className="flex items-center gap-3">
          {!isOnline && (
            <div className="flex items-center gap-1.5 bg-danger/20 text-danger border border-danger/30 text-xs font-bold px-3 py-1 rounded-full animate-pulse">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline hai, sync ho jayega {queuedCount > 0 && `(${queuedCount})`}</span>
            </div>
          )}

          {/* Dadi Voice Assistant & 3-Language Button */}
          <button
            onClick={() => setShowDadi(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-20 bg-saffron/20 hover:bg-saffron/30 text-deepOlive border border-saffron/40 font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95"
            title="Dadi Voice Assistant"
          >
            <Mic className="w-4 h-4 text-terracotta" />
            <span className="font-heading">दादी (Dadi)</span>
          </button>

          <LanguageSwitcher size="sm" />

          {/* Current Profile & Switch */}
          {currentMember && (
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-20 border border-borderMuted dark:border-zinc-700 shadow-sm">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                style={{ backgroundColor: currentMember.avatar.color }}
              >
                {currentMember.avatar.emoji}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-bold leading-none">{currentMember.name}</p>
                <p className="text-[11px] opacity-75 capitalize">{currentMember.role}</p>
              </div>

              <button
                onClick={() => navigate('/profiles')}
                title="Badal profile (Switch Profile)"
                className="ml-2 text-xs bg-cream dark:bg-zinc-700 hover:bg-sage text-deepOlive dark:text-cream px-2 py-1 rounded-12 font-semibold"
              >
                Badle
              </button>

              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-1 hover:text-danger rounded-full"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Pills Bar */}
      <nav className="border-t border-borderMuted/60 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm overflow-x-auto py-2 px-4 no-scrollbar">
        <div className="max-w-7xl mx-auto flex items-center gap-2 min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-20 text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-terracotta text-cream shadow-md scale-105'
                      : 'bg-cream/60 dark:bg-zinc-800 hover:bg-sage text-deepOlive dark:text-cream border border-borderMuted/40'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Dadi Voice Assistant Modal */}
      <DadiVoiceModal
        isOpen={showDadi}
        onClose={() => setShowDadi(false)}
      />
    </header>
  );
};

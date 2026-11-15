import React from 'react';
import type { SafeMember } from '@aangan/shared';
import { Lock } from 'lucide-react';

interface AvatarTileProps {
  member: SafeMember;
  onSelect: (member: SafeMember) => void;
  isSelected?: boolean;
}

export const AvatarTile: React.FC<AvatarTileProps> = ({ member, onSelect, isSelected }) => {
  const isLocked = member.lockedUntil && new Date(member.lockedUntil).getTime() > Date.now();

  const roleLabel: Record<string, string> = {
    elder: 'Elder (Head of Aangan)',
    caretaker: 'Caretaker',
    family: 'Pariwar (Family)',
  };

  const roleBadgeStyle: Record<string, string> = {
    elder: 'bg-terracotta text-cream',
    caretaker: 'bg-saffron text-deepOlive',
    family: 'bg-deepOlive text-cream',
  };

  return (
    <button
      onClick={() => onSelect(member)}
      className={`group relative flex flex-col items-center p-6 rounded-30 transition-all duration-300 w-44 sm:w-52 border ${
        isSelected
          ? 'bg-white dark:bg-zinc-800 border-terracotta shadow-highlight scale-105'
          : 'bg-white/80 dark:bg-zinc-800/80 border-borderMuted hover:border-terracotta hover:bg-white dark:hover:bg-zinc-800 shadow-soft hover:scale-105'
      }`}
    >
      {/* Avatar Circle */}
      <div
        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center text-5xl sm:text-6xl shadow-md border-4 border-white dark:border-zinc-700 transition-transform group-hover:scale-110 relative"
        style={{ backgroundColor: member.avatar.color || '#C4572E' }}
      >
        <span>{member.avatar.emoji}</span>

        {isLocked && (
          <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white">
            <Lock className="w-8 h-8 text-danger" />
          </div>
        )}
      </div>

      {/* Name */}
      <h3 className="mt-4 font-heading font-bold text-xl sm:text-2xl text-deepOlive dark:text-cream text-center">
        {member.name}
      </h3>

      {/* Role Badge */}
      <span
        className={`mt-2 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
          roleBadgeStyle[member.role] || 'bg-sage text-deepOlive'
        }`}
      >
        {roleLabel[member.role] || member.role}
      </span>

      {isLocked && (
        <span className="mt-2 text-xs text-danger font-semibold flex items-center gap-1">
          <Lock className="w-3 h-3" /> Locked
        </span>
      )}
    </button>
  );
};

export const SLOTS = ['subah', 'dopahar', 'shaam', 'raat'] as const;
export type SlotType = (typeof SLOTS)[number];

export const SLOT_INFO: Record<
  SlotType,
  { label: string; hindiLabel: string; time24: string; icon: string; range: string }
> = {
  subah: {
    label: 'Subah',
    hindiLabel: 'सुबह',
    time24: '08:00',
    icon: '🌅',
    range: '06:00 - 11:59',
  },
  dopahar: {
    label: 'Dopahar',
    hindiLabel: 'दोपहर',
    time24: '13:00',
    icon: '☀️',
    range: '12:00 - 16:59',
  },
  shaam: {
    label: 'Shaam',
    hindiLabel: 'शाम',
    time24: '18:00',
    icon: '🌇',
    range: '17:00 - 20:59',
  },
  raat: {
    label: 'Raat',
    hindiLabel: 'रात',
    time24: '21:30',
    icon: '🌙',
    range: '21:00 - 05:59',
  },
};

export const DEFAULT_SLOT_TIMES: Record<SlotType, string> = {
  subah: '08:00',
  dopahar: '13:00',
  shaam: '18:00',
  raat: '21:30',
};

export const ROLES = ['elder', 'caretaker', 'family'] as const;
export type RoleType = (typeof ROLES)[number];

export const DOSE_STATUSES = ['pending', 'taken', 'missed', 'skipped'] as const;
export type DoseStatusType = (typeof DOSE_STATUSES)[number];

export const SYMPTOMS = [
  { id: 'chakkar', label: 'Chakkar (Dizziness)', emoji: '💫' },
  { id: 'kamzori', label: 'Kamzori (Weakness)', emoji: '🔋' },
  { id: 'neend_nahi', label: 'Neend nahi (Insomnia)', emoji: '🥱' },
  { id: 'dard', label: 'Dard (Pain)', emoji: '🩹' },
  { id: 'pet_kharab', label: 'Pet kharab (Stomach issue)', emoji: '🤢' },
  { id: 'theek_hoon', label: 'Bilkul theek hoon (Feeling great)', emoji: '✨' },
] as const;

export const DEFAULT_AVATARS = [
  { emoji: '👴', color: '#C4572E', label: 'Dadaji' },
  { emoji: '👵', color: '#DDE5C8', label: 'Dadiji' },
  { emoji: '👩', color: '#F2A93B', label: 'Daughter / Priya' },
  { emoji: '👨', color: '#3F4A2B', label: 'Son / Rahul' },
  { emoji: '🧑‍⚕️', color: '#C4572E', label: 'Caretaker' },
  { emoji: '🌸', color: '#E87A5D', label: 'Grandchild' },
];

export const APP_PALETTE = {
  cream: '#FFF8EC',
  terracotta: '#C4572E',
  saffron: '#F2A93B',
  deepOlive: '#3F4A2B',
  sage: '#DDE5C8',
  danger: '#B3261E',
  border: '#E8DCC9',
  cardBg: '#FFFFFF',
};

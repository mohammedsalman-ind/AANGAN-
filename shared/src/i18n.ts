export type LanguageMode = 'hinglish' | 'english' | 'hindi';

export interface Translations {
  appName: string;
  tagline: string;
  subah: string;
  dopahar: string;
  shaam: string;
  raat: string;
  today: string;
  pillbox: string;
  medicines: string;
  receipts: string;
  dutyRoster: string;
  checkin: string;
  appointments: string;
  privacyDials: string;
  activity: string;
  demoConsole: string;
  taken: string;
  pending: string;
  missed: string;
  takeAll: string;
  undo: string;
  lowStockWarning: string;
  dadiGreeting: string;
  dadiListening: string;
  dadiThinking: string;
  privacyLocked: string;
  // UI strings for localization
  headOfHousehold: string;
  elderLabel: string;
  dadajiLabel: string;
  demoButtonTitle: string;
  demoButtonSubtitle: string;
  demoButtonDesc: string;
  joinCircleTitle: string;
  joinCircleDesc: string;
  createCircleTitle: string;
  createCircleDesc: string;
  joinCircleLabel: string;
  createCircleLabel: string;
  joinError: string;
  createError: string;
  quickDemoLabel: string;
}

export const DICTIONARY: Record<LanguageMode, Translations> = {
  hinglish: {
    appName: 'Aangan',
    tagline: 'Ghar ka digital aangan — Dadaji ke control me sabki dekhbhal',
    subah: 'Subah',
    dopahar: 'Dopahar',
    shaam: 'Shaam',
    raat: 'Raat',
    today: 'Aaj',
    pillbox: 'Dawai Box',
    medicines: 'Dawaiyan',
    receipts: 'Badlav Parchi',
    dutyRoster: 'Kiski Duty',
    checkin: 'Kaisa Laga',
    appointments: 'Doctor Visit',
    privacyDials: 'Parda & Control',
    activity: 'Audit Khata',
    demoConsole: 'Demo Engine',
    taken: 'Le li ✔',
    pending: 'Baki hai',
    missed: 'Chhoot gayi',
    takeAll: 'Sab le li ✔',
    undo: 'Wapas karo (Undo)',
    lowStockWarning: 'Kam bachi hai',
    dadiGreeting: 'Pranaam! Main Dadi hoon. Bataiye aaj dawai ya tabiyat me kya madad karoon?',
    dadiListening: 'Sun rahi hoon...',
    dadiThinking: 'Soch rahi hoon...',
    privacyLocked: 'Elder ne yeh jaankari private rakhi hai.',
    headOfHousehold: 'Head of Household: ',
    elderLabel: 'Elder',
    dadajiLabel: 'Dadaji',
    demoButtonTitle: 'Hackathon Demo (One-Click)',
    demoButtonSubtitle: '',
    demoButtonDesc: '',
    joinCircleTitle: 'Aangan Code Dalein',
    joinCircleDesc: 'Aapke ghar ke Aangan ka 6-akshar ka code (Jaise: AANGAN)',
    createCircleTitle: 'Naya Aangan banayein',
    createCircleDesc: 'Elder shuruat karein',
    joinCircleLabel: 'Join',
    createCircleLabel: 'Create',
    joinError: 'Aangan code galat hai.',
    createError: 'Naya Aangan banane me samasya aayi.',
    quickDemoLabel: 'Hackathon Demo (One-Click)'
  },
  english: {
    appName: 'Aangan',
    tagline: 'The Digital Courtyard — Elderly Care Centered Around the Elder',
    subah: 'Morning',
    dopahar: 'Afternoon',
    shaam: 'Evening',
    raat: 'Night',
    today: 'Today',
    pillbox: 'Pillbox',
    medicines: 'Medicines',
    receipts: 'Change Receipts',
    dutyRoster: 'Duty Roster',
    checkin: 'Daily Check-in',
    appointments: 'Appointments',
    privacyDials: 'Privacy Dials',
    activity: 'Activity Log',
    demoConsole: 'Demo Console',
    taken: 'Taken ✔',
    pending: 'Pending',
    missed: 'Missed',
    takeAll: 'Take All ✔',
    undo: 'Undo',
    lowStockWarning: 'Low stock',
    dadiGreeting: 'Hello! I am Dadi. How can I assist with your medicines or routine today?',
    dadiListening: 'Listening...',
    dadiThinking: 'Thinking...',
    privacyLocked: 'The elder has kept this information private.',
    headOfHousehold: 'Head of Household: ',
    elderLabel: 'Elder',
    dadajiLabel: 'Dadaji',
    demoButtonTitle: 'Hackathon Demo (One-Click)',
    demoButtonSubtitle: '',
    demoButtonDesc: '',
    joinCircleTitle: 'Enter Aangan Code',
    joinCircleDesc: 'Enter your 6‑character Aangan code',
    createCircleTitle: 'Create New Aangan',
    createCircleDesc: 'Elder starts a new circle',
    joinCircleLabel: 'Join',
    createCircleLabel: 'Create',
    joinError: 'Invalid Aangan code.',
    createError: 'Error creating a new Aangan.',
    quickDemoLabel: 'Hackathon Demo (One-Click)'
  },
  hindi: {
    appName: 'आँगन',
    tagline: 'घर का डिजिटल आँगन — दादा के नियंत्रण में सबकी देखभाल',
    subah: 'सुबह',
    dopahar: 'दोपहर',
    shaam: 'शाम',
    raat: 'रात',
    today: 'आज',
    pillbox: 'दवाई बॉक्स',
    medicines: 'दवाइयाँ',
    receipts: 'बदलाव पर्ची',
    dutyRoster: 'कीसकी ड्यूटी',
    checkin: 'कैसा लगा',
    appointments: 'डॉक्टर विज़िट',
    privacyDials: 'परदा & कंट्रोल',
    activity: 'ऑडिट खाता',
    demoConsole: 'डेमो कंसोल',
    taken: 'ले ली ✔',
    pending: 'बाकी है',
    missed: 'छूट गई',
    takeAll: 'सब ले ली ✔',
    undo: 'वापस करो (Undo)',
    lowStockWarning: 'कम बची है',
    dadiGreeting: 'नमस्ते! मैं दादी हूँ। बताइए आज दवा या तबियत में क्या मदद करूँ?',
    dadiListening: 'सुन रही हूँ...',
    dadiThinking: 'सोच रही हूँ...',
    privacyLocked: 'एजेंट ने यह जानकारी प्राइवेट रखी है.',
    headOfHousehold: 'मुखिया: ',
    elderLabel: 'बुजुर्ग',
    dadajiLabel: 'दादा जी',
    demoButtonTitle: 'हैकाथॉन डेमो (वन‑क्लिक)',
    demoButtonSubtitle: '',
    demoButtonDesc: '',
    joinCircleTitle: 'आँगन कोड डालें',
    joinCircleDesc: 'आपके घर के आँगन का 6‑अक्षर कोड (जैसे: AANGAN)',
    createCircleTitle: 'नया आँगन बनाएं',
    createCircleDesc: 'बुजुर्ग शुरू करता है',
    joinCircleLabel: 'जॉइन',
    createCircleLabel: 'बनाएं',
    joinError: 'आँगन कोड गलत है।',
    createError: 'नया आँगन बनाने में समस्या आई।',
    quickDemoLabel: 'हैकाथॉन डेमो (वन‑क्लिक)'
  }
};
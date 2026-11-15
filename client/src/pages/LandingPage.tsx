import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import { KolamPattern } from '../components/KolamPattern.js';
import { LanguageSwitcher } from '../components/LanguageSwitcher.js';
import { DadiVoiceModal } from '../components/DadiVoiceModal.js';
import { DEFAULT_AVATARS } from '@aangan/shared';
import { Heart, Sparkles, KeyRound, PlusCircle, ArrowRight, Mic } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [mode, setMode] = useState<'home' | 'join' | 'create'>('home');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDadi, setShowDadi] = useState(false);

  // Create form state
  const [circleName, setCircleName] = useState('');
  const [elderName, setElderName] = useState('');
  const [elderPin, setElderPin] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATARS[0]);

  const { setCircle, setCurrentMember } = useAuth();
  const navigate = useNavigate();

  // Quick Demo Shortcut for Judges
  const handleQuickDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.lookupCircle('AANGAN');
      setCircle({
        id: res.circle.id,
        name: res.circle.name,
        joinCode: res.circle.joinCode,
        slotTimes: { subah: '08:00', dopahar: '13:00', shaam: '18:00', raat: '21:30' },
        missedAlertAfterMin: 30,
        createdAt: new Date().toISOString(),
      });
      navigate('/profiles');
    } catch (err: any) {
      setError(err.message || 'Demo circle lookup failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.lookupCircle(joinCode.trim().toUpperCase());
      setCircle({
        id: res.circle.id,
        name: res.circle.name,
        joinCode: res.circle.joinCode,
        slotTimes: { subah: '08:00', dopahar: '13:00', shaam: '18:00', raat: '21:30' },
        missedAlertAfterMin: 30,
        createdAt: new Date().toISOString(),
      });
      navigate('/profiles');
    } catch (err: any) {
      setError(err.message || 'Aangan code galat hai.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!circleName.trim() || !elderName.trim() || !elderPin.trim()) return;
    if (elderPin.length < 4 || elderPin.length > 6) {
      setError('PIN 4 se 6 digit ka hona chahiye.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.createCircle({
        circleName,
        elderName,
        elderAvatar: { emoji: selectedAvatar.emoji, color: selectedAvatar.color },
        pin: elderPin,
      });
      setCircle(res.circle);
      setCurrentMember(res.member);
      navigate('/aaj');
    } catch (err: any) {
      setError(err.message || 'Naya Aangan banane me samasya aayi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-between p-4 sm:p-8">
      {/* Kolam Pattern Header */}
      <KolamPattern />

      {/* Top Controls: Dadi Voice Assistant & 3-Language Button */}
      <div className="flex justify-end items-center gap-2 pt-2 pb-1">
        <button
          onClick={() => setShowDadi(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-20 bg-saffron/20 hover:bg-saffron/30 text-deepOlive border border-saffron/40 font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95"
          title="Dadi Voice Assistant"
        >
          <Mic className="w-4 h-4 text-terracotta" />
          <span className="font-heading">दादी (Dadi)</span>
        </button>
        <LanguageSwitcher size="sm" />
      </div>

      <main className="max-w-xl mx-auto w-full my-auto py-8">
        {/* Brand Logo & Pitch */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-30 bg-terracotta text-cream flex items-center justify-center text-4xl font-black shadow-lg mb-4">
            आँ
          </div>
          <h1 className="font-heading font-black text-4xl sm:text-5xl text-terracotta tracking-tight">
            AANGAN (आँगन)
          </h1>
          <p className="mt-2 text-xl font-heading text-deepOlive font-medium">
            "Other apps monitor the elder. Aangan makes the elder the head of the household."
          </p>
          <p className="text-sm text-zinc-600 mt-1">
            Ghar ka digital pillbox + parivarik courtyard
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-danger/10 border-2 border-danger text-danger font-semibold rounded-20 text-center text-sm">
            {error}
          </div>
        )}

        {/* HOME VIEW: Choice between Enter or Create */}
        {mode === 'home' && (
          <div className="space-y-4">
            {/* Quick Demo Button for Hackathon Judges */}
            <button
              onClick={handleQuickDemo}
              disabled={loading}
              className="w-full p-6 bg-terracotta text-cream rounded-30 shadow-lg hover:bg-terracotta-dark active:scale-98 transition-all flex items-center justify-between text-left group border-2 border-terracotta"
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-wider bg-saffron text-deepOlive px-2.5 py-0.5 rounded-full">
                  Hackathon Demo (One-Click)
                </span>
                <h3 className="font-heading font-bold text-2xl mt-1">
                  Sharma Aangan Kholein →
                </h3>
                <p className="text-sm opacity-90">
                  Dadaji (PIN: 1111) • Priya Caretaker (2222) • Rahul (3333)
                </p>
              </div>
              <Sparkles className="w-8 h-8 text-saffron shrink-0 group-hover:rotate-12 transition-transform" />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {/* Join Existing Circle */}
              <button
                onClick={() => setMode('join')}
                className="p-6 bg-white rounded-30 border-2 border-borderMuted hover:border-terracotta shadow-card active:scale-98 transition-all flex flex-col justify-between text-left"
              >
                <KeyRound className="w-8 h-8 text-saffron mb-3" />
                <div>
                  <h3 className="font-heading font-bold text-xl text-deepOlive">
                    Aangan me jaayein
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Ghar ka 6-akshar code dalein
                  </p>
                </div>
              </button>

              {/* Create New Circle */}
              <button
                onClick={() => setMode('create')}
                className="p-6 bg-white rounded-30 border-2 border-borderMuted hover:border-terracotta shadow-card active:scale-98 transition-all flex flex-col justify-between text-left"
              >
                <PlusCircle className="w-8 h-8 text-terracotta mb-3" />
                <div>
                  <h3 className="font-heading font-bold text-xl text-deepOlive">
                    Naya Aangan banayein
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Elder shuruat karein
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* JOIN VIEW: Enter 6-digit Code */}
        {mode === 'join' && (
          <form onSubmit={handleJoin} className="bg-white p-6 sm:p-8 rounded-30 shadow-card border border-borderMuted">
            <h2 className="font-heading font-bold text-2xl text-deepOlive mb-2">
              Aangan Code Dalein
            </h2>
            <p className="text-sm text-zinc-500 mb-6">
              Aapke ghar ke Aangan ka 6-akshar ka code (Jaise: <strong>AANGAN</strong>)
            </p>

            <input
              type="text"
              maxLength={10}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="AANGAN"
              autoFocus
              className="w-full text-center tracking-widest text-3xl font-mono font-bold py-4 bg-cream rounded-20 border-2 border-borderMuted focus:border-terracotta focus:outline-none uppercase text-deepOlive mb-6"
            />

            <button
              type="submit"
              disabled={loading || !joinCode.trim()}
              className="w-full py-4 bg-terracotta text-cream font-bold text-lg rounded-20 shadow-md hover:bg-terracotta-dark active:scale-98 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            >
              <span>Dakhil Hon (Continue)</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setMode('home')}
              className="w-full mt-3 py-2 text-sm text-zinc-600 hover:text-deepOlive font-semibold"
            >
              ← Wapas Jayein
            </button>
          </form>
        )}

        {/* CREATE VIEW: Elder creates Circle */}
        {mode === 'create' && (
          <form onSubmit={handleCreate} className="bg-white p-6 sm:p-8 rounded-30 shadow-card border border-borderMuted">
            <h2 className="font-heading font-bold text-2xl text-deepOlive mb-2">
              Naya Aangan Shuru Karein
            </h2>
            <p className="text-sm text-zinc-500 mb-6">
              Buzurg sadasya apne aangan ke mukhya hain
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-deepOlive mb-1">
                  Ghar / Parivar ka Naam
                </label>
                <input
                  type="text"
                  required
                  value={circleName}
                  onChange={(e) => setCircleName(e.target.value)}
                  placeholder="Jaise: Sharma Aangan"
                  className="w-full px-4 py-3 bg-cream rounded-16 border border-borderMuted focus:border-terracotta focus:outline-none text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-deepOlive mb-1">
                  Buzurg Sadasya (Elder) ka Naam
                </label>
                <input
                  type="text"
                  required
                  value={elderName}
                  onChange={(e) => setElderName(e.target.value)}
                  placeholder="Jaise: Dadaji / Rameshji"
                  className="w-full px-4 py-3 bg-cream rounded-16 border border-borderMuted focus:border-terracotta focus:outline-none text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-deepOlive mb-1">
                  Avatar Chunein
                </label>
                <div className="flex gap-2">
                  {DEFAULT_AVATARS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedAvatar(av)}
                      className={`w-12 h-12 rounded-full text-2xl flex items-center justify-center border-2 transition-all ${
                        selectedAvatar.emoji === av.emoji
                          ? 'border-terracotta scale-110 shadow-md'
                          : 'border-transparent opacity-75'
                      }`}
                      style={{ backgroundColor: av.color }}
                    >
                      {av.emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-deepOlive mb-1">
                  Elder ka 4-Digit Secret PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={elderPin}
                  onChange={(e) => setElderPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="1111"
                  className="w-full px-4 py-3 bg-cream rounded-16 border border-borderMuted focus:border-terracotta focus:outline-none text-center font-mono tracking-widest text-xl"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Yeh PIN aage login karne ke liye kaam aayega.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-4 bg-terracotta text-cream font-bold text-lg rounded-20 shadow-md hover:bg-terracotta-dark active:scale-98 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            >
              <span>Aangan Banayein →</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('home')}
              className="w-full mt-3 py-2 text-sm text-zinc-600 hover:text-deepOlive font-semibold"
            >
              ← Wapas Jayein
            </button>
          </form>
        )}
      </main>

      <footer className="text-center text-xs text-zinc-500 py-4">
        Aangan Platform • Designed for Solo AI Hackathon • 100% Elder Centered
      </footer>

      {/* Dadi Voice Assistant Modal */}
      <DadiVoiceModal
        isOpen={showDadi}
        onClose={() => setShowDadi(false)}
      />
    </div>
  );
};

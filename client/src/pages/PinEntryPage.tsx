import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../api/client.js';
import { PinPad } from '../components/PinPad.js';
import { KolamPattern } from '../components/KolamPattern.js';
import type { SafeMember } from '@aangan/shared';
import { ArrowLeft } from 'lucide-react';

export const PinEntryPage: React.FC = () => {
  const { memberId } = useParams<{ memberId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { circle, loginWithPin } = useAuth();

  const [member, setMember] = useState<SafeMember | null>(
    (location.state as any)?.member || null
  );
  const [error, setError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!circle) {
      navigate('/');
      return;
    }

    if (!member && memberId) {
      api.lookupCircle(circle.joinCode).then((res) => {
        const found = res.members.find((m) => m.id === memberId);
        if (found) {
          setMember(found);
          setLockedUntil(found.lockedUntil);
        } else {
          navigate('/profiles');
        }
      });
    } else if (member) {
      setLockedUntil(member.lockedUntil);
    }
  }, [circle, member, memberId, navigate]);

  const handlePinSubmit = async (pin: string) => {
    if (!memberId) return;
    setLoading(true);
    setError(null);

    try {
      await loginWithPin(memberId, pin);

      // Route based on role: elder directly to /aaj; caretaker/family to /aaj or /dashboard
      if (member?.role === 'elder') {
        navigate('/aaj');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Galat PIN! Kripya sahi PIN dalein.');
      if (err.message?.includes('lock') || err.message?.includes('5 minute')) {
        setLockedUntil(new Date(Date.now() + 5 * 60 * 1000).toISOString());
      }
    } finally {
      setLoading(false);
    }
  };

  if (!member) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-between p-4 sm:p-8">
      <KolamPattern />

      <main className="max-w-md mx-auto w-full my-auto py-6 text-center">
        {/* Back Button */}
        <div className="flex justify-start mb-4">
          <button
            onClick={() => navigate('/profiles')}
            className="flex items-center gap-2 text-sm font-bold text-deepOlive hover:text-terracotta bg-white px-4 py-2 rounded-20 border border-borderMuted shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Profile Badle</span>
          </button>
        </div>

        {/* Selected Member Header */}
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-5xl shadow-md border-4 border-white"
            style={{ backgroundColor: member.avatar.color }}
          >
            {member.avatar.emoji}
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-deepOlive mt-3">
            Namaste, {member.name}!
          </h1>
          <p className="text-sm text-zinc-600 mt-1">
            Apna secret PIN enter karein
          </p>
        </div>

        {/* PIN Pad Component */}
        <PinPad
          onComplete={handlePinSubmit}
          error={error}
          lockedUntil={lockedUntil}
          onClearError={() => setError(null)}
          expectedLength={4}
        />

        <div className="mt-8 text-xs text-zinc-500">
          Tip: Agar PIN bhool gaye hain, toh Dadaji (Elder) se reset karwayein.
        </div>
      </main>

      <footer className="text-center text-xs text-zinc-500 py-4">
        Aangan Security • Scrypt Hashing • Rate-limited with 5-minute Auto-Lockout
      </footer>
    </div>
  );
};

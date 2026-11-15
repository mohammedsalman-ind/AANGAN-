import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../api/client.js';
import { AvatarTile } from '../components/AvatarTile.js';
import { KolamPattern } from '../components/KolamPattern.js';
import { LanguageSwitcher } from '../components/LanguageSwitcher.js';
import type { SafeMember } from '@aangan/shared';
import { ArrowLeft } from 'lucide-react';

export const ProfilePickerPage: React.FC = () => {
  const { circle } = useAuth();
  const [members, setMembers] = useState<SafeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!circle) {
      navigate('/');
      return;
    }

    const loadMembers = async () => {
      try {
        const res = await api.lookupCircle(circle.joinCode);
        setMembers(res.members);
      } catch (err: any) {
        setError(err.message || 'Sadasyon ki soochi prapt karne me asuvidha hui.');
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [circle, navigate]);

  const handleSelectMember = (member: SafeMember) => {
    navigate(`/pin/${member.id}`, { state: { member } });
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-between p-4 sm:p-8">
      <KolamPattern />

      <main className="max-w-4xl mx-auto w-full my-auto py-8 text-center">
        {/* Top Action Bar: Back Button & Language Switcher */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-bold text-deepOlive hover:text-terracotta bg-white px-4 py-2 rounded-20 border border-borderMuted shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dusra Aangan chunein</span>
          </button>

          <LanguageSwitcher size="sm" />
        </div>

        <div className="mb-8">
          <span className="text-sm font-bold text-terracotta bg-terracotta/10 px-4 py-1 rounded-full uppercase tracking-wider">
            {circle?.name || 'Aangan'}
          </span>
          <h1 className="font-heading font-black text-3xl sm:text-5xl text-deepOlive mt-3">
            Aap Kaun Hain?
          </h1>
          <p className="text-zinc-600 mt-2 text-lg">
            Apna avatar chunein aur on-screen PIN dalein
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-danger/10 border-2 border-danger text-danger font-semibold rounded-20 text-center text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-12 h-12 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8 items-center">
            {members.map((member) => (
              <AvatarTile
                key={member.id}
                member={member}
                onSelect={handleSelectMember}
              />
            ))}
          </div>
        )}

        <div className="mt-12 bg-white/70 max-w-md mx-auto p-4 rounded-20 border border-borderMuted text-xs text-zinc-600">
          💡 <strong>Hackathon Demo Credentials:</strong><br />
          • Dadaji (Elder): <strong>1111</strong><br />
          • Priya (Caretaker): <strong>2222</strong><br />
          • Rahul (Family): <strong>3333</strong>
        </div>
      </main>

      <footer className="text-center text-xs text-zinc-500 py-4">
        Aangan • Netflix-style Profile Selection with Zero Typed Passwords
      </footer>
    </div>
  );
};

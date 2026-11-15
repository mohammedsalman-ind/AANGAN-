import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import type { ChangeReceipt } from '@aangan/shared';
import { RotateCcw, Check, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

export const ReceiptsPage: React.FC = () => {
  const { currentMember } = useAuth();
  const [receipts, setReceipts] = useState<ChangeReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isElder = currentMember?.role === 'elder';

  const loadReceipts = async () => {
    try {
      const data = await api.getReceipts();
      setReceipts(data);
    } catch (err) {
      console.warn('Failed to load receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceipts();
  }, []);

  const handleReverse = async (receiptId: string) => {
    try {
      const res = await api.reverseReceipt(receiptId);
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(null), 4000);
      loadReceipts();
    } catch (err: any) {
      alert(err.message || 'Reverse failed');
    }
  };

  if (!isElder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <ShieldCheck className="w-16 h-16 text-terracotta mx-auto mb-4" />
        <h2 className="font-heading font-bold text-3xl">Yeh Page Sirf Elder Ke Liye Hai</h2>
        <p className="text-zinc-600 mt-2">
          Ghar ke mukhya (Elder) hi parivar ke dwara kiye gaye badlavon ko reverse kar sakte hain.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-wider bg-terracotta text-cream px-3 py-1 rounded-full">
          Elder Control • Signature Feature
        </span>
        <h1 className="font-heading font-black text-3xl sm:text-4xl text-deepOlive dark:text-cream mt-2 flex items-center gap-3">
          <span>📜</span> Badlav Parchi (Change Receipts)
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Parivar ya caretaker ne aapki dawaiyon ya settings me jo bhi badlav kiye hain, unhe 24 ghante ke andar wapas (reverse) karein.
        </p>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-sage text-deepOlive font-bold rounded-20 shadow-sm border border-borderMuted">
          ✓ {successMsg}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : receipts.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800 p-12 rounded-30 text-center text-zinc-500 border border-borderMuted">
          <p className="text-4xl mb-2">🌿</p>
          <p className="font-heading text-xl">Abhi tak koi badlav darz nahi hua hai.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {receipts.map((rcpt) => {
            const changedTime = new Date(rcpt.changedAt).getTime();
            const isWithin24Hours = Date.now() - changedTime <= 24 * 60 * 60 * 1000;
            const canReverse = !rcpt.reversedAt && isWithin24Hours;

            return (
              <div
                key={rcpt.id}
                className={`bg-white dark:bg-zinc-800 rounded-30 p-6 shadow-card border-2 transition-all ${
                  rcpt.reversedAt
                    ? 'border-borderMuted opacity-75'
                    : 'border-borderMuted hover:border-terracotta'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-cream dark:bg-zinc-700 text-deepOlive dark:text-cream border border-borderMuted">
                        {rcpt.entity.toUpperCase()}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {new Date(rcpt.changedAt).toLocaleString('hi-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-xl sm:text-2xl mt-2">
                      {rcpt.description}
                    </h3>

                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                      Karta: <strong>{rcpt.changedByName}</strong>
                    </p>
                  </div>

                  {/* Action / Status Pill */}
                  <div className="shrink-0">
                    {rcpt.reversedAt ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold bg-zinc-200 text-zinc-700 px-4 py-2 rounded-20">
                        <Check className="w-4 h-4" />
                        <span>Wapas ho chuka hai (Reversed)</span>
                      </span>
                    ) : canReverse ? (
                      <button
                        onClick={() => handleReverse(rcpt.id)}
                        className="flex items-center gap-2 bg-terracotta hover:bg-terracotta-dark text-cream font-bold px-5 py-2.5 rounded-20 shadow-md active:scale-95 transition-all text-sm"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Wapas Karein (Reverse)</span>
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-zinc-500 font-semibold">
                        <Clock className="w-4 h-4" />
                        <span>24 ghante beet chuke hain</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Diff Viewer */}
                {(rcpt.before || rcpt.after) && (
                  <div className="mt-4 pt-3 border-t border-borderMuted dark:border-zinc-700 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono bg-cream dark:bg-zinc-900/60 p-3 rounded-16">
                    {rcpt.before && (
                      <div>
                        <span className="font-bold text-danger">Pehle (Before):</span>{' '}
                        {JSON.stringify(rcpt.before)}
                      </div>
                    )}
                    {rcpt.after && (
                      <div>
                        <span className="font-bold text-deepOlive dark:text-cream">Baad me (After):</span>{' '}
                        {JSON.stringify(rcpt.after)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

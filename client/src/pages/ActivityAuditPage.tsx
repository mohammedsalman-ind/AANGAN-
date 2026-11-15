import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { History, ShieldCheck, Hash, Lock, CheckCircle } from 'lucide-react';

export const ActivityAuditPage: React.FC = () => {
  const { currentMember } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isElder = currentMember?.role === 'elder';

  useEffect(() => {
    if (!isElder) return;
    api
      .getAuditLogs()
      .then(setLogs)
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, [isElder]);

  if (!isElder) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <ShieldCheck className="w-16 h-16 text-terracotta mx-auto mb-4" />
        <h2 className="font-heading font-bold text-3xl">Activity Audit Khata (Elder Only)</h2>
        <p className="text-zinc-600 mt-2">
          Tamper-evident audit log sirf ghar ke elder dekh sakte hain.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-wider bg-deepOlive text-cream px-3 py-1 rounded-full">
          Tamper-Evident SHA-256 Hash Chain
        </span>
        <h1 className="font-heading font-black text-3xl sm:text-4xl text-deepOlive dark:text-cream mt-2 flex items-center gap-3">
          <History className="w-8 h-8 text-terracotta" />
          <span>Activity Audit Khata (Security Log)</span>
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Login, PIN badlav, privacy dials, dawai badlav aur reversal ka purna surakshit audit record.
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800 p-12 rounded-30 text-center text-zinc-500 border border-borderMuted">
          Abhi tak koi audit logs darz nahi hue hain.
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((entry) => (
            <div
              key={entry.id}
              className="bg-white dark:bg-zinc-800 rounded-24 p-5 shadow-card border border-borderMuted dark:border-zinc-700 text-sm"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-borderMuted">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-cream dark:bg-zinc-700 text-terracotta border border-borderMuted">
                    {entry.action}
                  </span>
                  <span className="font-bold text-base">{entry.actorName}</span>
                </div>
                <span className="text-xs text-zinc-500">
                  {new Date(entry.at).toLocaleString('hi-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'medium',
                  })}
                </span>
              </div>

              {/* Details */}
              <div className="my-3 font-mono text-xs bg-cream/50 dark:bg-zinc-900/40 p-3 rounded-12 border border-borderMuted/60 overflow-x-auto">
                {JSON.stringify(entry.details, null, 2)}
              </div>

              {/* Hash Chain Visual Indicator */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono text-zinc-500 pt-1">
                <div className="truncate">
                  <span className="font-bold text-zinc-600 dark:text-zinc-400">Prev Hash:</span>{' '}
                  {entry.prevHash}
                </div>
                <div className="truncate flex items-center gap-1 text-deepOlive dark:text-cream">
                  <CheckCircle className="w-3 h-3 text-terracotta shrink-0" />
                  <span className="font-bold">Entry Hash:</span> {entry.hash}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

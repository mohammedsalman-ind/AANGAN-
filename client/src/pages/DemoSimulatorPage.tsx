import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { Terminal, Send, Play, Mail, CheckCircle2, RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react';

export const DemoSimulatorPage: React.FC = () => {
  const [inbox, setInbox] = useState<any[]>([]);
  const [selectedMail, setSelectedMail] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [simMessage, setSimMessage] = useState<string | null>(null);

  const loadInbox = async () => {
    try {
      const mails = await api.getDemoInbox();
      setInbox(mails);
      if (mails.length > 0 && !selectedMail) {
        setSelectedMail(mails[0]);
      }
    } catch (err) {
      console.warn('Failed to load demo inbox:', err);
    }
  };

  useEffect(() => {
    loadInbox();
    const interval = setInterval(loadInbox, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateMissed = async (slot = 'subah') => {
    setLoading(true);
    setSimMessage(null);
    try {
      const res = await api.simulateMissedDose(slot);
      setSimMessage(`Simulated: Missed ${slot.toUpperCase()} dose! Alert engine triggered.`);
      await loadInbox();
    } catch (err: any) {
      alert(err.message || 'Simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerEngine = async () => {
    setLoading(true);
    setSimMessage(null);
    try {
      const res = await api.triggerAlertEngine();
      setSimMessage(`Engine Tick: Evaluated ${res.evaluatedCount} circles, sent ${res.alertsSent} alerts.`);
      await loadInbox();
    } catch (err: any) {
      alert(err.message || 'Engine trigger failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-wider bg-deepOlive text-cream px-3 py-1 rounded-full">
          Solo Hackathon Judge Console
        </span>
        <h1 className="font-heading font-black text-3xl sm:text-4xl text-deepOlive dark:text-cream mt-2 flex items-center gap-3">
          <Terminal className="w-8 h-8 text-terracotta" />
          <span>Demo Engine & In-Memory Email Viewer</span>
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Simulate missed doses, run alert engine ticks, and inspect sent emails with signed 1-click links (works with zero SMTP config).
        </p>
      </div>

      {simMessage && (
        <div className="mb-6 p-4 bg-sage text-deepOlive font-bold rounded-20 shadow-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-terracotta shrink-0" />
          <span>{simMessage}</span>
        </div>
      )}

      {/* Simulator Action Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => handleSimulateMissed('subah')}
          disabled={loading}
          className="p-5 bg-terracotta text-cream font-bold rounded-24 shadow-md hover:bg-terracotta-dark active:scale-95 transition-all text-left flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs bg-saffron text-deepOlive px-2 py-0.5 rounded-full font-bold">
              Simulate 1
            </span>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="mt-4">
            <h3 className="font-heading font-bold text-xl">Simulate Missed Subah Dose</h3>
            <p className="text-xs opacity-90 mt-1">
              Dadaji ki subah ki dawai miss hogi &rarr; on-duty Priya ko alert jayega
            </p>
          </div>
        </button>

        <button
          onClick={() => handleSimulateMissed('raat')}
          disabled={loading}
          className="p-5 bg-deepOlive text-cream font-bold rounded-24 shadow-md hover:bg-deepOlive-dark active:scale-95 transition-all text-left flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs bg-sage text-deepOlive px-2 py-0.5 rounded-full font-bold">
              Simulate 2
            </span>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="mt-4">
            <h3 className="font-heading font-bold text-xl">Simulate Missed Raat Dose</h3>
            <p className="text-xs opacity-90 mt-1">
              Atorvastatin critical miss &rarr; escalation to Rahul
            </p>
          </div>
        </button>

        <button
          onClick={handleTriggerEngine}
          disabled={loading}
          className="p-5 bg-white dark:bg-zinc-800 text-deepOlive dark:text-cream border-2 border-borderMuted font-bold rounded-24 shadow-md hover:border-terracotta active:scale-95 transition-all text-left flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs bg-cream dark:bg-zinc-700 px-2 py-0.5 rounded-full font-bold">
              Cron Daemon
            </span>
            <RefreshCw className={`w-5 h-5 text-terracotta ${loading ? 'animate-spin' : ''}`} />
          </div>
          <div className="mt-4">
            <h3 className="font-heading font-bold text-xl">Force-Run Alert Engine Tick</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Evaluates overdues, escalations, stock counts and appointment reminders
            </p>
          </div>
        </button>
      </div>

      {/* In-Memory Email Viewer */}
      <div className="bg-white dark:bg-zinc-800 rounded-30 shadow-card border-2 border-borderMuted overflow-hidden">
        <div className="p-5 border-b border-borderMuted flex items-center justify-between bg-cream dark:bg-zinc-700">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-terracotta" />
            <h3 className="font-heading font-bold text-xl">
              Virtual Email Inbox Viewer ({inbox.length} Sent)
            </h3>
          </div>
          <button
            onClick={loadInbox}
            className="text-xs font-bold bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-12 border border-borderMuted shadow-sm flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Inbox</span>
          </button>
        </div>

        {inbox.length === 0 ? (
          <div className="py-16 text-center text-zinc-500">
            <Mail className="w-12 h-12 text-zinc-400 mx-auto mb-2" />
            <p className="font-bold">Abhi tak koi email nahi bheja gaya.</p>
            <p className="text-xs text-zinc-400 mt-1">Upar "Simulate Missed Dose" dabakar test karein!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-borderMuted min-h-[500px]">
            {/* Left list of emails */}
            <div className="divide-y divide-borderMuted max-h-[600px] overflow-y-auto">
              {inbox.map((mail) => {
                const isSelected = selectedMail?.id === mail.id;
                return (
                  <button
                    key={mail.id}
                    onClick={() => setSelectedMail(mail)}
                    className={`w-full p-4 text-left transition-all ${
                      isSelected
                        ? 'bg-cream/80 dark:bg-zinc-700/80 border-l-4 border-terracotta'
                        : 'hover:bg-cream/40 dark:hover:bg-zinc-700/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                      <span className="font-bold text-terracotta capitalize">{mail.type}</span>
                      <span>{new Date(mail.sentAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="font-bold text-sm text-deepOlive dark:text-cream truncate">
                      {mail.subject}
                    </p>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">To: {mail.to}</p>
                  </button>
                );
              })}
            </div>

            {/* Right preview of selected email */}
            <div className="md:col-span-2 p-6 flex flex-col justify-between overflow-y-auto max-h-[600px]">
              {selectedMail ? (
                <div>
                  <div className="pb-4 border-b border-borderMuted mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider bg-saffron text-deepOlive px-2.5 py-0.5 rounded-full">
                      {selectedMail.type}
                    </span>
                    <h2 className="font-heading font-bold text-2xl mt-2">{selectedMail.subject}</h2>
                    <p className="text-xs text-zinc-500 mt-1">
                      <strong>To:</strong> {selectedMail.to} • <strong>Sent:</strong>{' '}
                      {new Date(selectedMail.sentAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Rendered HTML Preview */}
                  <div
                    className="prose dark:prose-invert max-w-none text-sm p-4 bg-cream/30 dark:bg-zinc-900 rounded-20 border border-borderMuted"
                    dangerouslySetInnerHTML={{ __html: selectedMail.html }}
                  />

                  {/* One-Click Action Links Quick Test */}
                  {selectedMail.actionUrls && (
                    <div className="mt-6 p-4 bg-saffron/10 border-2 border-saffron rounded-20">
                      <p className="text-xs font-bold uppercase tracking-wider text-deepOlive mb-2">
                        Signed One-Click Action Links in this Email:
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {selectedMail.actionUrls.ackUrl && (
                          <a
                            href={selectedMail.actionUrls.ackUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-xs font-bold bg-saffron text-deepOlive px-3 py-2 rounded-12 shadow hover:bg-saffron-dark"
                          >
                            <span>Test "Maine Dekh Liya" (Ack)</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {selectedMail.actionUrls.takenUrl && (
                          <a
                            href={selectedMail.actionUrls.takenUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-xs font-bold bg-deepOlive text-cream px-3 py-2 rounded-12 shadow hover:bg-deepOlive-dark"
                          >
                            <span>Test "Dadaji Ne Le Li" (Take)</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-20 text-center text-zinc-400">
                  Select an email to view preview.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

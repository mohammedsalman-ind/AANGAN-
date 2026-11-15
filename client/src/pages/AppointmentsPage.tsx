import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { PrintVisitSheet } from '../components/PrintVisitSheet.js';
import type { Appointment, Medicine, Dose, Checkin } from '@aangan/shared';
import { Stethoscope, Plus, Printer, HelpCircle, MapPin, Calendar, Clock, X } from 'lucide-react';

export const AppointmentsPage: React.FC = () => {
  const { currentMember } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [doses, setDoses] = useState<Dose[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [printingAppt, setPrintingAppt] = useState<Appointment | null>(null);
  const [newQuestionApptId, setNewQuestionApptId] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState('');

  // Form states
  const [doctor, setDoctor] = useState('');
  const [reason, setReason] = useState('');
  const [datetime, setDatetime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    try {
      const [appts, meds, chks] = await Promise.all([
        api.getAppointments(),
        api.getMedicines(),
        api.getCheckins().catch(() => []),
      ]);
      setAppointments(appts);
      setMedicines(meds);
      setCheckins(chks);

      // Fetch doses for past 14 days
      const today = new Date();
      const start = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const end = today.toISOString().split('T')[0];
      const pastDoses = await api.getDosesRange(start, end).catch(() => []);
      setDoses(pastDoses);
    } catch (err) {
      console.warn('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctor.trim() || !datetime) return;

    try {
      await api.createAppointment({
        doctor,
        reason,
        datetime: new Date(datetime).toISOString(),
        location,
        notes,
        questions: [],
      });
      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Appointment save karne me dikkat aayi.');
    }
  };

  const handleAddQuestion = async (apptId: string) => {
    if (!questionText.trim()) return;
    try {
      await api.addDoctorQuestion(apptId, questionText.trim());
      setNewQuestionApptId(null);
      setQuestionText('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Question add nahi ho paya');
    }
  };

  const nextAppointment = appointments.find(
    (a) => new Date(a.datetime).getTime() > Date.now()
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl text-deepOlive dark:text-cream flex items-center gap-3">
            <Stethoscope className="w-8 h-8 text-terracotta" />
            <span>Doctor Appointments & Clinical Sheets</span>
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Doctor visit ki taiyari, sawal, aur printable clinical report
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-terracotta hover:bg-terracotta-dark text-cream font-bold px-5 py-3 rounded-20 shadow-md active:scale-95 transition-all text-base"
        >
          <Plus className="w-5 h-5" />
          <span>Naya Visit Jodein</span>
        </button>
      </div>

      {/* BIG "AGLA APPOINTMENT" CARD FOR ELDER */}
      {nextAppointment && (
        <div className="bg-gradient-to-br from-terracotta to-terracotta-dark text-cream rounded-30 p-6 sm:p-8 shadow-xl mb-8 relative overflow-hidden">
          <span className="text-xs font-bold uppercase tracking-wider bg-saffron text-deepOlive px-3 py-1 rounded-full">
            Agla Doctor Visit (Next Appointment)
          </span>

          <h2 className="font-heading font-black text-3xl sm:text-4xl mt-3">
            {nextAppointment.doctor}
          </h2>
          <p className="text-lg opacity-90 mt-1 font-semibold">{nextAppointment.reason}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6 pt-4 border-t border-white/20">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-5 h-5 text-saffron shrink-0" />
              <span>
                {new Date(nextAppointment.datetime).toLocaleDateString('hi-IN', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-5 h-5 text-saffron shrink-0" />
              <span>{new Date(nextAppointment.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-5 h-5 text-saffron shrink-0" />
              <span className="truncate">{nextAppointment.location}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setPrintingAppt(nextAppointment)}
              className="flex items-center gap-2 bg-white text-terracotta hover:bg-cream font-bold px-5 py-3 rounded-20 shadow-md active:scale-95 transition-all text-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Visit Sheet Print / PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Appointments List */}
      <div className="space-y-6">
        <h2 className="font-heading font-bold text-2xl">Sabhi Doctor Visits</h2>

        {appointments.map((appt) => (
          <div
            key={appt.id}
            className="bg-white dark:bg-zinc-800 rounded-30 p-6 shadow-card border border-borderMuted dark:border-zinc-700 hover:border-terracotta transition-all"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-borderMuted">
              <div>
                <h3 className="font-heading font-bold text-2xl">{appt.doctor}</h3>
                <p className="text-sm font-semibold text-terracotta">{appt.reason}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  {new Date(appt.datetime).toLocaleString()} • {appt.location}
                </p>
              </div>

              <button
                onClick={() => setPrintingAppt(appt)}
                className="flex items-center gap-2 bg-cream hover:bg-sage text-deepOlive font-bold px-4 py-2 rounded-16 border border-borderMuted text-sm shadow-sm"
              >
                <Printer className="w-4 h-4 text-terracotta" />
                <span>Visit Sheet</span>
              </button>
            </div>

            {/* Questions for Doctor */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold flex items-center gap-1.5 text-deepOlive dark:text-cream">
                  <HelpCircle className="w-4 h-4 text-terracotta" />
                  <span>Doctor Se Poochhne Wale Sawal ({appt.questions.length})</span>
                </h4>
                <button
                  onClick={() => setNewQuestionApptId(appt.id)}
                  className="text-xs font-bold text-terracotta hover:underline"
                >
                  + Sawal Jodein
                </button>
              </div>

              {appt.questions.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">Abhi tak koi sawal add nahi kiya gaya.</p>
              ) : (
                <ul className="list-disc pl-5 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                  {appt.questions.map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ul>
              )}

              {/* Add Question Input Box */}
              {newQuestionApptId === appt.id && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Doctor se kya poochna chahte hain?"
                    className="flex-1 px-3 py-2 bg-cream rounded-12 border border-borderMuted text-sm focus:outline-none"
                  />
                  <button
                    onClick={() => handleAddQuestion(appt.id)}
                    className="px-4 py-2 bg-terracotta text-cream text-xs font-bold rounded-12 shadow"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setNewQuestionApptId(null)}
                    className="px-3 py-2 bg-zinc-200 text-zinc-700 text-xs font-bold rounded-12"
                  >
                    Radd
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Appointment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreate}
            className="bg-white dark:bg-zinc-800 w-full max-w-lg rounded-30 p-6 sm:p-8 shadow-2xl border-2 border-borderMuted"
          >
            <div className="flex items-center justify-between pb-4 border-b border-borderMuted mb-6">
              <h3 className="font-heading font-bold text-2xl">Naya Doctor Visit Jodein</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-full hover:bg-cream"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Doctor Ka Naam & Visheshagya</label>
                <input
                  type="text"
                  required
                  value={doctor}
                  onChange={(e) => setDoctor(e.target.value)}
                  placeholder="Jaise: Dr. Arun Mehta (Cardiologist)"
                  className="w-full px-4 py-3 bg-cream rounded-16 border border-borderMuted text-base focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Checkup Ka Karan</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Jaise: Quarterly BP & Heart checkup"
                  className="w-full px-4 py-3 bg-cream rounded-16 border border-borderMuted text-base focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Tareekh Aur Samay</label>
                <input
                  type="datetime-local"
                  required
                  value={datetime}
                  onChange={(e) => setDatetime(e.target.value)}
                  className="w-full px-4 py-3 bg-cream rounded-16 border border-borderMuted text-base focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Hospital / Clinic Ka Sthan</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Jaise: Apollo Clinic, Sector 14"
                  className="w-full px-4 py-3 bg-cream rounded-16 border border-borderMuted text-base focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-6 py-4 bg-terracotta text-cream font-bold text-lg rounded-20 shadow-md hover:bg-terracotta-dark"
            >
              Appointment Save Karein
            </button>
          </form>
        </div>
      )}

      {/* Printable Visit Sheet Modal */}
      {printingAppt && (
        <PrintVisitSheet
          appointment={printingAppt}
          elderName={currentMember?.role === 'elder' ? currentMember.name : 'Dadaji'}
          medicines={medicines}
          doses={doses}
          checkins={checkins}
          onClose={() => setPrintingAppt(null)}
        />
      )}
    </div>
  );
};

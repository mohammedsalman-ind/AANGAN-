import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, X, Volume2, PhoneCall, AlertTriangle } from 'lucide-react';
import { api } from '../api/client.js';

interface DadiVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDoseActionCompleted?: () => void;
}

export const DadiVoiceModal: React.FC<DadiVoiceModalProps> = ({
  isOpen,
  onClose,
  onDoseActionCompleted,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [inputText, setInputText] = useState('');
  const [dadiReply, setDadiReply] = useState(
    'Pranaam! Main Dadi hoon. Bataiye aaj dawai ya tabiyat me kya madad karoon?'
  );
  const [isEmergency, setIsEmergency] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    compartment: string;
  } | null>(null);

  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!isOpen) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
        setInputText(text);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      window.speechSynthesis?.cancel();
    };
  }, [isOpen]);

  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.warn('Mic start failed:', err);
      }
    }
  };

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.95; // Gentle elder pace

    // Find Hindi or Indian English voice if present
    const voices = window.speechSynthesis.getVoices();
    const hiVoice = voices.find((v) => v.lang.includes('hi') || v.name.includes('Hindi'));
    if (hiVoice) utterance.voice = hiVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (messageToSend?: string) => {
    const text = (messageToSend || inputText || transcript).trim();
    if (!text) return;

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setIsThinking(true);
    setInputText('');

    try {
      const payload: any = {
        message: text,
      };

      if (pendingConfirmation) {
        payload.confirmPendingAction = true;
        payload.pendingCompartment = pendingConfirmation.compartment;
      }

      const res = await api.talkToDadi(payload);

      setDadiReply(res.reply);
      speakText(res.reply);

      if (res.isEmergency) {
        setIsEmergency(true);
      }

      if (res.requiresConfirmation && res.pendingCompartment) {
        setPendingConfirmation({ compartment: res.pendingCompartment });
      } else {
        setPendingConfirmation(null);
      }

      if (res.actionTaken === 'MARKED_TAKEN' && onDoseActionCompleted) {
        onDoseActionCompleted();
      }
    } catch (err: any) {
      const errReply = 'Maaf kijiye, main theek se samajh nahi payi. Kripya dubara boliye.';
      setDadiReply(errReply);
      speakText(errReply);
    } finally {
      setIsThinking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dadi-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
    >
      <div className="bg-cream dark:bg-zinc-800 w-full max-w-lg rounded-30 p-6 sm:p-8 shadow-2xl border-4 border-terracotta flex flex-col items-center relative text-deepOlive dark:text-cream">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close Dadi voice assistant"
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-sage dark:hover:bg-zinc-700 transition-all"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Title & Avatar */}
        <div className="text-center mb-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-saffron text-deepOlive flex items-center justify-center text-3xl font-bold shadow-md">
            👵
          </div>
          <h2 id="dadi-title" className="font-heading font-bold text-2xl sm:text-3xl mt-2">
            दादी • Dadi
          </h2>
          <p className="text-sm opacity-80">Aapki Swasthya Saheli (Voice Companion)</p>
        </div>

        {/* Emergency Alert Banner if triggered */}
        {isEmergency && (
          <div className="w-full bg-danger text-cream p-4 rounded-20 mb-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
              <div>
                <p className="font-bold text-base">Aapatkaleen Sthiti (Emergency)</p>
                <p className="text-xs">Pariwar ko alert bheja ja chuka hai</p>
              </div>
            </div>
            <a
              href="tel:112"
              className="bg-white text-danger font-bold px-4 py-2 rounded-12 shadow flex items-center gap-1.5 active:scale-95 text-base"
            >
              <PhoneCall className="w-5 h-5" /> 112 Call
            </a>
          </div>
        )}

        {/* Dadi Response Speech Bubble */}
        <div className="w-full bg-white dark:bg-zinc-700 p-5 rounded-20 shadow-soft border border-borderMuted dark:border-zinc-600 mb-6 min-h-[110px] flex items-center justify-between gap-3">
          <p className="text-xl sm:text-2xl font-heading font-medium leading-relaxed">
            "{dadiReply}"
          </p>
          {isSpeaking && <Volume2 className="w-8 h-8 text-terracotta shrink-0 animate-pulse" />}
        </div>

        {/* Pulsing Kolam Style Mic Ring */}
        <div className="relative my-4 flex items-center justify-center">
          {/* Animated decorative rings */}
          {(isListening || isThinking) && (
            <>
              <div className="absolute w-36 h-36 rounded-full border-4 border-terracotta/40 animate-pulse-ring" />
              <div className="absolute w-44 h-44 rounded-full border-2 border-dashed border-saffron/50 animate-spin" />
            </>
          )}

          <button
            onClick={toggleMic}
            aria-label={isListening ? 'Stop listening' : 'Start speaking'}
            className={`w-28 h-28 rounded-full flex flex-col items-center justify-center text-cream shadow-2xl transition-all duration-300 active:scale-90 ${
              isListening
                ? 'bg-danger scale-110 shadow-danger/50'
                : isThinking
                  ? 'bg-saffron text-deepOlive scale-105'
                  : 'bg-terracotta hover:bg-terracotta-dark shadow-terracotta/40'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-10 h-10" />
                <span className="text-xs font-bold mt-1">Sun rahi hoon</span>
              </>
            ) : isThinking ? (
              <>
                <div className="w-8 h-8 border-4 border-deepOlive border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold mt-1">Soch rahi hoon</span>
              </>
            ) : (
              <>
                <Mic className="w-10 h-10" />
                <span className="text-xs font-bold mt-1">Boliye</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Voice Suggestions */}
        <div className="flex flex-wrap justify-center gap-2 my-4">
          <button
            onClick={() => handleSend('Dadi meri agli dawai kaun si hai?')}
            className="text-xs sm:text-sm bg-sage/60 dark:bg-zinc-700 hover:bg-sage text-deepOlive dark:text-cream px-3 py-1.5 rounded-full border border-borderMuted transition-all font-semibold"
          >
            "Agli dawai kaun si hai?"
          </button>
          <button
            onClick={() => handleSend('Maine subah ki dawai le li')}
            className="text-xs sm:text-sm bg-sage/60 dark:bg-zinc-700 hover:bg-sage text-deepOlive dark:text-cream px-3 py-1.5 rounded-full border border-borderMuted transition-all font-semibold"
          >
            "Maine dawai le li"
          </button>
          <button
            onClick={() => handleSend('Doctor appointment kab hai?')}
            className="text-xs sm:text-sm bg-sage/60 dark:bg-zinc-700 hover:bg-sage text-deepOlive dark:text-cream px-3 py-1.5 rounded-full border border-borderMuted transition-all font-semibold"
          >
            "Doctor visit kab hai?"
          </button>
        </div>

        {/* Fallback Text Input */}
        <div className="w-full flex items-center gap-2 mt-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ya yahan likhkar poochhein..."
            className="flex-1 px-4 py-3 bg-white dark:bg-zinc-700 rounded-20 border border-borderMuted dark:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-terracotta text-base"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim()}
            aria-label="Send message"
            className="p-3 bg-terracotta text-cream rounded-20 shadow hover:bg-terracotta-dark disabled:opacity-40 transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

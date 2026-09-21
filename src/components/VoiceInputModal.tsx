import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  X,
  ArrowRight,
  Loader2,
  AlertCircle,
  Smartphone,
  Banknote,
  ShieldCheck,
  Check,
  Edit3,
} from 'lucide-react';
import { Transaction, PaymentMode, ExpenseCategory, WalletBalances } from '../types';

interface VoiceInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => boolean | void;
  wallets?: WalletBalances;
}

// Convert common spoken number words into numbers
const normalizeSpokenText = (text: string): string => {
  const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  let cleaned = text;
  devanagariDigits.forEach((digit, index) => {
    cleaned = cleaned.replace(new RegExp(digit, 'g'), index.toString());
  });

  const wordMap: { [key: string]: number } = {
    'one': 1,
    'two': 2,
    'three': 3,
    'four': 4,
    'five': 5,
    'ten': 10,
    'twenty': 20,
    'thirty': 30,
    'forty': 40,
    'fifty': 50,
    'sixty': 60,
    'seventy': 70,
    'eighty': 80,
    'ninety': 90,
    'hundred': 100,
    'sau': 100,
    'so': 100,
    'do sau': 200,
    'teen sau': 300,
    'panch sau': 500,
    'hazar': 1000,
    'thousand': 1000,
    'das': 10,
    'bees': 20,
    'tees': 30,
    'chalis': 40,
    'pachas': 50,
    'saath': 60,
    'sattar': 70,
    'assi': 80,
    'nabbe': 90,
  };

  const lower = cleaned.toLowerCase();
  for (const [word, val] of Object.entries(wordMap)) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(lower) && !/\b\d+\b/.test(cleaned)) {
      cleaned = `${val} ${cleaned}`;
      break;
    }
  }

  return cleaned;
};

// Client-side quick translator strictly into clean English
export const parseAndTranslateLocally = (
  rawText: string
): {
  amount: number;
  description: string;
  paymentMode: PaymentMode;
  category: ExpenseCategory;
} => {
  const text = normalizeSpokenText(rawText);
  const lower = text.toLowerCase();

  // Extract amount
  const numMatch = text.match(/\b(\d+(?:\.\d+)?)\b/);
  const amount = numMatch ? parseFloat(numMatch[1]) : 0;

  // Extract payment mode (Cash vs UPI)
  const isCash =
    lower.includes('cash') ||
    lower.includes('rokda') ||
    lower.includes('hard cash') ||
    lower.includes('hath me');
  const paymentMode: PaymentMode = isCash ? 'Cash' : 'UPI';

  // Strip amount and common stop words to locate the item
  let description = text
    .replace(/\b(\d+(?:\.\d+)?)\b/g, '')
    .replace(/\b(rupaye|rupee|rupees|rs|inr|ka|ki|ke|me|pe|se|diya|diye|hua|karch|kharch|paid|spent|online|cash|upi|gpay|phonepe|paytm|bheja|lag|gaye)\b/gi, '')
    .trim();

  const descLower = description.toLowerCase();
  let translatedDesc = 'Daily Expense';
  let category: ExpenseCategory = 'Other';

  if (
    descLower.includes('sabji') ||
    descLower.includes('sabzi') ||
    descLower.includes('vegetable') ||
    descLower.includes('vegetables') ||
    descLower.includes('tarkari') ||
    descLower.includes('bhaji')
  ) {
    translatedDesc = 'Vegetables';
    category = 'Groceries';
  } else if (
    descLower.includes('fal') ||
    descLower.includes('fruit') ||
    descLower.includes('fruits') ||
    descLower.includes('apple') ||
    descLower.includes('banana')
  ) {
    translatedDesc = 'Fruits';
    category = 'Groceries';
  } else if (
    descLower.includes('chai') ||
    descLower.includes('tea') ||
    descLower.includes('coffee') ||
    descLower.includes('canteen') ||
    descLower.includes('samosa') ||
    descLower.includes('nashta') ||
    descLower.includes('snack') ||
    descLower.includes('snacks')
  ) {
    translatedDesc = 'Tea & Snacks';
    category = 'Canteen & Chai';
  } else if (
    descLower.includes('khana') ||
    descLower.includes('mess') ||
    descLower.includes('lunch') ||
    descLower.includes('dinner') ||
    descLower.includes('food') ||
    descLower.includes('thali') ||
    descLower.includes('roti') ||
    descLower.includes('swiggy') ||
    descLower.includes('zomato')
  ) {
    translatedDesc = 'Food & Meals';
    category = 'Mess & Food';
  } else if (
    descLower.includes('auto') ||
    descLower.includes('petrol') ||
    descLower.includes('fuel') ||
    descLower.includes('cab') ||
    descLower.includes('uber') ||
    descLower.includes('ola') ||
    descLower.includes('travel') ||
    descLower.includes('bus') ||
    descLower.includes('metro')
  ) {
    translatedDesc = 'Travel & Auto';
    category = 'Travel & Auto';
  } else if (
    descLower.includes('dudh') ||
    descLower.includes('doodh') ||
    descLower.includes('milk') ||
    descLower.includes('dairy')
  ) {
    translatedDesc = 'Milk & Dairy';
    category = 'Groceries';
  } else if (
    descLower.includes('grocery') ||
    descLower.includes('groceries') ||
    descLower.includes('ration') ||
    descLower.includes('kirana')
  ) {
    translatedDesc = 'Groceries';
    category = 'Groceries';
  } else if (
    descLower.includes('room') ||
    descLower.includes('rent') ||
    descLower.includes('hostel') ||
    descLower.includes('flat') ||
    descLower.includes('pg') ||
    descLower.includes('kiraya')
  ) {
    translatedDesc = 'Room Rent';
    category = 'Room & Rent';
  } else if (
    descLower.includes('recharge') ||
    descLower.includes('wifi') ||
    descLower.includes('data') ||
    descLower.includes('jio') ||
    descLower.includes('airtel')
  ) {
    translatedDesc = 'Mobile Recharge';
    category = 'Recharge & Wi-Fi';
  } else if (
    descLower.includes('book') ||
    descLower.includes('pen') ||
    descLower.includes('copy') ||
    descLower.includes('xerox') ||
    descLower.includes('print') ||
    descLower.includes('stationery') ||
    descLower.includes('college')
  ) {
    translatedDesc = 'Stationery & Books';
    category = 'College & Books';
  } else if (
    descLower.includes('dawa') ||
    descLower.includes('medicine') ||
    descLower.includes('doctor') ||
    descLower.includes('pharmacy')
  ) {
    translatedDesc = 'Medicine';
    category = 'Medical';
  } else if (description.trim()) {
    translatedDesc =
      description.charAt(0).toUpperCase() + description.slice(1);
  }

  return {
    amount,
    description: translatedDesc,
    paymentMode,
    category,
  };
};

export const VoiceInputModal: React.FC<VoiceInputModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  wallets,
}) => {
  const [permissionChoice, setPermissionChoice] = useState<'always' | 'once' | 'denied' | 'pending'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('voice_mic_permission');
      if (saved === 'always') return 'always';
    }
    return 'pending';
  });

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Structured transaction strictly in English
  const [parsedItem, setParsedItem] = useState<{
    amount: number;
    description: string;
    paymentMode: PaymentMode;
    category: ExpenseCategory;
  } | null>(null);

  const availableCash = wallets?.cash ?? 0;
  const availableUpi = wallets?.upi ?? 0;
  const currentAvailable = parsedItem?.paymentMode === 'Cash' ? availableCash : availableUpi;
  const isInsufficient = Boolean(parsedItem && parsedItem.amount > currentAvailable);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const transcriptRef = useRef<string>('');
  const silenceTimerRef = useRef<any>(null);

  // 1. Stop audio capture and clean up
  const stopAudioCapture = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  // 2. Parse voice or typed text into pure English
  const handleParseVoice = useCallback(async (textToParse: string) => {
    if (!textToParse.trim()) return;
    setIsProcessing(true);
    setError(null);

    const local = parseAndTranslateLocally(textToParse);

    try {
      const res = await fetch('/api/ai/parse-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: textToParse }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data && typeof data.data.amount === 'number') {
          setParsedItem({
            amount: Number(data.data.amount) || local.amount,
            description: data.data.description || local.description,
            paymentMode: (data.data.paymentMode === 'Cash' ? 'Cash' : 'UPI') as PaymentMode,
            category: data.data.category || local.category,
          });
          setIsProcessing(false);
          return;
        }
      }
      setParsedItem(local);
    } catch {
      setParsedItem(local);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // 3. Lazy initialize SpeechRecognition in English (en-IN) only when user triggers voice
  const initSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) return recognitionRef.current;
    if (typeof window === 'undefined') return null;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN'; // Indian English dialect handles Indian numbers & colloquial terms accurately

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let fullText = '';
      for (let i = 0; i < event.results.length; i++) {
        fullText += event.results[i][0].transcript + ' ';
      }
      const trimmed = fullText.trim();
      setTranscript(trimmed);
      transcriptRef.current = trimmed;

      // Instant preview update as user speaks
      if (trimmed.length > 2) {
        const preview = parseAndTranslateLocally(trimmed);
        setParsedItem(preview);
      }

      // Auto-stop after 2.5 seconds of silence
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (recognitionRef.current && transcriptRef.current.length > 2) {
          try {
            recognitionRef.current.stop();
          } catch {
            // ignore
          }
        }
      }, 2500);
    };

    recognition.onerror = (e: any) => {
      console.warn('Voice error:', e.error);
      if (e.error === 'not-allowed') {
        setError('Microphone permission was denied. You can type your expense below or allow mic in browser settings.');
      }
      stopAudioCapture();
      setIsListening(false);
    };

    recognition.onend = () => {
      stopAudioCapture();
      setIsListening(false);
      const text = transcriptRef.current;
      if (text && text.trim()) {
        handleParseVoice(text.trim());
      }
    };

    recognitionRef.current = recognition;
    return recognition;
  }, [stopAudioCapture, handleParseVoice]);

  // 4. Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      stopAudioCapture();
      if (isListening && recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      setTranscript('');
      transcriptRef.current = '';
      setParsedItem(null);
      setError(null);
    }
  }, [isOpen, isListening, stopAudioCapture]);

  // 5. Microphone audio decibel visualizer
  const startAudioCapture = async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return true;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        audioContextRef.current = ctx;
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateLevel = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(1, avg / 60));
          animFrameRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      }
      return true;
    } catch (err: any) {
      console.warn('Microphone capture error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone access denied. You can type your expense directly below.');
        setPermissionChoice('denied');
        return false;
      }
      return true;
    }
  };

  // 6. Start speech listening
  const beginListening = async () => {
    setError(null);
    const micReady = await startAudioCapture();
    if (!micReady) return;

    const recognition = initSpeechRecognition();
    if (recognition) {
      try {
        recognition.start();
      } catch (err) {
        console.warn('Recognition start error:', err);
      }
    } else {
      setError('Speech recognition is not supported in this browser. Please type below.');
    }
  };

  // 7. Stop speech listening
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    stopAudioCapture();
    setIsListening(false);

    const currentText = transcriptRef.current || transcript;
    if (currentText.trim()) {
      handleParseVoice(currentText.trim());
    }
  };

  // 8. Confirm and add expense (deducts from balance)
  const handleConfirmAndAdd = () => {
    if (!parsedItem || parsedItem.amount <= 0) return;

    const availableVoice = (parsedItem.paymentMode === 'Cash' ? wallets?.cash : wallets?.upi) ?? 0;
    if (parsedItem.amount > availableVoice) {
      setError(
        `Insufficient ${parsedItem.paymentMode} Balance! You only have ₹${availableVoice.toLocaleString('en-IN')} in ${parsedItem.paymentMode}, but this expense is ₹${parsedItem.amount.toLocaleString('en-IN')}. Please reduce the amount or add funds to ${parsedItem.paymentMode}.`
      );
      return;
    }

    const success = onAddTransaction({
      title: parsedItem.description || 'Voice Expense',
      amount: parsedItem.amount,
      type: 'expense',
      category: parsedItem.category,
      paymentMode: parsedItem.paymentMode,
      date: new Date().toISOString().split('T')[0],
      notes: transcript ? `Voice note: "${transcript}"` : undefined,
    });

    if (success === false) return;

    onClose();
  };

  // 9. Permission grant handlers
  const handleGrantPermission = (choice: 'always' | 'once') => {
    if (choice === 'always') {
      try {
        localStorage.setItem('voice_mic_permission', 'always');
      } catch {
        // ignore
      }
      setPermissionChoice('always');
    } else {
      setPermissionChoice('once');
    }
    beginListening();
  };

  const handleDenyPermission = () => {
    setPermissionChoice('denied');
    setError('Microphone permission denied. You can type your expense in the box below.');
  };

  // Handle typing directly in the transcript input
  const handleTranscriptChange = (text: string) => {
    setTranscript(text);
    transcriptRef.current = text;
    if (text.trim()) {
      const parsed = parseAndTranslateLocally(text.trim());
      setParsedItem(parsed);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div
        id="voice-input-modal"
        className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] transition-all"
      >
        {/* Header - 100% English Only */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Mic className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm tracking-tight leading-snug">
                Voice Expense
              </h3>
              <p className="text-[11px] text-slate-500 font-normal">
                Speak or type expense • Deducts from balance
              </p>
            </div>
          </div>

          <button
            type="button"
            id="close-voice-modal-btn"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Permission Prompt */}
          {permissionChoice === 'pending' ? (
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-4 animate-fade-in text-center">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-800 shadow-xs">
                <ShieldCheck className="w-6 h-6 text-slate-900" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">
                  Allow Microphone Access
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed px-2">
                  PocketBuddy needs microphone access to listen clearly to your expense.
                </p>
              </div>

              <div className="space-y-2 pt-1 text-xs font-semibold">
                <button
                  type="button"
                  id="mic-perm-while-using"
                  onClick={() => handleGrantPermission('always')}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer shadow-xs"
                >
                  While using this website
                </button>
                <button
                  type="button"
                  id="mic-perm-only-once"
                  onClick={() => handleGrantPermission('once')}
                  className="w-full py-2.5 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Only this time
                </button>
                <button
                  type="button"
                  id="mic-perm-deny"
                  onClick={handleDenyPermission}
                  className="w-full py-2 px-4 text-slate-400 hover:text-slate-600 text-[11px] transition cursor-pointer"
                >
                  Do not allow (type instead)
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Mic & Waveform Section */}
              <div className="flex flex-col items-center justify-center py-5 px-4 bg-slate-50/80 rounded-2xl border border-slate-200/90 relative">
                {/* Sound wave bars */}
                {isListening && (
                  <div className="flex items-center gap-1 mb-3 h-6">
                    {[0.35, 0.75, 1, 0.85, 0.45, 0.95, 0.6].map((factor, idx) => {
                      const dynamicHeight = Math.max(
                        4,
                        Math.round(audioLevel * 24 * factor)
                      );
                      return (
                        <div
                          key={idx}
                          className="w-1 bg-rose-500 rounded-full transition-all duration-75"
                          style={{ height: `${dynamicHeight}px` }}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Big Mic Button */}
                <button
                  id="voice-mic-trigger-btn"
                  type="button"
                  onClick={isListening ? stopListening : beginListening}
                  className={`w-18 h-18 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm ${
                    isListening
                      ? 'bg-rose-600 text-white ring-4 ring-rose-200 animate-pulse scale-105'
                      : 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-102'
                  }`}
                  aria-label={isListening ? 'Stop listening' : 'Start listening'}
                >
                  {isListening ? (
                    <MicOff className="w-7 h-7 stroke-[2.2]" />
                  ) : (
                    <Mic className="w-7 h-7 stroke-[2.2]" />
                  )}
                </button>

                <div className="text-center mt-2.5 space-y-0.5">
                  <p className="text-xs font-semibold text-slate-900">
                    {isListening
                      ? 'Listening clearly... Tap when finished'
                      : 'Tap mic to speak your expense'}
                  </p>
                  <p className="text-[11px] text-slate-400 font-normal">
                    {isListening
                      ? 'Capturing audio live...'
                      : 'e.g. "20 rupee sabji" or "50 auto"'}
                  </p>
                </div>
              </div>

              {/* Error Notification */}
              {error && (
                <div
                  id="voice-error-alert"
                  className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Live Spoken & Editable Text Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Spoken or Typed Text:</span>
                  </label>
                  {isListening ? (
                    <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                      Listening...
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">
                      Editable text field
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    id="live-voice-transcript-input"
                    type="text"
                    value={transcript}
                    onChange={(e) => handleTranscriptChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (transcript.trim()) {
                          handleParseVoice(transcript.trim());
                        }
                      }
                    }}
                    placeholder={
                      isListening
                        ? 'Listening live... (or type here)'
                        : 'Speak with mic or type here (e.g. 20 rupee sabji)'
                    }
                    className="w-full py-2.5 px-3.5 pr-18 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent placeholder:text-slate-400 shadow-xs"
                  />
                  {transcript.trim() && (
                    <button
                      type="button"
                      id="live-transcript-process-btn"
                      onClick={() => handleParseVoice(transcript.trim())}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-semibold transition cursor-pointer shadow-2xs"
                    >
                      Process
                    </button>
                  )}
                </div>
              </div>

              {/* Processing Loader */}
              {isProcessing && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center flex items-center justify-center gap-2 text-xs font-medium text-slate-600">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                  <span>Translating expense into English...</span>
                </div>
              )}

              {/* Structured English Expense Card (Ready to add and deduct) */}
              {parsedItem && (
                <div
                  id="voice-parsed-result-card"
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3.5 animate-fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Expense Details</span>
                    </span>
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                      Deduct from balance
                    </span>
                  </div>

                  {/* 1. Item Description & Amount */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Item translated into English */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                      <span className="text-[10px] font-medium text-slate-400 block mb-0.5 uppercase tracking-wider">
                        Item (English)
                      </span>
                      <input
                        type="text"
                        value={parsedItem.description}
                        onChange={(e) =>
                          setParsedItem({
                            ...parsedItem,
                            description: e.target.value,
                          })
                        }
                        className="w-full bg-transparent border-0 p-0 text-sm font-bold text-slate-900 focus:outline-none"
                        placeholder="e.g. Vegetables"
                      />
                    </div>

                    {/* Amount */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                      <span className="text-[10px] font-medium text-slate-400 block mb-0.5 uppercase tracking-wider">
                        Amount
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-base font-bold text-slate-400">₹</span>
                        <input
                          type="number"
                          step="any"
                          value={parsedItem.amount > 0 ? parsedItem.amount : ''}
                          placeholder="0"
                          onChange={(e) =>
                            setParsedItem({
                              ...parsedItem,
                              amount: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full bg-transparent border-0 p-0 text-base font-bold text-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. UPI or Cash Selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Payment Method (Deducted From)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {/* UPI Option */}
                      <button
                        type="button"
                        id="voice-select-upi-btn"
                        onClick={() =>
                          setParsedItem({ ...parsedItem, paymentMode: 'UPI' })
                        }
                        className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-semibold text-xs transition cursor-pointer ${
                          parsedItem.paymentMode === 'UPI'
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs ring-1 ring-indigo-500'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Smartphone className="w-4 h-4 text-indigo-600" />
                        <span>Online / UPI</span>
                        {parsedItem.paymentMode === 'UPI' && (
                          <Check className="w-3.5 h-3.5 text-indigo-600 ml-auto" />
                        )}
                      </button>

                      {/* Cash Option */}
                      <button
                        type="button"
                        id="voice-select-cash-btn"
                        onClick={() =>
                          setParsedItem({ ...parsedItem, paymentMode: 'Cash' })
                        }
                        className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-semibold text-xs transition cursor-pointer ${
                          parsedItem.paymentMode === 'Cash'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs ring-1 ring-emerald-500'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Banknote className="w-4 h-4 text-emerald-600" />
                        <span>Cash</span>
                        {parsedItem.paymentMode === 'Cash' && (
                          <Check className="w-3.5 h-3.5 text-emerald-600 ml-auto" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 3. Wallet deduction info & balance check */}
                  {(() => {
                    const availableVoice = (parsedItem.paymentMode === 'Cash' ? wallets?.cash : wallets?.upi) ?? 0;
                    const isInsufficientVoice = parsedItem.amount > availableVoice;
                    return (
                      <div className="space-y-2">
                        <div className={`text-[11px] p-2.5 rounded-xl border flex items-center justify-between ${
                          isInsufficientVoice
                            ? 'bg-rose-50/70 border-rose-200 text-rose-800'
                            : 'bg-white border-slate-200/80 text-slate-600'
                        }`}>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium">Available in {parsedItem.paymentMode}:</span>
                            <span className="font-bold text-slate-900">₹{availableVoice.toLocaleString('en-IN')}</span>
                          </div>
                          <span className={`font-bold ${isInsufficientVoice ? 'text-rose-600' : 'text-slate-700'}`}>
                            -₹{(parsedItem.amount || 0).toFixed(2)}
                          </span>
                        </div>

                        {isInsufficientVoice && (
                          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>
                              Insufficient {parsedItem.paymentMode} Balance! Max: ₹{availableVoice.toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}

                        {/* 4. Add Expense Button */}
                        <button
                          id="confirm-voice-expense-btn"
                          type="button"
                          disabled={!parsedItem.amount || parsedItem.amount <= 0 || isInsufficientVoice}
                          onClick={handleConfirmAndAdd}
                          className={`w-full py-3 px-4 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 shadow-xs ${
                            isInsufficientVoice
                              ? 'bg-rose-100 text-rose-700 border border-rose-300 cursor-not-allowed'
                              : 'bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white cursor-pointer active:scale-[0.99]'
                          }`}
                        >
                          <span>
                            {isInsufficientVoice
                              ? `Insufficient ${parsedItem.paymentMode} (Max: ₹${availableVoice.toLocaleString('en-IN')})`
                              : `Add Expense • ₹${(parsedItem.amount || 0).toFixed(2)}`}
                          </span>
                          {!isInsufficientVoice && <ArrowRight className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}
            </>
          )}

          {/* Action Footer */}
          <div className="pt-1 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

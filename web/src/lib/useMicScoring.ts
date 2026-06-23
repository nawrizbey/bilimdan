import { useEffect, useRef, useState } from 'react';
import { scorePronunciation } from './pronunciation';

const ERROR_MESSAGES: Record<string, string> = {
  'no-speech': "Ovoz eshitilmadi. Mikrofonga yaqinroq turib, yana urinib ko'ring.",
  'not-allowed': 'Mikrofonga ruxsat berilmadi. Brauzer sozlamalaridan ruxsat bering.',
  'service-not-allowed': 'Mikrofonga ruxsat berilmadi. Brauzer sozlamalaridan ruxsat bering.',
  'audio-capture': 'Mikrofon topilmadi. Qurilmangizni tekshiring.',
  network: "Internet aloqasi yo'q yoki sust. Ovoz tanish xizmatiga ulanib bo'lmadi.",
  aborted: '',
};

const WATCHDOG_MS = 8000;

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

interface UseMicScoringOptions {
  word: string;
  micEnabled: boolean;
  /** Fires once the recognizer actually starts listening (mic granted) — use to clear stale results. */
  onStart?: () => void;
  onResult: (score: number, transcript: string) => void;
  /** Changing this aborts any in-flight recognition (e.g. moving to the next word). */
  resetKey?: unknown;
}

/** Shared Web Speech API recording + Levenshtein pronunciation-scoring flow, used by
 * both the standalone Talaffuz mashqi screen and the per-unit "Aytish" learn phase. */
export function useMicScoring({ word, micEnabled, onStart, onResult, resetKey }: UseMicScoringOptions) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingRef = useRef(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supported = typeof window !== 'undefined' && !!getSpeechRecognitionCtor();

  const setRecordingState = (value: boolean) => {
    recordingRef.current = value;
    setRecording(value);
  };

  const clearWatchdog = () => {
    if (watchdogRef.current != null) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  };

  const reset = () => {
    recognitionRef.current?.abort();
    clearWatchdog();
    setRecordingState(false);
    setError(null);
  };

  useEffect(() => {
    return () => {
      clearWatchdog();
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, [resetKey]);

  const handleMicClick = () => {
    if (recording) {
      recognitionRef.current?.stop();
      return;
    }
    setError(null);
    if (!micEnabled) {
      setError("Mikrofon sozlamalarda o'chirilgan. Sozlamalar bo'limidan yoqing.");
      return;
    }
    const SpeechRecognitionCtor = getSpeechRecognitionCtor();
    if (!SpeechRecognitionCtor) {
      setError("Brauzeringiz ovozni tanib olishni qo'llab-quvvatlamaydi. Google Chrome'da urinib ko'ring.");
      return;
    }

    let started = false;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      started = true;
      setRecordingState(true);
      onStart?.();
    };
    recognition.onresult = (event) => {
      clearWatchdog();
      const text = event.results[0]?.[0]?.transcript ?? '';
      const score = scorePronunciation(text, word);
      setRecordingState(false);
      onResult(score, text);
    };
    recognition.onerror = (event) => {
      clearWatchdog();
      const message = ERROR_MESSAGES[event.error] ?? "Xatolik yuz berdi. Qaytadan urinib ko'ring.";
      if (message) setError(message);
      setRecordingState(false);
    };
    recognition.onend = () => {
      clearWatchdog();
      if (recordingRef.current) setRecordingState(false);
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setError("Mikrofonni ishga tushirib bo'lmadi. Qaytadan urinib ko'ring.");
      return;
    }

    watchdogRef.current = setTimeout(() => {
      if (!started || recordingRef.current) {
        recognitionRef.current?.abort();
        setRecordingState(false);
        setError(
          !started
            ? 'Ovoz tanish xizmati javob bermadi. Internet aloqangizni tekshirib, qaytadan urining.'
            : "Vaqt tugadi. Yana urinib ko'ring.",
        );
      }
    }, WATCHDOG_MS);
  };

  return { supported, recording, error, handleMicClick, reset };
}

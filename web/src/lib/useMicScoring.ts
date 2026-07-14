import { useEffect, useRef, useState } from 'react';
import { scorePronunciation } from './pronunciation';

const ERROR_MESSAGES: Record<string, string> = {
  'no-speech': 'Dawıs eshitilmedi. Mikrofonga jaqınıraq turıp, qaytadan urınıp kóriń.',
  'not-allowed': 'Mikrofonga ruxsat berilmedi. Brauzer sazlamalarınan ruxsat beriń.',
  'service-not-allowed': 'Mikrofonga ruxsat berilmedi. Brauzer sazlamalarınan ruxsat beriń.',
  'audio-capture': 'Mikrofon tabılmadı. Qurilmanı tekserińiz.',
  network: 'Internet baylanısı joq yamasa áste. Dawıs tanıw xizmetine ulanıp bolmadı.',
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
  /** Fires for any real failure (permission denied, no speech heard, network, unsupported browser...) —
   * i.e. every non-empty error message. Use this to count consecutive mic failures, since it fires as
   * an event rather than needing to be derived from the `error` string via an effect. */
  onError?: (message: string) => void;
  /** Changing this aborts any in-flight recognition (e.g. moving to the next word). */
  resetKey?: unknown;
}

/** Shared Web Speech API recording + Levenshtein pronunciation-scoring flow, used by
 * both the standalone Talaffuz mashqi screen and the per-unit "Aytish" learn phase. */
export function useMicScoring({ word, micEnabled, onStart, onResult, onError, resetKey }: UseMicScoringOptions) {
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

  const raiseError = (message: string) => {
    setError(message);
    if (message) onError?.(message);
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
      raiseError("Mikrofon sazlamalarda óshirilgen. Sazlamalar bóliminen yaqıń.");
      return;
    }
    const SpeechRecognitionCtor = getSpeechRecognitionCtor();
    if (!SpeechRecognitionCtor) {
      raiseError("Brauzerińiz dawıs tanıwdı qollap-quwatlamaydı. Google Chrome'da urınıp kóriń.");
      return;
    }

    let started = false;
    let gotResult = false;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    recognition.onstart = () => {
      started = true;
      setRecordingState(true);
      onStart?.();
    };
    recognition.onresult = (event) => {
      clearWatchdog();
      gotResult = true;
      const text = event.results[0]?.[0]?.transcript ?? '';
      const score = scorePronunciation(text, word);
      setRecordingState(false);
      onResult(score, text);
    };
    recognition.onerror = (event) => {
      clearWatchdog();
      gotResult = true;
      const message = ERROR_MESSAGES[event.error] ?? "Qátelik júz berdi. Qaytadan urınıp kóriń.";
      if (message) raiseError(message);
      setRecordingState(false);
    };
    recognition.onend = () => {
      clearWatchdog();
      if (recordingRef.current) {
        setRecordingState(false);
        // onend fired without onresult or onerror — mic was open but no speech detected
        if (!gotResult) {
          raiseError('Dawıs eshitilmedi. Mikrofonga jaqınıraq turıp, inglizsha sózdi aytıp kóriń.');
        }
      }
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      raiseError("Mikrofondı ishke tushirip bolmadı. Qaytadan urınıp kóriń.");
      return;
    }

    watchdogRef.current = setTimeout(() => {
      if (!started || recordingRef.current) {
        recognitionRef.current?.abort();
        setRecordingState(false);
        raiseError(
          !started
            ? 'Dawıs tanıw xizmeti juwap bermedi. Internet baylanısıńızdı tekserip, qaytadan urınıń.'
            : "Waqıt tamamlandı. Qaytadan urınıp kóriń.",
        );
      }
    }, WATCHDOG_MS);
  };

  return { supported, recording, error, handleMicClick, reset };
}

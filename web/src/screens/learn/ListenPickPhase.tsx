import { useState, useEffect, useMemo } from 'react';
import { speak } from '../../lib/speech';

interface Word {
  id: number;
  en: string;
  uz: string;
  emoji: string;
  ipa: string;
}

interface Props {
  word: Word;
  distractors: string[];
  onCorrect: () => void;
  onWrong: () => void;
  onSkip: () => void;
  wordIndex: number;
}

export function ListenPickPhase({ word, distractors, onCorrect, onWrong, onSkip, wordIndex }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Shuffle options once per word (keyed by word.id)
  const options = useMemo<string[]>(() => {
    const all = [word.uz, ...distractors];
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word.id]);

  const correctIdx = options.indexOf(word.uz);

  const playAudio = () => {
    setIsPlaying(true);
    speak(word.en);
    // Animate for 1.8s — covers typical TTS duration for short words
    setTimeout(() => setIsPlaying(false), 1800);
  };

  // Auto-play and reset state when the word changes
  useEffect(() => {
    setSelected(null);
    setIsPlaying(false);
    const delay = setTimeout(() => playAudio(), 150);
    return () => {
      clearTimeout(delay);
      setIsPlaying(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordIndex, word.id]);

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
  };

  const handleNext = () => {
    if (selected === null) return;
    if (selected === correctIdx) {
      onCorrect();
    } else {
      onWrong();
    }
  };

  return (
    <div className="max-w-[520px] mx-auto flex flex-col items-center">
      {/* Blue mode badge */}
      <div className="self-start mb-4 inline-flex items-center gap-2 bg-[#EFF6FF] text-secondary-dark font-extrabold text-[12.5px] py-[6px] px-[14px] rounded-[20px] border border-[#BFDBFE]">
        🔊 Tinglash
      </div>

      {/* Speaker button with ripple */}
      <div className="relative mb-6">
        {isPlaying && (
          <div className="absolute inset-0 rounded-full bg-blue-200 animate-ping opacity-30" />
        )}
        <button
          onClick={playAudio}
          className="relative w-24 h-24 rounded-full bg-[#EFF6FF] border-2 border-[#BFDBFE] flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
          style={{ boxShadow: '0 4px 20px rgba(59,130,246,.18)' }}
          aria-label="Qayta tinglash"
        >
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
            <path d="M11 5L6 9H2v6h4l5 4V5z" fill="#3B82F6" />
            <path
              d="M15.5 8.5a5 5 0 010 7"
              stroke="#3B82F6"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M18.5 5.5a9 9 0 010 13"
              stroke="#93C5FD"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </button>
      </div>

      {/* Prompt */}
      <p className="text-[13px] font-extrabold text-text-softer tracking-[.08em] uppercase mb-5">
        Qaysi so&apos;z bu?
      </p>

      {/* Options */}
      <div className="w-full flex flex-col gap-[11px] mb-4">
        {options.map((label, i) => {
          let bg = '#F8FAFC';
          let bd = '#E8EDF3';
          let col = '#0F172A';
          let bbg = '#E2E8F0';
          let bcol = '#64748B';

          if (selected !== null) {
            if (i === correctIdx) {
              bg = '#DCFCE7';
              bd = '#22C55E';
              col = '#15803D';
              bbg = '#22C55E';
              bcol = '#fff';
            } else if (i === selected) {
              bg = '#FEE2E2';
              bd = '#EF4444';
              col = '#DC2626';
              bbg = '#EF4444';
              bcol = '#fff';
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className="flex items-center w-full text-left p-[14px] rounded-[15px] border-2 font-sans font-bold text-[16px] transition-all"
              style={{
                background: bg,
                borderColor: bd,
                color: col,
                cursor: selected !== null ? 'default' : 'pointer',
              }}
            >
              <span
                className="w-[30px] h-[30px] flex-none rounded-[9px] flex items-center justify-center font-extrabold text-[14px] mr-[13px] transition-all"
                style={{ background: bbg, color: bcol }}
              >
                {String.fromCharCode(65 + i)}
              </span>
              {label}
            </button>
          );
        })}
      </div>

      {/* Post-selection: emoji + IPA */}
      {selected !== null && (
        <div className="animate-pop flex flex-col items-center gap-1 mb-5">
          <span className="text-[48px]">{word.emoji}</span>
          <span className="text-[15px] font-bold text-text-softer font-sans">{word.ipa}</span>
        </div>
      )}

      {/* Post-selection: listen again + next */}
      {selected !== null && (
        <div className="w-full flex gap-3 animate-pop">
          <button
            onClick={playAudio}
            className="flex-1 bg-[#EFF6FF] text-secondary-dark border border-[#BFDBFE] rounded-[14px] py-[13px] font-display font-extrabold text-[15px] cursor-pointer"
          >
            Yana tinglash
          </button>
          <button
            onClick={handleNext}
            className="flex-1 bg-secondary text-white border-none rounded-[14px] py-[13px] font-display font-extrabold text-[15px] cursor-pointer"
            style={{ boxShadow: '0 5px 0 #1D4ED8' }}
          >
            Keyingisi →
          </button>
        </div>
      )}

      {/* Pre-selection: skip */}
      {selected === null && (
        <button
          onClick={onSkip}
          className="mt-2 text-[13px] font-bold text-text-softer cursor-pointer hover:text-text-soft transition-colors"
        >
          O&apos;tkazib yuborish
        </button>
      )}
    </div>
  );
}

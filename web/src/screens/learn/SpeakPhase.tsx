import { useAppStore } from '../../store/useAppStore';
import { speak } from '../../lib/speech';
import { useMicScoring } from '../../lib/useMicScoring';

const WAVE_IDLE_HEIGHTS = [12, 18, 10, 22, 14, 26, 16, 22, 12, 18, 10, 20, 14];

export function SpeakPhase() {
  const learnSpeakIdx = useAppStore((s) => s.learnSpeakIdx);
  const learnSpeakScore = useAppStore((s) => s.learnSpeakScore);
  const learnSpeakTranscript = useAppStore((s) => s.learnSpeakTranscript);
  const currentUnitWords = useAppStore((s) => s.currentUnitWords);
  const micEnabled = useAppStore((s) => s.settings.mic);
  const learnSpeakStart = useAppStore((s) => s.learnSpeakStart);
  const learnSpeakFinish = useAppStore((s) => s.learnSpeakFinish);
  const learnSpeakNext = useAppStore((s) => s.learnSpeakNext);

  const word = currentUnitWords[learnSpeakIdx];
  const { supported, recording, error, handleMicClick, reset } = useMicScoring({
    word: word?.en ?? '',
    micEnabled,
    onStart: learnSpeakStart,
    onResult: learnSpeakFinish,
    resetKey: learnSpeakIdx,
  });

  if (!word) return null;

  const hasScore = learnSpeakScore != null;
  const ringCircumference = 200;
  const ringOffset = ringCircumference - (ringCircumference * (learnSpeakScore ?? 0)) / 100;

  const handleNext = () => {
    reset();
    learnSpeakNext();
  };

  return (
    <div className="max-w-[560px] mx-auto text-center">
      <div className="inline-flex items-center gap-2 bg-[#F3E8FF] text-speak-dark font-extrabold text-[12.5px] py-[6px] px-[14px] rounded-[20px] mb-[10px]">
        🎙️ AYTISH MASHQI
      </div>
      <div className="text-[13.5px] font-bold text-text-softer mb-5">
        So'z {learnSpeakIdx + 1} / {currentUnitWords.length}
      </div>

      {!supported && (
        <div className="bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-[13.5px] font-bold rounded-[14px] p-[14px] mb-4">
          Brauzeringiz ovozni tanib olishni qo'llab-quvvatlamaydi — "O'tkazib yuborish" tugmasi bilan davom eting.
        </div>
      )}

      <div className="bg-white border border-border-2 rounded-[26px] p-7" style={{ boxShadow: '0 10px 30px rgba(15,23,42,.06)' }}>
        <div className="font-display font-extrabold text-[38px] text-text">{word.en}</div>
        <div className="text-[16px] font-bold text-speak my-[2px] mb-3">
          {word.ipa} · {word.uz}
        </div>
        <button
          onClick={() => speak(word.en)}
          className="inline-flex items-center gap-2 bg-[#F3E8FF] text-speak-dark border border-[#E9D5FF] rounded-[13px] py-[8px] px-4 font-extrabold text-[13px] cursor-pointer font-sans"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#7C3AED">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
          </svg>
          Namunani tinglash
        </button>

        <div className="flex items-center justify-center gap-1 h-[48px] my-5">
          {WAVE_IDLE_HEIGHTS.map((h, i) => (
            <div
              key={i}
              className="w-[4px] rounded-[6px]"
              style={{
                background: 'linear-gradient(180deg,#8B5CF6,#A78BFA)',
                height: recording ? '12px' : `${h * 0.8}px`,
                animation: recording ? `wave .7s ease-in-out ${i * 0.07}s infinite` : 'none',
              }}
            />
          ))}
        </div>

        <button
          onClick={handleMicClick}
          disabled={!supported}
          aria-label={recording ? "Yozishni to'xtatish" : 'Mikrofonni yoqish'}
          aria-pressed={recording}
          className="w-20 h-20 rounded-full border-none inline-flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-speak focus-visible:ring-offset-2"
          style={{
            cursor: supported ? 'pointer' : 'not-allowed',
            opacity: supported ? 1 : 0.5,
            ...(recording
              ? { background: 'linear-gradient(150deg,#F43F5E,#EC4899)', boxShadow: '0 8px 22px rgba(236,72,153,.5)', animation: 'ring 1.2s infinite' }
              : { background: 'linear-gradient(150deg,#8B5CF6,#7C3AED)', boxShadow: '0 8px 22px rgba(139,92,246,.45)' }),
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 11a7 7 0 0014 0M12 18v3" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        </button>
        <div className="text-[13px] font-extrabold mt-3" style={{ color: recording ? '#EC4899' : '#8B5CF6' }}>
          {recording ? "Tinglayapman…" : 'Mikrofonni yoqish uchun bosing'}
        </div>

        {error && (
          <div className="mt-4 bg-danger-light border border-[#FECACA] text-danger-dark text-[13px] font-bold rounded-[12px] p-3">
            {error}
          </div>
        )}

        {hasScore && (
          <div className="animate-pop mt-5 bg-primary-light border border-[#BBF7D0] rounded-[18px] p-4 flex items-center gap-4 text-left">
            <div className="relative w-[64px] h-[64px] flex-none">
              <svg width="64" height="64" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="#DCFCE7" strokeWidth="7" />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  transform="rotate(-90 32 32)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-display font-extrabold text-[15px] text-[#16A34A]">
                {learnSpeakScore}%
              </div>
            </div>
            <div className="flex-1">
              <div className="font-display font-extrabold text-[15px] text-[#15803D]">
                {learnSpeakScore != null && learnSpeakScore >= 70 ? "Zo'r! 🎉" : "Yana urinib ko'ring 💪"}
              </div>
              {learnSpeakTranscript && (
                <div className="text-[12px] font-bold text-[#15803D]/80">Siz aytdingiz: "{learnSpeakTranscript}"</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-5">
        {!hasScore && (
          <button
            onClick={handleNext}
            className="flex-1 bg-border-3 text-[#475569] border-none rounded-[15px] py-[14px] font-display font-bold text-[15px] cursor-pointer"
          >
            O'tkazib yuborish
          </button>
        )}
        {hasScore && (
          <>
            <button
              onClick={handleMicClick}
              className="flex-1 bg-white text-speak-dark border-2 border-[#E9D5FF] rounded-[15px] py-[13px] font-display font-extrabold text-[15px] cursor-pointer"
            >
              ↻ Qayta
            </button>
            <button
              onClick={handleNext}
              className="flex-1 bg-speak text-white border-none rounded-[15px] py-[14px] font-display font-extrabold text-[15px] cursor-pointer"
              style={{ boxShadow: '0 5px 0 #7C3AED' }}
            >
              Keyingi so'z →
            </button>
          </>
        )}
      </div>
    </div>
  );
}

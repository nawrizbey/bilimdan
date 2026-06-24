import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/useAppStore';
import { speak } from '../../lib/speech';

export function FamiliarizePhase() {
  const { t } = useTranslation();
  const card = useAppStore((s) => s.card);
  const flipped = useAppStore((s) => s.flipped);
  const currentUnitWords = useAppStore((s) => s.currentUnitWords);
  const familiarizeViewed = useAppStore((s) => s.familiarizeViewed);
  const flipCard = useAppStore((s) => s.flipCard);
  const nextCardLocal = useAppStore((s) => s.nextCardLocal);
  const prevCard = useAppStore((s) => s.prevCard);
  const finishFamiliarize = useAppStore((s) => s.finishFamiliarize);

  const word = currentUnitWords[card];
  if (!word) return null;

  return (
    <div>
      <div className="text-center text-[13.5px] font-bold text-text-softer mb-[14px]">
        {t('familiarize.progress', { card: card + 1, total: currentUnitWords.length, viewed: familiarizeViewed.length })}
      </div>

      <div style={{ perspective: '1500px', height: '340px' }}>
        <div
          className="relative w-full h-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateY(${flipped ? 180 : 0}deg)`,
            transitionTimingFunction: 'cubic-bezier(.4,.2,.2,1)',
          }}
        >
          {/* FRONT */}
          <div
            onClick={flipCard}
            role="button"
            tabIndex={flipped ? -1 : 0}
            aria-hidden={flipped}
            aria-label={t('familiarize.flipToTranslation') ?? undefined}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                flipCard();
              }
            }}
            className="absolute inset-0 bg-white border border-border-2 rounded-[28px] flex flex-col items-center justify-center p-[30px] cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            style={{ backfaceVisibility: 'hidden', boxShadow: '0 14px 40px rgba(15,23,42,.08)' }}
          >
            <div className="text-[64px] mb-2">{word.emoji}</div>
            <div className="font-display font-extrabold text-[46px] text-text leading-none">{word.en}</div>
            <div className="text-[18px] font-bold text-text-softer mt-[6px]">{word.ipa}</div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                speak(word.en);
              }}
              className="mt-[18px] flex items-center gap-2 bg-[#EFF6FF] text-secondary-dark border border-[#BFDBFE] rounded-[14px] py-[11px] px-[18px] font-extrabold text-[14px] cursor-pointer font-sans"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#2563EB">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M15.5 8.5a5 5 0 010 7" stroke="#2563EB" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
              {t('familiarize.listen')}
            </button>
            <div className="absolute bottom-4 text-[12px] font-bold text-[#CBD5E1]">{t('familiarize.tapToFlip')}</div>
          </div>

          {/* BACK */}
          <div
            onClick={flipCard}
            role="button"
            tabIndex={flipped ? 0 : -1}
            aria-hidden={!flipped}
            aria-label={t('familiarize.flipToWord') ?? undefined}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                flipCard();
              }
            }}
            className="absolute inset-0 rounded-[28px] flex flex-col items-center justify-center p-9 cursor-pointer text-center focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: 'linear-gradient(150deg,#22C55E,#16A34A)',
              boxShadow: '0 14px 40px rgba(22,163,74,.3)',
            }}
          >
            <div className="text-[13px] font-extrabold text-white/70 tracking-[.08em]">{t('familiarize.translationLabel')}</div>
            <div className="font-display font-extrabold text-[42px] text-white my-1 mb-[18px]">{word.uz}</div>
            <div className="bg-white/[.16] rounded-[16px] py-4 px-5 max-w-[90%]">
              <div className="text-[12px] font-extrabold text-white/70 mb-1">{t('familiarize.exampleLabel')}</div>
              <div className="text-[17px] font-bold text-white italic">"{word.example}"</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-6 items-stretch">
        <button
          onClick={prevCard}
          aria-label={t('familiarize.prevCard') ?? undefined}
          className="flex-none w-14 bg-white text-text-soft border-[1.5px] border-border rounded-[16px] font-display font-extrabold text-[22px] cursor-pointer hover:border-secondary hover:text-secondary"
        >
          ‹
        </button>
        <button
          onClick={nextCardLocal}
          className="flex-1 bg-white text-text border-[1.5px] border-border rounded-[16px] p-[15px] font-display font-bold text-[16px] cursor-pointer hover:border-secondary hover:text-secondary"
        >
          {t('familiarize.nextWord')}
        </button>
        <button
          onClick={finishFamiliarize}
          className="flex-1 bg-primary text-white border-none rounded-[16px] p-[15px] font-display font-extrabold text-[16px] cursor-pointer"
          style={{ boxShadow: '0 5px 0 #15803D' }}
        >
          {t('familiarize.continueToWrite')}
        </button>
      </div>
      <div className="hidden sm:block text-center mt-[14px] text-[12px] font-bold text-[#CBD5E1]">
        {t('familiarize.keyboardHint')}
      </div>
    </div>
  );
}

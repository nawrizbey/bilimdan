import { useState, useRef, useMemo, useEffect } from 'react'

interface Word {
  id: number
  en: string
  uz: string
  emoji: string
  ipa: string
}

interface Props {
  words: Word[]
  onComplete: (correct: number, total: number) => void
  onSkip: () => void
}

interface Question {
  en: string
  uz: string
  emoji: string
  isTrue: boolean
}

type FeedbackState = 'none' | 'correct' | 'wrong'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateQuestions(words: Word[]): Question[] {
  if (words.length < 2) return []
  const qs: Question[] = []
  words.forEach(word => {
    // TRUE: correct EN↔UZ pair
    qs.push({ en: word.en, uz: word.uz, emoji: word.emoji, isTrue: true })
    // FALSE: correct EN but wrong UZ from another word
    const others = words.filter(w => w.id !== word.id)
    const wrong = others[Math.floor(Math.random() * others.length)]
    qs.push({ en: word.en, uz: wrong.uz, emoji: word.emoji, isTrue: false })
  })
  return shuffle(qs).slice(0, Math.min(words.length * 2, 16))
}

export function TrueFalsePhase({ words, onComplete, onSkip }: Props) {
  const questions = useMemo(() => generateQuestions(words), [words])
  const total = questions.length

  const [qIdx, setQIdx] = useState(0)
  const [feedback, setFeedback] = useState<FeedbackState>('none')
  const [correctCount, setCorrectCount] = useState(0)
  const [showCombo, setShowCombo] = useState(false)
  const [comboDisplay, setComboDisplay] = useState(0)

  // Refs for mutable counters — avoids stale-closure bugs in setTimeout callbacks
  const qIdxRef = useRef(0)
  const correctRef = useRef(0)
  const comboRef = useRef(0)
  const processingRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Always-fresh advance function stored in a ref so the 4 s timeout sees latest state
  const advanceRef = useRef<(wasCorrect: boolean) => void>(() => {})
  advanceRef.current = (wasCorrect: boolean) => {
    if (processingRef.current) return
    processingRef.current = true

    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    if (wasCorrect) {
      correctRef.current += 1
      comboRef.current += 1
      setCorrectCount(correctRef.current)
      setFeedback('correct')

      if (comboRef.current >= 3) {
        setComboDisplay(comboRef.current)
        setShowCombo(true)
        if (comboTimerRef.current) clearTimeout(comboTimerRef.current)
        comboTimerRef.current = setTimeout(() => setShowCombo(false), 1200)
      }
    } else {
      comboRef.current = 0
      setFeedback('wrong')
    }

    setTimeout(() => {
      const nextIdx = qIdxRef.current + 1
      if (nextIdx >= total) {
        onComplete(correctRef.current, total)
      } else {
        qIdxRef.current = nextIdx
        setQIdx(nextIdx)
        setFeedback('none')
        processingRef.current = false
      }
    }, 600)
  }

  // Restart the 4 s auto-advance timer on each new question
  useEffect(() => {
    processingRef.current = false
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => advanceRef.current(false), 4000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [qIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current)
    }
  }, [])

  if (total === 0) return null

  const q = questions[qIdx]

  // Card background reacts to feedback
  const cardBg =
    feedback === 'correct' ? '#DCFCE7' :
    feedback === 'wrong'   ? '#FEE2E2' :
    '#FFFFFF'
  const cardBorderColor =
    feedback === 'correct' ? '#22C55E' :
    feedback === 'wrong'   ? '#EF4444' :
    '#EAF0F6'

  // Progress dots — show up to 10, sliding window around current question
  const maxDots = Math.min(total, 10)
  const dotsOffset = total > 10
    ? Math.min(Math.max(qIdx - 4, 0), total - 10)
    : 0

  return (
    <div className="max-w-[520px] mx-auto select-none">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex items-center gap-2 bg-[#FEF3C7] text-[#92400E] font-extrabold text-[12.5px] py-[6px] px-[14px] rounded-[20px]">
          ⚡ Tez juwap
        </div>
        {/* Progress dots */}
        <div className="flex items-center gap-[5px]">
          {Array.from({ length: maxDots }).map((_, i) => {
            const qi = dotsOffset + i
            const isDone = qi < qIdx
            const isCurrent = qi === qIdx
            return (
              <div
                key={i}
                className="rounded-full transition-all duration-200"
                style={{
                  width: isCurrent ? 12 : 8,
                  height: 8,
                  background: isDone ? '#22C55E' : isCurrent ? '#F59E0B' : '#E8EDF3',
                }}
              />
            )
          })}
        </div>
      </div>

      {/* Combo toast */}
      {showCombo && (
        <div className="flex justify-center mb-2">
          <div className="animate-pop bg-[#FEF3C7] text-[#92400E] font-extrabold text-[14px] py-[5px] px-[14px] rounded-[20px]">
            🔥 {comboDisplay}x ketma-ket!
          </div>
        </div>
      )}

      {/* Question card */}
      <div
        className="relative rounded-[26px] overflow-hidden transition-colors duration-200"
        style={{
          background: cardBg,
          border: `2px solid ${cardBorderColor}`,
          boxShadow: '0 10px 30px rgba(15,23,42,.06)',
        }}
      >
        {/* Timer bar — key={qIdx} remounts & restarts the CSS animation each question */}
        <div className="h-[4px] w-full bg-[#F1F5F9] overflow-hidden">
          <div
            key={qIdx}
            style={{
              height: '100%',
              background: 'linear-gradient(to right, #F59E0B, #EF4444)',
              animation: 'shrink 4s linear forwards',
            }}
          />
        </div>

        <div className="p-8 text-center">
          {/* Label */}
          <div className="text-[11px] font-extrabold text-text-softer tracking-[.08em] uppercase mb-3">
            Inglizsha
          </div>

          {/* EN word */}
          <div className="font-display font-extrabold text-[42px] text-text leading-tight mb-5">
            {q.emoji} {q.en}
          </div>

          {/* UZ translation pill */}
          <div
            className="inline-block font-bold text-[22px] py-[8px] px-[20px] rounded-[16px] transition-colors duration-200"
            style={{
              background:
                feedback === 'none' ? '#EFF6FF' :
                feedback === 'correct' ? '#DCFCE7' :
                '#FEE2E2',
              color:
                feedback === 'correct' ? '#15803D' :
                feedback === 'wrong'   ? '#DC2626' :
                '#1D4ED8',
            }}
          >
            {q.uz}
          </div>

          {/* Score tracker */}
          <div className="mt-4 text-[12px] font-bold text-text-softer">
            {correctCount} / {total}
          </div>
        </div>
      </div>

      {/* Answer buttons */}
      <div className="flex gap-4 mt-5 justify-center">
        {/* ✗ — user says FALSE */}
        <button
          onClick={() => advanceRef.current(!q.isTrue)}
          disabled={feedback !== 'none'}
          aria-label="Noto'g'ri"
          className="flex items-center justify-center rounded-full text-white font-extrabold text-[34px]"
          style={{
            width: 100,
            height: 100,
            background: '#EF4444',
            border: 'none',
            boxShadow: '0 4px 0 #DC2626',
            cursor: feedback !== 'none' ? 'default' : 'pointer',
            opacity: feedback !== 'none' ? 0.6 : 1,
            transition: 'opacity 0.15s, transform 0.12s, box-shadow 0.12s',
          }}
        >
          ✗
        </button>

        {/* ✓ — user says TRUE */}
        <button
          onClick={() => advanceRef.current(q.isTrue)}
          disabled={feedback !== 'none'}
          aria-label="To'g'ri"
          className="flex items-center justify-center rounded-full text-white font-extrabold text-[34px]"
          style={{
            width: 100,
            height: 100,
            background: '#22C55E',
            border: 'none',
            boxShadow: '0 4px 0 #16A34A',
            cursor: feedback !== 'none' ? 'default' : 'pointer',
            opacity: feedback !== 'none' ? 0.6 : 1,
            transition: 'opacity 0.15s, transform 0.12s, box-shadow 0.12s',
          }}
        >
          ✓
        </button>
      </div>

      {/* Skip */}
      <div className="mt-4 text-center">
        <button
          onClick={onSkip}
          className="bg-transparent border-none text-[13px] font-bold text-text-softer cursor-pointer hover:text-text-soft transition-colors"
        >
          O&apos;tkazib yuborish
        </button>
      </div>
    </div>
  )
}

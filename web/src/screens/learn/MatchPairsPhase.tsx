import { useState, useRef, useMemo } from 'react'

interface Word {
  id: number
  en: string
  uz: string
  emoji: string
}

interface Props {
  words: Word[]
  onComplete: (correctCount: number, totalCount: number) => void
  onSkip: () => void
}

type CardStatus = 'idle' | 'matched-flash' | 'matched-done' | 'wrong'

interface CardInfo {
  wordId: number
  status: CardStatus
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function MatchPairsPhase({ words, onComplete, onSkip }: Props) {
  const total = words.length

  const [leftCards, setLeftCards] = useState<CardInfo[]>(() =>
    words.map(w => ({ wordId: w.id, status: 'idle' as CardStatus }))
  )
  const [rightCards, setRightCards] = useState<CardInfo[]>(() =>
    shuffle(words.map(w => ({ wordId: w.id, status: 'idle' as CardStatus })))
  )
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null)
  const [selectedRight, setSelectedRight] = useState<number | null>(null)
  const [matchedCount, setMatchedCount] = useState(0)
  const [done, setDone] = useState(false)

  // Refs to avoid stale closures in setTimeout callbacks
  const matchedRef = useRef(0)
  const mistakesRef = useRef(0)

  const wordMap = useMemo(() => {
    const m: Record<number, Word> = {}
    words.forEach(w => { m[w.id] = w })
    return m
  }, [words])

  const attemptMatch = (li: number, ri: number) => {
    setSelectedLeft(null)
    setSelectedRight(null)

    if (leftCards[li].wordId === rightCards[ri].wordId) {
      // Correct match — green flash, then fade out
      setLeftCards(prev => prev.map((c, i) => i === li ? { ...c, status: 'matched-flash' } : c))
      setRightCards(prev => prev.map((c, i) => i === ri ? { ...c, status: 'matched-flash' } : c))

      matchedRef.current += 1
      setMatchedCount(matchedRef.current)
      const isLast = matchedRef.current === total

      setTimeout(() => {
        setLeftCards(prev => prev.map((c, i) => i === li ? { ...c, status: 'matched-done' } : c))
        setRightCards(prev => prev.map((c, i) => i === ri ? { ...c, status: 'matched-done' } : c))
        if (isLast) setDone(true)
      }, 500)

      if (isLast) {
        // Show celebration for 800ms, then call onComplete
        setTimeout(() => {
          onComplete(Math.max(0, total - mistakesRef.current), total)
        }, 1300)
      }
    } else {
      // Wrong match — red shake, then reset
      mistakesRef.current += 1

      setLeftCards(prev => prev.map((c, i) => i === li ? { ...c, status: 'wrong' } : c))
      setRightCards(prev => prev.map((c, i) => i === ri ? { ...c, status: 'wrong' } : c))

      setTimeout(() => {
        setLeftCards(prev => prev.map((c, i) => i === li ? { ...c, status: 'idle' } : c))
        setRightCards(prev => prev.map((c, i) => i === ri ? { ...c, status: 'idle' } : c))
      }, 400)
    }
  }

  const handleTapLeft = (i: number) => {
    if (leftCards[i].status !== 'idle') return
    // Double-tap same card = deselect
    if (selectedLeft === i) { setSelectedLeft(null); return }
    // If a right card is already waiting, attempt the match immediately
    if (selectedRight !== null && rightCards[selectedRight].status === 'idle') {
      attemptMatch(i, selectedRight)
    } else {
      setSelectedLeft(i)
    }
  }

  const handleTapRight = (j: number) => {
    if (rightCards[j].status !== 'idle') return
    if (selectedRight === j) { setSelectedRight(null); return }
    if (selectedLeft !== null && leftCards[selectedLeft].status === 'idle') {
      attemptMatch(selectedLeft, j)
    } else {
      setSelectedRight(j)
    }
  }

  const getCardStyle = (status: CardStatus, isSelected: boolean) => {
    if (status === 'matched-flash') return { bg: '#DCFCE7', border: '#22C55E', color: '#15803D' }
    if (status === 'wrong')        return { bg: '#FEE2E2', border: '#EF4444', color: '#DC2626' }
    if (isSelected)                return { bg: '#EFF6FF', border: '#3B82F6', color: '#1D4ED8' }
    return { bg: '#FFFFFF', border: '#E8EDF3', color: '#0F172A' }
  }

  const renderCard = (card: CardInfo, isLeft: boolean, idx: number) => {
    const key = `${isLeft ? 'l' : 'r'}-${idx}`

    // Matched-done: invisible placeholder preserves layout
    if (card.status === 'matched-done') {
      return (
        <div
          key={key}
          className="min-h-[56px] rounded-[14px]"
          style={{ visibility: 'hidden' }}
          aria-hidden
        />
      )
    }

    const isSelected = isLeft ? selectedLeft === idx : selectedRight === idx
    const style = getCardStyle(card.status, isSelected)
    const word = wordMap[card.wordId]
    const text = isLeft ? word.en : word.uz

    return (
      <button
        key={key}
        onClick={() => isLeft ? handleTapLeft(idx) : handleTapRight(idx)}
        className={`w-full min-h-[56px] border-2 rounded-[14px] py-[13px] px-4 font-display font-bold text-[15px] text-center flex items-center justify-center transition-all duration-200 leading-tight${card.status === 'wrong' ? ' animate-shake' : ''}`}
        style={{
          background: style.bg,
          borderColor: style.border,
          color: style.color,
        }}
      >
        {text}
      </button>
    )
  }

  return (
    <div className="max-w-[520px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex items-center gap-2 bg-[#DCFCE7] text-[#15803D] font-extrabold text-[12.5px] py-[6px] px-[14px] rounded-[20px]">
          So&apos;zlarni juflashtiring
        </div>
        <span className="text-[13px] font-bold text-text-softer tabular-nums">
          {matchedCount}/{total}
        </span>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-[10px] mb-5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="w-[10px] h-[10px] rounded-full transition-all duration-300"
            style={{
              background: i < matchedCount ? '#22C55E' : '#E8EDF3',
              transform: i < matchedCount ? 'scale(1.2)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      {/* Card grid */}
      <div
        className="relative bg-white border border-border-2 rounded-[24px] p-5"
        style={{ boxShadow: '0 8px 26px rgba(15,23,42,.06)' }}
      >
        {/* Celebration overlay shown after all pairs matched */}
        {done && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 rounded-[24px] z-10 animate-pop">
            <div className="text-[64px] leading-none mb-3">🎉</div>
            <div className="font-display font-extrabold text-[28px] text-[#22C55E]">Ajoyib!</div>
          </div>
        )}

        <div className="flex gap-3">
          {/* Left column — English */}
          <div className="flex-1 flex flex-col gap-3">
            {leftCards.map((card, i) => renderCard(card, true, i))}
          </div>
          {/* Right column — Uzbek translations */}
          <div className="flex-1 flex flex-col gap-3">
            {rightCards.map((card, i) => renderCard(card, false, i))}
          </div>
        </div>
      </div>

      {/* Skip */}
      <button
        onClick={onSkip}
        className="w-full mt-4 bg-border-3 text-text-soft border-none rounded-[15px] py-[14px] font-display font-bold text-[15px] cursor-pointer"
      >
        O&apos;tkazib yuborish
      </button>
    </div>
  )
}

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
  onComplete: (correctPairs: number, totalPairs: number) => void
  onSkip: () => void
}

interface Card {
  id: number
  wordId: number
  type: 'en' | 'uz'
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function MemoryFlipPhase({ words, onComplete, onSkip }: Props) {
  const totalPairs = words.length

  const [cards] = useState<Card[]>(() => {
    const pairs: Card[] = []
    words.forEach((w, i) => {
      pairs.push({ id: i * 2,     wordId: w.id, type: 'en' })
      pairs.push({ id: i * 2 + 1, wordId: w.id, type: 'uz' })
    })
    return shuffle(pairs)
  })

  // card ids currently showing face-up (not yet matched), max 2
  const [flipped, setFlipped] = useState<number[]>([])
  // wordIds of successfully matched pairs
  const [matched, setMatched] = useState<Set<number>>(new Set())
  // card ids showing wrong-flash red border
  const [wrongIds, setWrongIds] = useState<number[]>([])
  const [locked, setLocked] = useState(false)
  const [done, setDone] = useState(false)

  const mistakesRef = useRef(0)
  const matchedCountRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  const wordMap = useMemo(() => {
    const m: Record<number, Word> = {}
    words.forEach(w => { m[w.id] = w })
    return m
  }, [words])

  const handleCardTap = (card: Card) => {
    if (locked) return
    if (matched.has(card.wordId)) return
    if (flipped.includes(card.id)) return

    const newFlipped = [...flipped, card.id]

    if (newFlipped.length === 1) {
      setFlipped(newFlipped)
      return
    }

    // Two cards are now face-up — evaluate
    setFlipped(newFlipped)
    setLocked(true)

    const firstCard = cards.find(c => c.id === newFlipped[0])!
    const secondCard = cards.find(c => c.id === newFlipped[1])!

    if (firstCard.wordId === secondCard.wordId) {
      // Correct match
      matchedCountRef.current += 1
      const isLast = matchedCountRef.current === totalPairs

      timerRef.current = setTimeout(() => {
        setMatched(prev => new Set([...prev, firstCard.wordId]))
        setFlipped([])
        setLocked(false)
        if (isLast) {
          setDone(true)
          timerRef.current = setTimeout(() => {
            onComplete(Math.max(0, totalPairs - mistakesRef.current), totalPairs)
          }, 1000)
        }
      }, 600)
    } else {
      // Wrong match
      mistakesRef.current += 1
      setWrongIds(newFlipped)

      timerRef.current = setTimeout(() => {
        setWrongIds([])
        setFlipped([])
        setLocked(false)
      }, 800)
    }
  }

  const matchedCount = matched.size

  return (
    <div className="max-w-[520px] mx-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex items-center gap-2 bg-[#FEF3C7] text-[#92400E] font-extrabold text-[12.5px] py-[6px] px-[14px] rounded-[20px]">
          🃏 Xotira o&apos;yini
        </div>
        <span className="text-[13px] font-bold text-text-softer tabular-nums">
          {matchedCount}/{totalPairs} juwap tapıldı
        </span>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-[10px] mb-5">
        {Array.from({ length: totalPairs }).map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: 10,
              height: 10,
              background: i < matchedCount ? '#22C55E' : '#E8EDF3',
              transform: i < matchedCount ? 'scale(1.2)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      {/* Card grid */}
      <div
        className="relative bg-white border border-border-2 rounded-[24px] p-4"
        style={{ boxShadow: '0 8px 26px rgba(15,23,42,.06)' }}
      >
        {/* Celebration overlay */}
        {done && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 rounded-[24px] z-10 animate-pop">
            <div className="text-[64px] leading-none mb-3">🎉</div>
            <div className="font-display font-extrabold text-[28px] text-[#F59E0B]">Ájayıp!</div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-2">
          {cards.map(card => {
            const word = wordMap[card.wordId]
            const isMatched = matched.has(card.wordId)
            const isFaceUp = isMatched || flipped.includes(card.id)
            const isWrong = wrongIds.includes(card.id)

            const frontBg =
              isMatched ? '#DCFCE7' :
              isWrong   ? '#FEE2E2' :
              card.type === 'en' ? '#FFFFFF' : '#EFF6FF'

            const frontBorder =
              isMatched ? '#22C55E' :
              isWrong   ? '#EF4444' :
              card.type === 'en' ? '#E8EDF3' : '#BFDBFE'

            const textColor =
              isMatched ? '#15803D' :
              isWrong   ? '#DC2626' :
              card.type === 'en' ? '#0F172A' : '#1D4ED8'

            return (
              <button
                key={card.id}
                onClick={() => handleCardTap(card)}
                disabled={isMatched || flipped.includes(card.id) || locked}
                aria-label={isFaceUp ? (card.type === 'en' ? word.en : word.uz) : 'Karta'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: isMatched || locked ? 'default' : 'pointer',
                  aspectRatio: '1',
                  perspective: '600px',
                }}
              >
                {/* 3-D flip wrapper */}
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    transformStyle: 'preserve-3d',
                    transform: isFaceUp ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    transition: 'transform 0.35s ease',
                  }}
                >
                  {/* Back face */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      borderRadius: 14,
                      background: '#FEF3C7',
                      border: '2px solid #FDE68A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 26,
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      color: '#D97706',
                    }}
                  >
                    ?
                  </div>

                  {/* Front face */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      borderRadius: 14,
                      background: frontBg,
                      border: `2px solid ${frontBorder}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px 3px',
                      gap: 2,
                      transition: 'background 0.2s, border-color 0.2s',
                      overflow: 'hidden',
                    }}
                  >
                    {isMatched && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 3,
                          right: 5,
                          fontSize: 10,
                          color: '#22C55E',
                          fontWeight: 800,
                          lineHeight: 1,
                        }}
                      >
                        ✓
                      </div>
                    )}

                    {card.type === 'en' ? (
                      <>
                        <div style={{ fontSize: 20, lineHeight: 1 }}>{word.emoji}</div>
                        <div
                          style={{
                            fontSize: 10,
                            fontFamily: 'var(--font-display)',
                            fontWeight: 700,
                            color: textColor,
                            textAlign: 'center',
                            lineHeight: 1.2,
                            wordBreak: 'break-word',
                            maxWidth: '100%',
                          }}
                        >
                          {word.en}
                        </div>
                      </>
                    ) : (
                      <div
                        style={{
                          fontSize: 10,
                          fontFamily: 'var(--font-display)',
                          fontWeight: 700,
                          color: textColor,
                          textAlign: 'center',
                          lineHeight: 1.2,
                          wordBreak: 'break-word',
                          maxWidth: '100%',
                          padding: '0 2px',
                        }}
                      >
                        {word.uz}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Skip */}
      <div className="mt-4 text-left">
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

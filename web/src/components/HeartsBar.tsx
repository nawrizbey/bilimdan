import { useState, useEffect, useRef } from 'react';

interface Props {
  hearts: number;
  maxHearts: number;
  combo: number;
}

export function HeartsBar({ hearts, maxHearts, combo }: Props) {
  const [shaking, setShaking] = useState(false);
  const prevHeartsRef = useRef(hearts);

  // Shake animation when a heart is lost
  useEffect(() => {
    if (hearts < prevHeartsRef.current) {
      setShaking(true);
      const timer = setTimeout(() => setShaking(false), 400);
      prevHeartsRef.current = hearts;
      return () => clearTimeout(timer);
    }
    prevHeartsRef.current = hearts;
  }, [hearts]);

  return (
    <div className="flex items-center justify-between">
      {/* Hearts row */}
      <div className={`flex items-center gap-[6px] ${shaking ? 'animate-shake' : ''}`}>
        {Array.from({ length: maxHearts }, (_, i) => (
          <span
            key={i}
            className="text-[24px] leading-none select-none"
            style={{
              opacity: i < hearts ? 1 : 0.3,
              filter: i < hearts ? 'none' : 'grayscale(1)',
              transition: 'opacity 0.2s ease, filter 0.2s ease',
            }}
          >
            {i < hearts ? '❤️' : '🖤'}
          </span>
        ))}
      </div>

      {/* Combo badge — only shown when combo >= 2 */}
      {combo >= 2 && (
        <div
          className={`flex items-center gap-1 bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] rounded-[20px] px-3 py-1 text-[13px] font-extrabold select-none ${combo >= 5 ? 'animate-pulse' : ''}`}
        >
          🔥 {combo}x
        </div>
      )}
    </div>
  );
}

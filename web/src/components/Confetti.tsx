import { useState, useEffect } from 'react';

const COLORS = ['#22C55E', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];
const COUNT = 40;

interface Piece {
  id: number;
  left: number;
  color: string;
  delay: number;
  size: number;
  duration: number;
  round: boolean;
}

interface Props {
  active: boolean;
}

export function Confetti({ active }: Props) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!active) return;

    const newPieces: Piece[] = Array.from({ length: COUNT }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 1000,
      size: 6 + Math.random() * 6,
      duration: 2000 + Math.random() * 1000,
      round: Math.random() > 0.5,
    }));

    setPieces(newPieces);

    const maxDuration = Math.max(...newPieces.map((p) => p.delay + p.duration));
    const cleanup = setTimeout(() => setPieces([]), maxDuration + 200);

    return () => clearTimeout(cleanup);
  }, [active]);

  if (pieces.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes confetti-fall {
          from {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 9999,
          overflow: 'hidden',
        }}
      >
        {pieces.map((p) => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              top: 0,
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: p.round ? '50%' : '2px',
              background: p.color,
              animation: `confetti-fall ${p.duration}ms ease-in ${p.delay}ms both`,
            }}
          />
        ))}
      </div>
    </>
  );
}

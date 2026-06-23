interface LogoMarkProps {
  size?: number;
}

export function LogoMark({ size = 42 }: LogoMarkProps) {
  const box = size;
  const icon = Math.round(size * 0.71);
  return (
    <div
      className="flex-none flex items-center justify-center rounded-[13px]"
      style={{
        width: box,
        height: box,
        background: 'linear-gradient(150deg,#22C55E,#16A34A)',
        boxShadow: '0 6px 14px rgba(34,197,94,.35)',
      }}
    >
      <svg viewBox="0 0 120 120" width={icon} height={icon} style={{ display: 'block' }}>
        <ellipse cx="62" cy="84" rx="33" ry="32" fill="#15803D" />
        <ellipse cx="58" cy="50" rx="31" ry="29" fill="#FFFFFF" />
        <path d="M58 18 Q66 8 70 22 Q74 14 76 26 L66 34 Z" fill="#FACC15" />
        <circle cx="50" cy="48" r="13" fill="#FFFFFF" />
        <circle cx="53" cy="50" r="6.5" fill="#0F172A" />
        <circle cx="55.5" cy="48" r="2" fill="#fff" />
        <path d="M76 48 Q96 50 86 66 Q74 64 72 56 Z" fill="#F97316" />
      </svg>
    </div>
  );
}

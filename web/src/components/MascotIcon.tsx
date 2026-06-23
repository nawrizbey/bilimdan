interface MascotIconProps {
  size?: number;
  className?: string;
}

export function MascotIcon({ size = 170, className }: MascotIconProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      style={{ display: 'block', filter: 'drop-shadow(0 12px 18px rgba(0,0,0,.18))' }}
    >
      <ellipse cx="56" cy="116" rx="30" ry="6" fill="#0F172A" opacity="0.12" />
      <ellipse cx="62" cy="84" rx="33" ry="32" fill="#FFFFFF" />
      <path d="M30 70 Q20 92 40 106 Q53 96 50 76 Z" fill="#E2E8F0" />
      <ellipse cx="58" cy="50" rx="31" ry="29" fill="#FFFFFF" />
      <path d="M58 16 Q66 6 70 20 Q74 12 76 24 L66 32 Z" fill="#FACC15" />
      <circle cx="50" cy="48" r="13" fill="#0F172A" />
      <circle cx="50" cy="48" r="11.5" fill="#fff" />
      <circle cx="52" cy="50" r="6.5" fill="#0F172A" />
      <circle cx="54.5" cy="48" r="2.2" fill="#fff" />
      <path d="M76 48 Q98 50 87 67 Q74 65 72 56 Z" fill="#F97316" />
      <ellipse cx="43" cy="63" rx="7" ry="4.5" fill="#FCA5A5" />
    </svg>
  );
}

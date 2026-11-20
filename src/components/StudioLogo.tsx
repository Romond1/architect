interface StudioLogoProps {
  size?: number;
  className?: string;
}

export function StudioLogo({ size = 38, className }: StudioLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="32"
        cy="32"
        r="29"
        fill="var(--accent-blueprint)"
        stroke="var(--accent-gold)"
        strokeWidth="2.5"
      />
      <circle
        cx="32"
        cy="32"
        r="24.5"
        stroke="rgba(255, 253, 249, 0.25)"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      {/* Left & Right rabbit-ear-inspired compass top */}
      <path
        d="M24 23C21.5 14.5 25.5 10.5 28.5 15.5L32 24L35.5 15.5C38.5 10.5 42.5 14.5 40 23"
        stroke="#FFFDF9"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Drafting compass legs */}
      <path
        d="M32 24L19 49"
        stroke="#FFFDF9"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M32 24L45 49"
        stroke="#FFFDF9"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      {/* Crossbar */}
      <path
        d="M23.5 39.5Q32 43 40.5 39.5"
        stroke="var(--accent-gold-bright)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Pivot joint */}
      <circle
        cx="32"
        cy="25"
        r="4"
        fill="var(--accent-gold-bright)"
        stroke="var(--accent-blueprint)"
        strokeWidth="1.5"
      />
    </svg>
  );
}

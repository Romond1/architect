import type { AchievementDefinition } from '../framework/types';

interface AchievementMedalProps {
  visualTheme: AchievementDefinition['visualTheme'];
  unlocked: boolean;
  revealed: boolean;
  size?: number;
}

const PALETTE: Record<
  AchievementDefinition['visualTheme'],
  { outer: string; inner: string; ribbon: string; stroke: string; glow: string }
> = {
  'junior-bronze': {
    outer: '#cd8c52',
    inner: '#f2c89b',
    ribbon: '#26465b',
    stroke: '#7e4d23',
    glow: '#e6b17a',
  },
  'designer-silver': {
    outer: '#c7d2dc',
    inner: '#f2f6fa',
    ribbon: '#3b647d',
    stroke: '#647687',
    glow: '#e2ebf3',
  },
  '3d-gold': {
    outer: '#dfb047',
    inner: '#fff2ba',
    ribbon: '#9d3e2d',
    stroke: '#8a6213',
    glow: '#f6d679',
  },
  'creative-amethyst': {
    outer: '#a676c8',
    inner: '#efe3fb',
    ribbon: '#4b7a62',
    stroke: '#5e397c',
    glow: '#d8bcf2',
  },
  'master-emerald': {
    outer: '#3d9973',
    inner: '#e2faef',
    ribbon: '#c4653f',
    stroke: '#1e5b42',
    glow: '#e8bc5d',
  },
};

export function AchievementMedal({
  visualTheme,
  unlocked,
  revealed,
  size = 86,
}: AchievementMedalProps) {
  const palette = PALETTE[visualTheme];

  if (!revealed || !unlocked) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 96 96"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M34 10H62L57 34H39L34 10Z"
          fill="var(--bg-studio-elevated)"
          stroke="var(--border-strong)"
          strokeWidth="2"
        />
        <circle
          cx="48"
          cy="56"
          r="28"
          fill="var(--bg-surface-muted)"
          stroke="var(--border-strong)"
          strokeWidth="2.5"
          strokeDasharray="4 4"
        />
        <circle
          cx="48"
          cy="56"
          r="21"
          fill="var(--bg-studio-elevated)"
          stroke="var(--border-warm)"
          strokeWidth="1.5"
        />
        {revealed ? (
          <text
            x="48"
            y="62"
            textAnchor="middle"
            fontSize="22"
            fontWeight="700"
            fontFamily="var(--font-display)"
            fill="var(--text-secondary)"
          >
            ?
          </text>
        ) : (
          /* Wax lock icon for sealed future achievements */
          <g fill="none" stroke="var(--text-secondary)" strokeWidth="2.4">
            <rect x="40" y="53" width="16" height="12" rx="3" />
            <path d="M43 53V49C43 46 53 46 53 49V53" />
          </g>
        )}
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      aria-hidden="true"
    >
      {/* Twin Ribbon */}
      <path d="M32 8H48L44 33H36L32 8Z" fill={palette.ribbon} />
      <path d="M48 8H64L60 33H52L48 8Z" fill={palette.ribbon} opacity="0.86" />
      <rect
        x="34"
        y="28"
        width="28"
        height="6"
        rx="3"
        fill="#f5cf7b"
        stroke={palette.stroke}
        strokeWidth="1.4"
      />

      {/* Medal Base */}
      <circle
        cx="48"
        cy="58"
        r="29"
        fill={palette.outer}
        stroke={palette.stroke}
        strokeWidth="2.4"
      />
      <circle
        cx="48"
        cy="58"
        r="23.5"
        fill={palette.inner}
        stroke={palette.glow}
        strokeWidth="2"
      />

      {/* Distinct Theme Emblems */}
      {visualTheme === 'junior-bronze' && (
        <g transform="translate(48, 58)">
          {/* Blueprint sheet + crossed ruler */}
          <rect
            x="-12"
            y="-10"
            width="24"
            height="18"
            rx="2"
            fill="#26465b"
            stroke="#fffdf9"
            strokeWidth="1.2"
          />
          <rect x="-8" y="-6" width="16" height="10" stroke="#9fd0ee" strokeWidth="1.2" />
          <path
            d="M-13 11L13 -11"
            stroke="#cd8c52"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <path
            d="M-13 11L13 -11"
            stroke="#5a3412"
            strokeWidth="1"
            strokeDasharray="2 3"
          />
        </g>
      )}

      {visualTheme === 'designer-silver' && (
        <g transform="translate(48, 58)">
          {/* Architectural doorway & twin windows */}
          <rect x="-13" y="-8" width="26" height="20" rx="2" fill="#e6eef3" stroke="#3b647d" strokeWidth="1.8" />
          <path d="M-5 12V-1C-5 -5 5 -5 5 -1V12Z" fill="#c4653f" stroke="#7e381f" strokeWidth="1.4" />
          <circle cx="2" cy="5" r="1.2" fill="#f6d679" />
          <rect x="-10" y="-4" width="3.5" height="5" fill="#7ab3d8" />
          <rect x="6.5" y="-4" width="3.5" height="5" fill="#7ab3d8" />
        </g>
      )}

      {visualTheme === '3d-gold' && (
        <g transform="translate(48, 58)">
          {/* Isometric 3D cube */}
          <polygon points="0,-14 14,-6 0,2 -14,-6" fill="#fff9de" stroke="#8a6213" strokeWidth="1.6" />
          <polygon points="-14,-6 0,2 0,15 -14,7" fill="#eab94f" stroke="#8a6213" strokeWidth="1.6" />
          <polygon points="14,-6 0,2 0,15 14,7" fill="#c8902e" stroke="#8a6213" strokeWidth="1.6" />
        </g>
      )}

      {visualTheme === 'creative-amethyst' && (
        <g transform="translate(48, 58)">
          {/* Gemstone & sunlight beams */}
          <polygon
            points="0,-14 12,-4 8,12 -8,12 -12,-4"
            fill="#8d55ba"
            stroke="#4d266e"
            strokeWidth="1.6"
          />
          <polygon points="0,-14 6,-4 0,4 -6,-4" fill="#d5b3f4" />
          <path d="M-15 -11L-11 -9M15 -11L11 -9M0 -18V-15" stroke="#e8bc5d" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {visualTheme === 'master-emerald' && (
        <g transform="translate(48, 58)">
          {/* Architectural crest & crown */}
          <polygon
            points="-12,-3 -14,-13 -5,-7 0,-15 5,-7 14,-13 12,-3"
            fill="#e8bc5d"
            stroke="#8a6213"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <polygon
            points="0,-1 11,6 0,15 -11,6"
            fill="#2d8662"
            stroke="#164d36"
            strokeWidth="1.6"
          />
          <polygon points="0,1 6,6 0,11 -6,6" fill="#8ee3bd" />
        </g>
      )}
    </svg>
  );
}

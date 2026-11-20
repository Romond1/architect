import type { ArchitectureWorkspaceProps } from './integration';
import styles from './ArchitectureWorkspace.module.css';

/**
 * Himari's Architectural Workspace Extension Point
 * ------------------------------------------------
 * This component intentionally starts completely empty of architectural tools.
 * During lessons with her teacher and Codex, Himari will progressively build
 * her own 2D drafting tools, wall/opening editors, cost calculators, 3D views,
 * materials, and furniture systems right here — using `bridge` to connect with
 * the customer studio framework.
 */
export function ArchitectureWorkspace({ bridge }: ArchitectureWorkspaceProps) {
  const { activeCommission } = bridge.context;

  return (
    <div className={styles.emptyAtelier} data-testid="architecture-workspace-empty">
      {/* Purely decorative twilight starry-meadow background + soft grid wash */}
      <div className={styles.scenicSky} aria-hidden="true">
        <svg
          viewBox="0 0 1200 760"
          preserveAspectRatio="xMidYMid slice"
          className={styles.scenicSvg}
          role="presentation"
        >
          <defs>
            <radialGradient id="wsMoonGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffe89e" stopOpacity="0.45" />
              <stop offset="45%" stopColor="#f8cf64" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#f8cf64" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="wsAurora" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7fd0f7" stopOpacity="0.16" />
              <stop offset="50%" stopColor="#b594ff" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#74dfb0" stopOpacity="0.14" />
            </linearGradient>
            <linearGradient id="wsHillBack" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1b2b4a" stopOpacity="0.72" />
              <stop offset="100%" stopColor="#111b33" stopOpacity="0.92" />
            </linearGradient>
            <linearGradient id="wsHillFront" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#17243f" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#0d1527" stopOpacity="0.98" />
            </linearGradient>
          </defs>

          {/* Soft aurora ribbon */}
          <path
            d="M-60 220 Q280 90 610 185 T1260 130 L1260 360 Q880 280 560 340 T-60 310 Z"
            fill="url(#wsAurora)"
          />

          {/* Glowing crescent moon */}
          <circle cx="1010" cy="130" r="118" fill="url(#wsMoonGlow)" />
          <path
            d="M1018 82 A44 44 0 1 0 1052 152 A36 36 0 1 1 1018 82 Z"
            fill="#ffe599"
            opacity="0.92"
          />

          {/* Twinkling stars & gentle sparkles */}
          <g fill="#fff5cc" opacity="0.85">
            <circle cx="135" cy="96" r="2.2" />
            <circle cx="240" cy="160" r="1.8" />
            <circle cx="370" cy="82" r="2.5" />
            <circle cx="490" cy="145" r="1.6" />
            <circle cx="670" cy="76" r="2.1" />
            <circle cx="790" cy="168" r="1.9" />
            <circle cx="885" cy="88" r="2.3" />
            <circle cx="1115" cy="215" r="2" />
            <path d="M196 116 L199 107 L202 116 L211 119 L202 122 L199 131 L196 122 L187 119 Z" opacity="0.78" />
            <path d="M740 118 L742.5 111 L745 118 L752 120.5 L745 123 L742.5 130 L740 123 L733 120.5 Z" opacity="0.72" />
          </g>

          {/* Rolling evening hills */}
          <path
            d="M0 610 Q280 520 580 585 T1200 545 L1200 760 L0 760 Z"
            fill="url(#wsHillBack)"
          />
          <path
            d="M0 655 Q340 590 710 645 T1200 620 L1200 760 L0 760 Z"
            fill="url(#wsHillFront)"
          />

          {/* Tiny warm meadow fireflies */}
          <g fill="#ffd972" opacity="0.7">
            <circle cx="165" cy="610" r="3" />
            <circle cx="295" cy="645" r="2.5" />
            <circle cx="940" cy="618" r="3" />
            <circle cx="1075" cy="650" r="2.4" />
          </g>
        </svg>
      </div>

      <div className={styles.blueprintBackdrop} aria-hidden="true" />

      <div className={styles.centerCard}>
        <div className={styles.illustrationWrap} aria-hidden="true">
          <svg
            viewBox="0 0 220 150"
            className={styles.illustration}
            role="presentation"
          >
            {/* Glowing dark blueprint sheet */}
            <rect
              x="24"
              y="22"
              width="158"
              height="104"
              rx="12"
              fill="var(--bg-surface-muted)"
              stroke="var(--border-strong)"
              strokeWidth="2.2"
            />
            <rect
              x="34"
              y="32"
              width="138"
              height="84"
              rx="6"
              fill="var(--bg-blueprint)"
              stroke="var(--border-blueprint)"
              strokeWidth="1.6"
              strokeDasharray="4 4"
            />
            {/* Decorative non-functional blueprint guidelines */}
            <line
              x1="54"
              y1="74"
              x2="152"
              y2="74"
              stroke="var(--accent-blueprint)"
              strokeOpacity="0.45"
              strokeWidth="1.6"
            />
            <line
              x1="103"
              y1="44"
              x2="103"
              y2="104"
              stroke="var(--accent-blueprint)"
              strokeOpacity="0.45"
              strokeWidth="1.6"
            />
            <circle
              cx="103"
              cy="74"
              r="22"
              fill="none"
              stroke="var(--accent-terracotta)"
              strokeOpacity="0.55"
              strokeWidth="1.8"
              strokeDasharray="3 3"
            />
            {/* Bright brass drafting compass */}
            <g transform="translate(128, 16) rotate(14)">
              <circle cx="18" cy="10" r="6" fill="var(--accent-gold)" />
              <rect x="16" y="1" width="4" height="6" rx="1.5" fill="var(--accent-blueprint)" />
              <line
                x1="16"
                y1="14"
                x2="4"
                y2="68"
                stroke="var(--accent-blueprint)"
                strokeWidth="4.2"
                strokeLinecap="round"
              />
              <line
                x1="20"
                y1="14"
                x2="34"
                y2="68"
                stroke="var(--accent-blueprint)"
                strokeWidth="4.2"
                strokeLinecap="round"
              />
              <path
                d="M9 40 Q19 45 29 40"
                fill="none"
                stroke="var(--accent-gold)"
                strokeWidth="2.8"
              />
              <circle cx="34" cy="69" r="2.4" fill="var(--accent-terracotta)" />
            </g>
            {/* Resting golden drafting pencil */}
            <g transform="translate(38, 114) rotate(-9)">
              <rect
                x="0"
                y="0"
                width="84"
                height="8.5"
                rx="2.5"
                fill="var(--accent-gold-bright)"
                stroke="#221f28"
                strokeWidth="1.2"
              />
              <polygon points="84,0 96,4.25 84,8.5" fill="#f7dec0" stroke="#221f28" strokeWidth="1" />
              <polygon points="91,2.6 96,4.25 91,5.9" fill="#1e2a43" />
            </g>
          </svg>
        </div>

        <span className={styles.atelierBadge}>Blank Drafting Table</span>

        <h2 className={styles.headline}>
          Your architecture studio is ready. What will you build first?
        </h2>

        <p className={styles.description}>
          You haven&apos;t created your architectural design tools yet. Work with your
          teacher to develop the tools you need to fulfil your customer&apos;s
          request.
        </p>

        <div className={styles.briefCard}>
          <div className={styles.briefHeader}>
            <span className={styles.briefTag}>
              Current Request &bull; Commission {activeCommission.order}
            </span>
            <span className={styles.briefBudget}>
              Customer Budget: {activeCommission.constructionBudget.toLocaleString()} coins
            </span>
          </div>
          <div className={styles.briefTitle}>{activeCommission.title}</div>
          <p className={styles.briefHint}>
            Study {activeCommission.customerName}&apos;s{' '}
            {activeCommission.requirements.length} requirements on the left, decide
            what software tools to build first, and craft your studio right inside{' '}
            <code>src/workspace/</code>.
          </p>
        </div>
      </div>
    </div>
  );
}

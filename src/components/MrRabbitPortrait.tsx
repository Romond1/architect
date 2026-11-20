import type { RabbitExpression } from '../framework/types';
import styles from './MrRabbitPortrait.module.css';

interface MrRabbitPortraitProps {
  expression: RabbitExpression;
  equippedItemIds: string[];
  reducedMotion?: boolean;
  size?: 'md' | 'lg' | 'sm';
  className?: string;
}

export function MrRabbitPortrait({
  expression,
  equippedItemIds,
  reducedMotion = false,
  size = 'lg',
  className = '',
}: MrRabbitPortraitProps) {
  const hasBowTie = equippedItemIds.includes('rabbit-bow-tie');
  const hasArchitectHat = equippedItemIds.includes('rabbit-architect-hat');
  const hasRoyalCostume = equippedItemIds.includes('royal-rabbit-costume');

  const isCelebrating =
    expression === 'celebrating' || expression === 'extremelyHappy';
  const isHappy =
    isCelebrating || expression === 'greeting' || expression === 'impressed';

  const leftEarRotate =
    expression === 'curious'
      ? -9
      : expression === 'concerned'
        ? -14
        : expression === 'thinking'
          ? -6
          : isCelebrating
            ? -3
            : -2;

  const rightEarRotate =
    expression === 'curious'
      ? 11
      : expression === 'concerned'
        ? 16
        : expression === 'thinking'
          ? 4
          : isCelebrating
            ? 5
            : 2;

  const headTilt =
    expression === 'curious' ? 3 : expression === 'thinking' ? -2.5 : 0;

  return (
    <div
      className={`${styles.portraitFrame} ${styles[size]} ${
        isCelebrating && !reducedMotion ? styles.bounceCelebration : ''
      } ${className}`}
      data-testid="mr-rabbit-portrait"
      data-expression={expression}
      data-equipped={equippedItemIds.join(',')}
      aria-label={`Portrait of Mr. Rabbit looking ${expression}`}
    >
      <svg
        viewBox="0 0 240 240"
        className={styles.svg}
        role="img"
        aria-label={`Mr. Rabbit (${expression})`}
      >
        <defs>
          <radialGradient id="rabbitBgGlow" cx="50%" cy="46%" r="54%">
            <stop offset="0%" stopColor="#fff8e8" stopOpacity="0.98" />
            <stop offset="68%" stopColor="#f0e1cb" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#d9c3a5" stopOpacity="0.98" />
          </radialGradient>
          <linearGradient id="furGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f6ede0" />
            <stop offset="100%" stopColor="#e8d9c4" />
          </linearGradient>
          <linearGradient id="waistcoatGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#56876d" />
            <stop offset="100%" stopColor="#3c6650" />
          </linearGradient>
          <linearGradient id="royalCapeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9e2a3b" />
            <stop offset="100%" stopColor="#6f1926" />
          </linearGradient>
        </defs>

        {/* Portrait Backdrop Medallion */}
        <circle
          cx="120"
          cy="122"
          r="106"
          fill="url(#rabbitBgGlow)"
          stroke="var(--border-strong)"
          strokeWidth="2.5"
        />
        <circle
          cx="120"
          cy="122"
          r="99"
          fill="none"
          stroke="var(--accent-gold)"
          strokeOpacity="0.35"
          strokeWidth="1.2"
          strokeDasharray="4 4"
        />

        {/* Subtle Studio Sparkles for positive / curious states */}
        {(isHappy || expression === 'curious') && (
          <g className={styles.sparkles} fill="var(--accent-gold-bright)">
            <path d="M36 74L39 67L42 74L49 77L42 80L39 87L36 80L29 77Z" opacity="0.85" />
            <path d="M198 66L200.5 60L203 66L209 68.5L203 71L200.5 77L198 71L192 68.5Z" opacity="0.85" />
            {isCelebrating && (
              <>
                <circle cx="52" cy="48" r="3.5" fill="var(--accent-terracotta)" />
                <circle cx="188" cy="46" r="3.5" fill="var(--accent-sage)" />
                <path
                  d="M116 20L118 15L120 20L125 22L120 24L118 29L116 24L111 22Z"
                  fill="var(--accent-gold)"
                />
              </>
            )}
          </g>
        )}

        {/* Royal Cape Back Layer (if Royal Rabbit Costume equipped) */}
        {hasRoyalCostume && (
          <g data-testid="cosmetic-royal-costume">
            <path
              d="M44 218C48 168 74 152 120 152C166 152 192 168 196 218Z"
              fill="url(#royalCapeGrad)"
              stroke="#53101a"
              strokeWidth="2"
            />
            {/* Ermine fur trim */}
            <path
              d="M57 174C74 158 95 154 120 154C145 154 166 158 183 174C178 184 164 187 148 182C132 187 108 187 92 182C76 187 62 184 57 174Z"
              fill="#fffaf0"
              stroke="#d8ccb8"
              strokeWidth="1.5"
            />
            <circle cx="80" cy="171" r="1.8" fill="#3a2c24" />
            <circle cx="104" cy="174" r="1.8" fill="#3a2c24" />
            <circle cx="136" cy="174" r="1.8" fill="#3a2c24" />
            <circle cx="160" cy="171" r="1.8" fill="#3a2c24" />
          </g>
        )}

        {/* Torso & Studio Waistcoat */}
        <g>
          {/* Crisp cream shirt */}
          <path
            d="M72 222C74 176 92 158 120 158C148 158 166 176 168 222Z"
            fill="#fffcf6"
            stroke="#c9baa4"
            strokeWidth="2"
          />
          {/* Sage waistcoat */}
          <path
            d="M72 222C75 180 89 162 106 161L120 186L134 161C151 162 165 180 168 222Z"
            fill={hasRoyalCostume ? 'url(#royalCapeGrad)' : 'url(#waistcoatGrad)'}
            stroke={hasRoyalCostume ? '#58121d' : '#2d4e3d'}
            strokeWidth="2"
          />
          {/* Brass waistcoat buttons */}
          <circle cx="120" cy="196" r="2.7" fill="#e6b85c" stroke="#8f661d" strokeWidth="1" />
          <circle cx="120" cy="210" r="2.7" fill="#e6b85c" stroke="#8f661d" strokeWidth="1" />

          {/* Tiny carrot pocket handkerchief accent */}
          {!hasRoyalCostume && (
            <g transform="translate(141, 187)">
              <polygon points="0,10 12,10 6,0" fill="#e3793b" />
              <path d="M4,1 L2,-3 M6,0 L6,-4 M8,1 L10,-3" stroke="#5ca36c" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          )}

          {/* Royal gold chain clasp */}
          {hasRoyalCostume && (
            <g>
              <path
                d="M90 176Q120 190 150 176"
                fill="none"
                stroke="#e8bc5d"
                strokeWidth="3.2"
              />
              <circle cx="90" cy="176" r="4.5" fill="#e8bc5d" stroke="#8f661d" strokeWidth="1.2" />
              <circle cx="150" cy="176" r="4.5" fill="#e8bc5d" stroke="#8f661d" strokeWidth="1.2" />
              <circle cx="120" cy="183" r="4" fill="#c44052" stroke="#e8bc5d" strokeWidth="1.5" />
            </g>
          )}
        </g>

        {/* Bow Tie Cosmetic */}
        {hasBowTie && (
          <g transform="translate(120, 166)" data-testid="cosmetic-bow-tie">
            <path
              d="M-2 -3L-20 -11C-23 -4 -23 4 -20 11L-2 3Z"
              fill="#c43b46"
              stroke="#7e1e26"
              strokeWidth="1.6"
            />
            <path
              d="M2 -3L20 -11C23 -4 23 4 20 11L2 3Z"
              fill="#c43b46"
              stroke="#7e1e26"
              strokeWidth="1.6"
            />
            <rect
              x="-5"
              y="-5"
              width="10"
              height="10"
              rx="3"
              fill="#df4f5a"
              stroke="#7e1e26"
              strokeWidth="1.5"
            />
            <circle cx="0" cy="0" r="1.8" fill="#f5cf7b" />
          </g>
        )}

        {/* Head & Ears Group (consistent across every expression) */}
        <g transform={`rotate(${headTilt}, 120, 118)`}>
          {/* Left Ear */}
          <g
            transform={`rotate(${leftEarRotate}, 96, 86)`}
            className={styles.earLeft}
          >
            <ellipse
              cx="94"
              cy="52"
              rx="14.5"
              ry="38"
              fill="url(#furGrad)"
              stroke="#b79f83"
              strokeWidth="2"
            />
            <ellipse
              cx="94"
              cy="54"
              rx="8"
              ry="26"
              fill="#f1c5b6"
            />
          </g>

          {/* Right Ear */}
          <g
            transform={`rotate(${rightEarRotate}, 144, 86)`}
            className={styles.earRight}
          >
            <ellipse
              cx="146"
              cy="52"
              rx="14.5"
              ry="38"
              fill="url(#furGrad)"
              stroke="#b79f83"
              strokeWidth="2"
            />
            <ellipse
              cx="146"
              cy="54"
              rx="8"
              ry="26"
              fill="#f1c5b6"
            />
          </g>

          {/* Main Head */}
          <ellipse
            cx="120"
            cy="118"
            rx="44"
            ry="39"
            fill="url(#furGrad)"
            stroke="#b79f83"
            strokeWidth="2.2"
          />
          {/* Soft fluffy cheek tufts */}
          <ellipse cx="83" cy="126" rx="10" ry="8" fill="#efe2d0" />
          <ellipse cx="157" cy="126" rx="10" ry="8" fill="#efe2d0" />
          {/* Cream muzzle */}
          <ellipse cx="120" cy="131" rx="23" ry="16" fill="#fcf7ef" />

          {/* Rosy Cheeks */}
          <ellipse
            cx="90"
            cy="126"
            rx="8.5"
            ry="5"
            fill="#ef9c8e"
            opacity={expression === 'extremelyHappy' ? 0.55 : 0.34}
          />
          <ellipse
            cx="150"
            cy="126"
            rx="8.5"
            ry="5"
            fill="#ef9c8e"
            opacity={expression === 'extremelyHappy' ? 0.55 : 0.34}
          />

          {/* Eyes (varied cleanly by expression) */}
          {expression === 'celebrating' || expression === 'extremelyHappy' ? (
            <g stroke="#2d221c" strokeWidth="3.2" strokeLinecap="round" fill="none">
              <path d="M92 114Q101 103 110 114" />
              <path d="M130 114Q139 103 148 114" />
            </g>
          ) : expression === 'waiting' ? (
            <g>
              <ellipse cx="101" cy="112" rx="6.2" ry="5.5" fill="#2d221c" />
              <ellipse cx="139" cy="112" rx="6.2" ry="5.5" fill="#2d221c" />
              <circle cx="99" cy="110" r="2" fill="#ffffff" />
              <circle cx="137" cy="110" r="2" fill="#ffffff" />
            </g>
          ) : (
            <g>
              <ellipse
                cx="101"
                cy="112"
                rx="6.8"
                ry={expression === 'curious' || expression === 'impressed' ? 8 : 7.2}
                fill="#2d221c"
              />
              <ellipse
                cx="139"
                cy="112"
                rx="6.8"
                ry={expression === 'curious' || expression === 'impressed' ? 8 : 7.2}
                fill="#2d221c"
              />
              {/* Eye highlights */}
              <circle cx="98.5" cy="109" r="2.4" fill="#ffffff" />
              <circle cx="136.5" cy="109" r="2.4" fill="#ffffff" />
              {expression === 'impressed' && (
                <>
                  <circle cx="103" cy="115" r="1.4" fill="#fff6d1" />
                  <circle cx="141" cy="115" r="1.4" fill="#fff6d1" />
                </>
              )}
            </g>
          )}

          {/* Expressive Eyebrows */}
          {expression === 'concerned' && (
            <g stroke="#7a624c" strokeWidth="2.4" strokeLinecap="round">
              <path d="M92 101L108 97" />
              <path d="M148 101L132 97" />
            </g>
          )}
          {expression === 'curious' && (
            <g stroke="#7a624c" strokeWidth="2.3" strokeLinecap="round">
              <path d="M93 99Q101 94 109 98" fill="none" />
              <path d="M132 95Q140 89 148 95" fill="none" />
            </g>
          )}
          {expression === 'thinking' && (
            <g stroke="#7a624c" strokeWidth="2.3" strokeLinecap="round">
              <path d="M93 98L108 98" />
              <path d="M132 95Q140 90 148 94" fill="none" />
            </g>
          )}
          {(expression === 'impressed' || expression === 'greeting') && (
            <g stroke="#7a624c" strokeWidth="2.1" strokeLinecap="round" fill="none">
              <path d="M93 97Q101 92 109 97" />
              <path d="M131 97Q139 92 147 97" />
            </g>
          )}

          {/* Pink Rabbit Nose */}
          <path
            d="M114 123C114 120 126 120 126 123C126 126 122.5 129 120 129C117.5 129 114 126 114 123Z"
            fill="#e48787"
            stroke="#b55d5d"
            strokeWidth="1.2"
          />
          <line x1="120" y1="129" x2="120" y2="134" stroke="#6f5848" strokeWidth="1.8" strokeLinecap="round" />

          {/* Mouth by expression */}
          {expression === 'concerned' ? (
            <path
              d="M112 138Q116 134 120 137Q124 140 128 136"
              fill="none"
              stroke="#6f5848"
              strokeWidth="2"
              strokeLinecap="round"
            />
          ) : expression === 'curious' ? (
            <circle
              cx="120"
              cy="137.5"
              r="3.2"
              fill="#e69e94"
              stroke="#6f5848"
              strokeWidth="1.7"
            />
          ) : expression === 'thinking' ? (
            <path
              d="M113 136Q120 135 126 134"
              fill="none"
              stroke="#6f5848"
              strokeWidth="2"
              strokeLinecap="round"
            />
          ) : isCelebrating || expression === 'impressed' ? (
            <path
              d="M110 134Q120 145 130 134Z"
              fill="#e58c84"
              stroke="#6f5848"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d="M111 134Q115.5 139 120 134Q124.5 139 129 134"
              fill="none"
              stroke="#6f5848"
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}

          {/* Whiskers */}
          <g stroke="#b29a7f" strokeWidth="1.4" strokeLinecap="round">
            <line x1="82" y1="127" x2="101" y2="129" />
            <line x1="80" y1="133" x2="100" y2="133" />
            <line x1="139" y1="129" x2="158" y2="127" />
            <line x1="140" y1="133" x2="160" y2="133" />
          </g>

          {/* Architect Hat Cosmetic */}
          {hasArchitectHat && (
            <g transform="translate(120, 79)" data-testid="cosmetic-architect-hat">
              <path
                d="M-26 3C-28 -12 -10 -19 2 -19C16 -19 28 -11 26 3Z"
                fill="#26465b"
                stroke="#182f3f"
                strokeWidth="1.8"
              />
              <ellipse cx="0" cy="3" rx="27" ry="5.5" fill="#1d3647" stroke="#e8bc5d" strokeWidth="1.4" />
              {/* Tiny golden compass emblem */}
              <circle cx="8" cy="-7" r="4.5" fill="#e8bc5d" stroke="#182f3f" strokeWidth="1" />
              <path d="M8 -10L6 -5M8 -10L10 -5" stroke="#182f3f" strokeWidth="1.2" strokeLinecap="round" />
            </g>
          )}

          {/* Miniature Royal Crown (positioned neatly on top if Royal Costume is equipped) */}
          {hasRoyalCostume && (
            <g
              transform={hasArchitectHat ? 'translate(120, 56) scale(0.75)' : 'translate(120, 74)'}
              data-testid="cosmetic-royal-crown"
            >
              <polygon
                points="-16,6 -18,-8 -7,-1 0,-11 7,-1 18,-8 16,6"
                fill="#e8bc5d"
                stroke="#8c5f14"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <circle cx="0" cy="-2" r="2.2" fill="#c43b46" />
              <circle cx="-10" cy="1" r="1.7" fill="#3a8b74" />
              <circle cx="10" cy="1" r="1.7" fill="#3a8b74" />
            </g>
          )}
        </g>

        {/* Expressive Paws Overlay */}
        {expression === 'greeting' && (
          <g transform="translate(65, 160) rotate(-18)">
            <ellipse cx="0" cy="0" rx="11" ry="14" fill="url(#furGrad)" stroke="#b79f83" strokeWidth="1.8" />
            <ellipse cx="0" cy="-2" rx="5" ry="6" fill="#f1c5b6" />
          </g>
        )}

        {expression === 'thinking' && (
          <g transform="translate(137, 152) rotate(12)">
            <ellipse cx="0" cy="0" rx="10" ry="13" fill="url(#furGrad)" stroke="#b79f83" strokeWidth="1.8" />
          </g>
        )}

        {isCelebrating && (
          <>
            <g transform="translate(62, 155) rotate(-25)">
              <ellipse cx="0" cy="0" rx="10.5" ry="13.5" fill="url(#furGrad)" stroke="#b79f83" strokeWidth="1.8" />
              <ellipse cx="0" cy="-2" rx="4.5" ry="5.5" fill="#f1c5b6" />
            </g>
            <g transform="translate(178, 155) rotate(25)">
              <ellipse cx="0" cy="0" rx="10.5" ry="13.5" fill="url(#furGrad)" stroke="#b79f83" strokeWidth="1.8" />
              <ellipse cx="0" cy="-2" rx="4.5" ry="5.5" fill="#f1c5b6" />
            </g>
          </>
        )}

        {/* Curious small question mark accent */}
        {expression === 'curious' && (
          <text
            x="184"
            y="84"
            fontFamily="var(--font-display)"
            fontSize="24"
            fontWeight="700"
            fill="var(--accent-terracotta)"
          >
            ?
          </text>
        )}
      </svg>
    </div>
  );
}

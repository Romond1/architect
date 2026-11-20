interface ShopItemArtworkProps {
  itemId: string;
  size?: number;
}

export function ShopItemArtwork({ itemId, size = 84 }: ShopItemArtworkProps) {
  switch (itemId) {
    case 'rabbit-bow-tie':
      return (
        <svg width={size} height={size} viewBox="0 0 96 96" aria-hidden="true">
          <circle cx="48" cy="48" r="40" fill="#fbf2de" stroke="#e5c687" strokeWidth="2" />
          <g transform="translate(48, 50)">
            <path d="M-3 -5L-28 -16C-32 -5 -32 5 -28 16L-3 5Z" fill="#c43b46" stroke="#7e1e26" strokeWidth="2" />
            <path d="M3 -5L28 -16C32 -5 32 5 28 16L3 5Z" fill="#c43b46" stroke="#7e1e26" strokeWidth="2" />
            <rect x="-7" y="-7" width="14" height="14" rx="4" fill="#df4f5a" stroke="#7e1e26" strokeWidth="2" />
            <circle cx="0" cy="0" r="2.5" fill="#f5cf7b" />
          </g>
        </svg>
      );

    case 'golden-architect-pencil':
      return (
        <svg width={size} height={size} viewBox="0 0 96 96" aria-hidden="true">
          <circle cx="48" cy="48" r="40" fill="#fbf2de" stroke="#e5c687" strokeWidth="2" />
          <g transform="translate(48, 48) rotate(-38)">
            <rect x="-26" y="-6" width="44" height="12" rx="2" fill="#e8bc5d" stroke="#8a6213" strokeWidth="2" />
            <rect x="-32" y="-6" width="7" height="12" rx="2" fill="#e08982" stroke="#8a6213" strokeWidth="1.6" />
            <polygon points="18,-6 32,0 18,6" fill="#f7dec0" stroke="#8a6213" strokeWidth="1.6" />
            <polygon points="27,-2 32,0 27,2" fill="#26465b" />
          </g>
        </svg>
      );

    case 'rabbit-architect-hat':
      return (
        <svg width={size} height={size} viewBox="0 0 96 96" aria-hidden="true">
          <circle cx="48" cy="48" r="40" fill="#e6eef3" stroke="#c3d3dc" strokeWidth="2" />
          <g transform="translate(48, 52)">
            <path d="M-28 4C-30 -14 -10 -22 2 -22C18 -22 30 -12 28 4Z" fill="#26465b" stroke="#182f3f" strokeWidth="2" />
            <ellipse cx="0" cy="4" rx="29" ry="6" fill="#1d3647" stroke="#e8bc5d" strokeWidth="1.8" />
            <circle cx="10" cy="-7" r="5" fill="#e8bc5d" stroke="#182f3f" strokeWidth="1.2" />
          </g>
        </svg>
      );

    case 'bronze-studio-trophy':
      return (
        <svg width={size} height={size} viewBox="0 0 96 96" aria-hidden="true">
          <circle cx="48" cy="48" r="40" fill="#faece5" stroke="#dfb9a4" strokeWidth="2" />
          <g transform="translate(48, 50)">
            <path d="M-16 -20H16L12 4C10 12 -10 12 -12 4Z" fill="#cd8c52" stroke="#7e4d23" strokeWidth="2" />
            <path d="M-16 -15C-24 -15 -24 -2 -14 0" fill="none" stroke="#7e4d23" strokeWidth="2.5" />
            <path d="M16 -15C24 -15 24 -2 14 0" fill="none" stroke="#7e4d23" strokeWidth="2.5" />
            <rect x="-4" y="9" width="8" height="10" fill="#b7773f" stroke="#7e4d23" strokeWidth="1.6" />
            <rect x="-14" y="19" width="28" height="7" rx="2" fill="#5e3d24" />
          </g>
        </svg>
      );

    case 'starry-studio-theme':
      return (
        <svg width={size} height={size} viewBox="0 0 96 96" aria-hidden="true">
          <circle cx="48" cy="48" r="40" fill="#0d0c24" stroke="#ffd972" strokeWidth="2.5" />
          <circle cx="30" cy="34" r="2.8" fill="#ffd972" />
          <circle cx="64" cy="29" r="2.2" fill="#ffd972" />
          <circle cx="67" cy="60" r="2.5" fill="#c7a8ff" />
          <path d="M48 26L51.5 36L62 39.5L51.5 43L48 53L44.5 43L34 39.5L44.5 36Z" fill="#ffd972" />
          <rect x="26" y="58" width="44" height="14" rx="4" fill="#19173b" stroke="#c7a8ff" strokeWidth="1.5" />
        </svg>
      );

    case 'elegant-studio-theme':
      return (
        <svg width={size} height={size} viewBox="0 0 96 96" aria-hidden="true">
          <circle cx="48" cy="48" r="40" fill="#0c1b17" stroke="#f2c96d" strokeWidth="2.5" />
          <rect x="22" y="24" width="52" height="48" rx="8" fill="#142a24" stroke="#b89550" strokeWidth="2" />
          <rect x="28" y="31" width="40" height="12" rx="4" fill="#f2c96d" />
          <rect x="28" y="48" width="18" height="16" rx="4" fill="#1b362f" stroke="#8ad4c0" strokeWidth="1.5" />
          <rect x="50" y="48" width="18" height="16" rx="4" fill="#1b362f" stroke="#f2c96d" strokeWidth="1.5" />
        </svg>
      );

    case 'royal-rabbit-costume':
      return (
        <svg width={size} height={size} viewBox="0 0 96 96" aria-hidden="true">
          <circle cx="48" cy="48" r="40" fill="#faece5" stroke="#c43b46" strokeWidth="2" />
          <g transform="translate(48, 52)">
            <path d="M-24 20L-18 -8L18 -8L24 20Z" fill="#9e2a3b" stroke="#53101a" strokeWidth="2" />
            <path d="M-19 -6C-10 -12 10 -12 19 -6L16 2C8 -1 -8 -1 -16 2Z" fill="#fffaf0" stroke="#d8ccb8" strokeWidth="1.5" />
            <polygon points="-14,-15 -16,-28 -6,-21 0,-30 6,-21 16,-28 14,-15" fill="#e8bc5d" stroke="#8c5f14" strokeWidth="1.6" />
          </g>
        </svg>
      );

    case 'golden-architect-trophy':
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 96 96" aria-hidden="true">
          <circle cx="48" cy="48" r="40" fill="#fbf2de" stroke="#c8902e" strokeWidth="2.4" />
          <g transform="translate(48, 50)">
            <path d="M-18 -22H18L13 5C10 14 -10 14 -13 5Z" fill="#e8bc5d" stroke="#8a6213" strokeWidth="2" />
            <path d="M-18 -17C-27 -17 -27 -2 -15 0" fill="none" stroke="#8a6213" strokeWidth="2.5" />
            <path d="M18 -17C27 -17 27 -2 15 0" fill="none" stroke="#8a6213" strokeWidth="2.5" />
            <polygon points="0,-16 3,-9 10,-9 4.5,-5 6.5,2 0,-2 -6.5,2 -4.5,-5 -10,-9 -3,-9" fill="#fff9de" />
            <rect x="-5" y="10" width="10" height="10" fill="#c8902e" stroke="#8a6213" strokeWidth="1.6" />
            <rect x="-15" y="20" width="30" height="7" rx="2" fill="#26465b" />
          </g>
        </svg>
      );
  }
}

import styles from './ConfettiOverlay.module.css';

interface ConfettiOverlayProps {
  reducedMotion: boolean;
  isGrandFinale?: boolean;
}

const PIECES = Array.from({ length: 28 }, (_, idx) => ({
  id: idx,
  left: `${(idx * 3.7 + 4) % 96}%`,
  delay: `${(idx % 7) * 110}ms`,
  duration: `${2200 + (idx % 5) * 320}ms`,
  color: ['#c4653f', '#e8bc5d', '#4b7a62', '#26465b', '#d98494'][idx % 5],
}));

export function ConfettiOverlay({
  reducedMotion,
  isGrandFinale = false,
}: ConfettiOverlayProps) {
  if (reducedMotion) {
    return null;
  }

  const activePieces = isGrandFinale ? PIECES : PIECES.slice(0, 18);

  return (
    <div className={styles.overlay} aria-hidden="true">
      {activePieces.map((piece) => (
        <span
          key={piece.id}
          className={styles.piece}
          style={{
            left: piece.left,
            backgroundColor: piece.color,
            animationDelay: piece.delay,
            animationDuration: piece.duration,
          }}
        />
      ))}
    </div>
  );
}

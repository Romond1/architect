import { useEffect, useState } from 'react';
import styles from './SpeechBubble.module.css';

interface SpeechBubbleProps {
  speaker: string;
  text: string;
  reducedMotion?: boolean;
  tone?: 'default' | 'revision' | 'celebration';
}

export function SpeechBubble({
  speaker,
  text,
  reducedMotion = false,
  tone = 'default',
}: SpeechBubbleProps) {
  const [visibleChars, setVisibleChars] = useState(
    reducedMotion ? text.length : 0
  );

  useEffect(() => {
    if (reducedMotion) {
      setVisibleChars(text.length);
      return;
    }

    setVisibleChars(Math.min(18, text.length));
    const interval = window.setInterval(() => {
      setVisibleChars((prev) => {
        if (prev >= text.length) {
          window.clearInterval(interval);
          return prev;
        }
        return Math.min(text.length, prev + 3);
      });
    }, 24);

    return () => window.clearInterval(interval);
  }, [text, reducedMotion]);

  const isComplete = visibleChars >= text.length;
  const displayed = isComplete ? text : text.slice(0, visibleChars);

  return (
    <div
      className={`${styles.bubble} ${styles[tone]}`}
      onClick={() => {
        if (!isComplete) {
          setVisibleChars(text.length);
        }
      }}
      title={!isComplete ? 'Click to show full message' : undefined}
      data-testid="customer-speech-bubble"
    >
      <div className={styles.tail} aria-hidden="true" />
      <div className={styles.speakerLabel}>{speaker} says:</div>
      <p className={styles.quote}>
        &ldquo;{displayed}
        {!isComplete && <span className={styles.cursor} aria-hidden="true" />}
        &rdquo;
      </p>
    </div>
  );
}

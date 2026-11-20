import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { PortfolioEntry } from '../framework/types';
import modalStyles from './Modal.module.css';

interface PortfolioPresentationModalProps {
  entries: PortfolioEntry[];
  artifacts: Record<string, string>;
  initialIndex: number;
  onClose: () => void;
}

export function PortfolioPresentationModal({
  entries,
  artifacts,
  initialIndex,
  onClose,
}: PortfolioPresentationModalProps) {
  const [index, setIndex] = useState(
    Math.max(0, Math.min(initialIndex, entries.length - 1))
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        setIndex((i) => Math.min(entries.length - 1, i + 1));
      } else if (e.key === 'ArrowLeft') {
        setIndex((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [entries.length, onClose]);

  const entry = entries[index];
  if (!entry) {
    return null;
  }

  const imgUrl = artifacts[entry.imageArtifactId];

  return (
    <div
      className={modalStyles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Portfolio Presentation Mode"
      data-testid="portfolio-presentation-modal"
    >
      <div className={`${modalStyles.dialog} ${modalStyles.dialogWide}`}>
        <div className={modalStyles.dialogHeader}>
          <div>
            <span className={modalStyles.dialogEyebrow}>
              Presentation Slide {index + 1} of {entries.length} &bull; Commission{' '}
              {entry.commissionOrder}
            </span>
            <h2 className={modalStyles.dialogTitle}>{entry.projectTitle}</h2>
          </div>
          <button
            type="button"
            className={modalStyles.closeBtn}
            onClick={onClose}
            aria-label="Exit presentation mode"
          >
            <X size={18} />
          </button>
        </div>

        <div className={modalStyles.dialogBody}>
          <div
            style={{
              background: 'var(--bg-blueprint)',
              border: '1.5px solid var(--border-blueprint)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            {imgUrl ? (
              <img
                src={imgUrl}
                alt={entry.projectTitle}
                style={{
                  maxHeight: '360px',
                  width: '100%',
                  objectFit: 'contain',
                  borderRadius: '8px',
                }}
              />
            ) : (
              <div style={{ padding: '48px', color: 'var(--text-muted)' }}>
                Image preview unavailable
              </div>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.14rem', marginBottom: '8px' }}>
                Commission Snapshot: {entry.commissionTitle}
              </h3>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '1rem', lineHeight: 1.58 }}>
                {entry.requirementsSnapshot.map((r) => (
                  <li key={r.id}>{r.text}</li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '1.02rem', lineHeight: 1.52 }}>
              <div>
                <strong>Customer:</strong> {entry.customerName}
              </div>
              <div>
                <strong>Completed:</strong>{' '}
                {new Date(entry.completedAt).toLocaleDateString()}
              </div>
              <div>
                <strong>Construction Budget:</strong>{' '}
                {entry.reportedCostSnapshot !== null
                  ? `${entry.reportedCostSnapshot.toLocaleString()} / ${entry.constructionBudgetSnapshot.toLocaleString()} coins`
                  : `${entry.constructionBudgetSnapshot.toLocaleString()} coins`}
              </div>
              <div>
                <strong>Payment Earned:</strong> +{entry.paymentReceived.toLocaleString()} coins
              </div>
              {entry.studentNotes && (
                <div>
                  <strong>Architect&apos;s Notes:</strong> {entry.studentNotes}
                </div>
              )}
              <blockquote
                style={{
                  margin: '4px 0 0',
                  padding: '10px 12px',
                  background: 'var(--bg-surface-muted)',
                  borderLeft: '3.5px solid var(--accent-terracotta)',
                  borderRadius: '6px',
                  fontStyle: 'italic',
                }}
              >
                &ldquo;{entry.customerFeedback}&rdquo;
              </blockquote>
            </div>
          </div>
        </div>

        <div className={modalStyles.dialogFooter}>
          <button
            type="button"
            className={modalStyles.secondaryBtn}
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </button>
          <button
            type="button"
            className={modalStyles.secondaryBtn}
            disabled={index >= entries.length - 1}
            onClick={() => setIndex((i) => Math.min(entries.length - 1, i + 1))}
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            className={modalStyles.primaryBtn}
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

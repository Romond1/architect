import { useState } from 'react';
import { BookOpen, Download, FileCode2, Presentation } from 'lucide-react';
import {
  buildPortfolioHtmlExport,
  buildPortfolioJsonExport,
} from '../framework/portfolio/portfolioService';
import type { PortfolioEntry } from '../framework/types';
import styles from './GalleryView.module.css';
import { PortfolioPresentationModal } from './PortfolioPresentationModal';

interface PortfolioViewProps {
  entries: PortfolioEntry[];
  artifacts: Record<string, string>;
  studioTitle: string;
  architectRank: string;
  onBackToStudio: () => void;
}

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function PortfolioView({
  entries,
  artifacts,
  studioTitle,
  architectRank,
  onBackToStudio,
}: PortfolioViewProps) {
  const [presentationIndex, setPresentationIndex] = useState<number | null>(
    null
  );
  const chronological = [...entries].sort(
    (a, b) => a.commissionOrder - b.commissionOrder
  );

  const handleExportHtml = () => {
    const html = buildPortfolioHtmlExport(
      chronological,
      artifacts,
      studioTitle,
      architectRank
    );
    downloadTextFile(
      'himari-architecture-portfolio.html',
      html,
      'text/html;charset=utf-8'
    );
  };

  const handleExportJson = () => {
    const json = buildPortfolioJsonExport(
      chronological,
      artifacts,
      studioTitle,
      architectRank
    );
    downloadTextFile(
      'himari-architecture-portfolio.json',
      json,
      'application/json;charset=utf-8'
    );
  };

  return (
    <div className={styles.pageWrap} data-testid="portfolio-view">
      <div className={styles.heroCard}>
        <div>
          <h2 className={styles.heroTitle}>Architect&apos;s Portfolio</h2>
          <p className={styles.heroSub}>
            A permanent chronological showcase of every approved commission —
            capturing your design snapshots, requirements, budgets, and customer
            praise exactly as delivered.
          </p>
        </div>
        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={chronological.length === 0}
            onClick={() => setPresentationIndex(0)}
            data-testid="open-presentation-mode-btn"
          >
            <Presentation size={16} />
            <span>Presentation Mode</span>
          </button>
          <button
            type="button"
            className={styles.secondaryBtn}
            disabled={chronological.length === 0}
            onClick={handleExportHtml}
            data-testid="export-portfolio-html-btn"
          >
            <Download size={16} />
            <span>Export HTML</span>
          </button>
          <button
            type="button"
            className={styles.secondaryBtn}
            disabled={chronological.length === 0}
            onClick={handleExportJson}
            data-testid="export-portfolio-json-btn"
          >
            <FileCode2 size={16} />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {chronological.length === 0 ? (
        <div className={styles.emptyCard} data-testid="portfolio-empty-state">
          <BookOpen size={34} color="var(--accent-blueprint)" />
          <h3>Your portfolio awaits its very first project</h3>
          <p style={{ maxWidth: '46ch' }}>
            When Mr. Rabbit and your teacher approve your first delivered
            design, it will be preserved here as a permanent milestone.
          </p>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={onBackToStudio}
          >
            Return to Studio
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {chronological.map((entry, idx) => {
            const imgUrl = artifacts[entry.imageArtifactId];
            return (
              <article
                key={entry.id}
                className={styles.card}
                data-testid={`portfolio-entry-${entry.commissionOrder}`}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '8px',
                    alignItems: 'center',
                  }}
                >
                  <span className={styles.badge}>
                    Commission {entry.commissionOrder}
                  </span>
                  <span
                    style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}
                  >
                    {new Date(entry.completedAt).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.26rem' }}>{entry.projectTitle}</h3>
                  <div
                    style={{
                      fontSize: '0.96rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {entry.commissionTitle} &bull; For {entry.customerName}
                  </div>
                </div>

                <div className={styles.previewFrame}>
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={entry.projectTitle}
                      className={styles.previewImg}
                    />
                  ) : (
                    <span
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: '0.95rem',
                      }}
                    >
                      No image snapshot stored
                    </span>
                  )}
                </div>

                <div className={styles.badgeRow}>
                  {entry.achievementTitle && (
                    <span className={`${styles.badge} ${styles.badgeGold}`}>
                      {entry.achievementTitle}
                    </span>
                  )}
                  <span className={`${styles.badge} ${styles.badgeSage}`}>
                    +{entry.paymentReceived.toLocaleString()} coins earned
                  </span>
                  <span className={styles.badge}>
                    Cost:{' '}
                    {entry.reportedCostSnapshot !== null
                      ? `${entry.reportedCostSnapshot.toLocaleString()} / ${entry.constructionBudgetSnapshot.toLocaleString()}`
                      : `Budget ${entry.constructionBudgetSnapshot.toLocaleString()}`}
                  </span>
                </div>

                <ul className={styles.reqDetails}>
                  {entry.requirementsSnapshot.slice(0, 4).map((req) => (
                    <li key={req.id}>{req.text}</li>
                  ))}
                  {entry.requirementsSnapshot.length > 4 && (
                    <li>
                      +{entry.requirementsSnapshot.length - 4} more requirements
                    </li>
                  )}
                </ul>

                {entry.studentNotes && (
                  <p
                    style={{
                      fontSize: '0.95rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <strong>Notes:</strong> {entry.studentNotes}
                  </p>
                )}

                <blockquote className={styles.quoteBox}>
                  &ldquo;{entry.customerFeedback}&rdquo;
                </blockquote>
                {entry.previousApprovals?.length ? (
                  <details>
                    <summary>
                      Earlier approved versions (
                      {entry.previousApprovals.length})
                    </summary>
                    {entry.previousApprovals.map((previous) => (
                      <section key={previous.id}>
                        <h4>{previous.projectTitle}</h4>
                        <p>
                          {new Date(previous.completedAt).toLocaleDateString()}{' '}
                          · Cost:{' '}
                          {previous.reportedCostSnapshot ?? 'Not reported'} /{' '}
                          {previous.constructionBudgetSnapshot} coins
                        </p>
                        {artifacts[previous.imageArtifactId] && (
                          <img
                            className={styles.previewImg}
                            src={artifacts[previous.imageArtifactId]}
                            alt={previous.projectTitle}
                          />
                        )}
                        <ul>
                          {previous.requirementsSnapshot.map((req) => (
                            <li key={req.id}>{req.text}</li>
                          ))}
                        </ul>
                        <p>{previous.studentNotes}</p>
                        <blockquote className={styles.quoteBox}>
                          {previous.customerFeedback}
                        </blockquote>
                      </section>
                    ))}
                  </details>
                ) : null}

                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setPresentationIndex(idx)}
                >
                  <Presentation size={15} />
                  <span>Inspect Slide</span>
                </button>
              </article>
            );
          })}
        </div>
      )}

      {presentationIndex !== null && (
        <PortfolioPresentationModal
          entries={chronological}
          artifacts={artifacts}
          initialIndex={presentationIndex}
          onClose={() => setPresentationIndex(null)}
        />
      )}
    </div>
  );
}

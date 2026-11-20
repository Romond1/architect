import type { PortfolioEntry } from '../types';

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export interface PortfolioExportPayload {
  format: 'himari-architecture-portfolio-v1';
  exportedAt: string;
  studioTitle: string;
  architectRank: string;
  entries: Array<
    PortfolioEntry & {
      imageDataUrl: string | null;
    }
  >;
}

export function buildPortfolioJsonExport(
  entries: PortfolioEntry[],
  artifacts: Record<string, string>,
  studioTitle: string,
  architectRank: string
): string {
  const payload: PortfolioExportPayload = {
    format: 'himari-architecture-portfolio-v1',
    exportedAt: new Date().toISOString(),
    studioTitle,
    architectRank,
    entries: entries.map((entry) => ({
      ...entry,
      imageDataUrl: artifacts[entry.imageArtifactId] ?? null,
    })),
  };
  return JSON.stringify(payload, null, 2);
}

export function buildPortfolioHtmlExport(
  entries: PortfolioEntry[],
  artifacts: Record<string, string>,
  studioTitle: string,
  architectRank: string
): string {
  const exportedDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const cardsHtml = entries
    .map((entry) => {
      const imageUrl = artifacts[entry.imageArtifactId];
      const reqList = entry.requirementsSnapshot
        .map((r) => `<li>${escapeHtml(r.text)}</li>`)
        .join('');
      const dimList = entry.dimensionsSnapshot
        .map(
          (d) =>
            `<span class="chip">${escapeHtml(d.label)}: ${escapeHtml(d.value)}</span>`
        )
        .join('');
      const costText =
        entry.reportedCostSnapshot !== null
          ? `${entry.reportedCostSnapshot.toLocaleString()} / ${entry.constructionBudgetSnapshot.toLocaleString()} coins`
          : `Budget: ${entry.constructionBudgetSnapshot.toLocaleString()} coins`;

      return `
      <article class="card">
        <div class="card-header">
          <div>
            <div class="eyebrow">Commission ${entry.commissionOrder} &bull; ${escapeHtml(entry.customerName)}</div>
            <h2>${escapeHtml(entry.projectTitle)}</h2>
            <div class="subtitle">${escapeHtml(entry.commissionTitle)}</div>
          </div>
          <div class="meta-badges">
            ${entry.achievementTitle ? `<span class="badge gold">${escapeHtml(entry.achievementTitle)}</span>` : ''}
            <span class="badge">${escapeHtml(new Date(entry.completedAt).toLocaleDateString())}</span>
          </div>
        </div>
        ${
          imageUrl
            ? `<div class="preview"><img src="${imageUrl}" alt="${escapeHtml(entry.projectTitle)}" /></div>`
            : `<div class="preview empty">No image artifact attached</div>`
        }
        <div class="details-grid">
          <section>
            <h3>Customer Requirements</h3>
            ${dimList ? `<div class="chips">${dimList}</div>` : ''}
            <ul>${reqList}</ul>
          </section>
          <section>
            <h3>Studio Summary</h3>
            <p><strong>Construction Cost:</strong> ${escapeHtml(costText)}</p>
            <p><strong>Architect Payment:</strong> +${entry.paymentReceived.toLocaleString()} coins</p>
            ${
              entry.studentNotes
                ? `<p><strong>Architect's Notes:</strong> ${escapeHtml(entry.studentNotes)}</p>`
                : ''
            }
            <blockquote>"${escapeHtml(entry.customerFeedback)}"<br/><cite>&mdash; ${escapeHtml(entry.customerName)}</cite></blockquote>
          </section>
        </div>
      </article>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(studioTitle)} — Architect Portfolio</title>
  <style>
    body { margin: 0; font-family: 'Segoe UI', -apple-system, sans-serif; background: #f4efe6; color: #2d2621; line-height: 1.55; padding: 36px 20px; }
    .container { max-width: 960px; margin: 0 auto; }
    header { background: #fffdf9; border: 1px solid #e4d8c7; border-radius: 20px; padding: 28px 32px; margin-bottom: 28px; box-shadow: 0 8px 24px rgba(45,38,33,0.06); }
    header h1 { margin: 0 0 6px; font-family: Georgia, serif; font-size: 2rem; color: #26465b; }
    header p { margin: 0; color: #5d5249; }
    .card { background: #fffdf9; border: 1px solid #e4d8c7; border-radius: 20px; padding: 26px 28px; margin-bottom: 24px; box-shadow: 0 8px 24px rgba(45,38,33,0.06); break-inside: avoid; }
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; margin-bottom: 18px; }
    .eyebrow { font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #c4653f; }
    .card-header h2 { margin: 4px 0 2px; font-family: Georgia, serif; font-size: 1.5rem; }
    .subtitle { color: #5d5249; font-size: 0.95rem; }
    .meta-badges { display: flex; gap: 8px; flex-wrap: wrap; }
    .badge { padding: 5px 12px; border-radius: 999px; font-size: 0.82rem; font-weight: 600; background: #e6eef3; color: #26465b; }
    .badge.gold { background: #fbf2de; color: #8c5c10; border: 1px solid #e5c687; }
    .preview { background: #f1f5f7; border: 1px solid #c3d3dc; border-radius: 14px; padding: 14px; text-align: center; margin-bottom: 18px; }
    .preview img { max-width: 100%; max-height: 440px; border-radius: 8px; margin: 0 auto; object-fit: contain; }
    .preview.empty { color: #84776c; padding: 36px; }
    .details-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; }
    h3 { margin: 0 0 8px; font-size: 0.92rem; text-transform: uppercase; letter-spacing: 0.06em; color: #26465b; }
    .chips { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
    .chip { background: #f8f4ec; border: 1px solid #e4d8c7; border-radius: 8px; padding: 3px 9px; font-size: 0.85rem; }
    ul { margin: 0; padding-left: 18px; color: #473d36; }
    blockquote { margin: 12px 0 0; padding: 12px 16px; background: #f8f4ec; border-left: 4px solid #c4653f; border-radius: 8px; font-style: italic; }
    cite { display: block; margin-top: 6px; font-style: normal; font-weight: 600; color: #5d5249; font-size: 0.9rem; }
    @media print { body { background: #fff; padding: 0; } .card, header { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${escapeHtml(studioTitle)}</h1>
      <p>Architect Portfolio &bull; Current Rank: <strong>${escapeHtml(architectRank)}</strong> &bull; ${entries.length} Completed Commission${entries.length === 1 ? '' : 's'} &bull; Exported ${escapeHtml(exportedDate)}</p>
    </header>
    ${cardsHtml || '<p>No completed commissions in portfolio yet.</p>'}
  </div>
</body>
</html>`;
}

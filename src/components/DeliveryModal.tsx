import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Send, Trash2, X } from 'lucide-react';
import { calculateBudgetSummary } from '../framework/economy/constructionBudget';
import { processImageFileToDataUrl } from '../framework/persistence/artifactStore';
import type { CommissionConfig, CostItem } from '../framework/types';
import type { WorkspaceDeliveryDraft } from '../workspace/integration';
import modalStyles from './Modal.module.css';

interface DeliveryModalProps {
  commission: CommissionConfig;
  initialDraft?: WorkspaceDeliveryDraft | null;
  onClose: () => void;
  onSubmit: (payload: {
    projectTitle: string;
    notes: string;
    reportedCost: number | null;
    itemizedCosts?: CostItem[];
    imageDataUrl: string;
    projectData?: unknown;
    source: 'manual' | 'workspace';
  }) => Promise<void>;
}

export function DeliveryModal({
  commission,
  initialDraft,
  onClose,
  onSubmit,
}: DeliveryModalProps) {
  const [projectTitle, setProjectTitle] = useState(
    initialDraft?.projectTitle ?? ''
  );
  const [notes, setNotes] = useState(initialDraft?.notes ?? '');
  const [costText, setCostText] = useState(
    initialDraft?.reportedCost !== null &&
      initialDraft?.reportedCost !== undefined
      ? String(initialDraft.reportedCost)
      : ''
  );
  const [imageDataUrl, setImageDataUrl] = useState<string>(
    initialDraft?.artifact?.dataUrl ?? ''
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const parsedCost =
    costText.trim() === ''
      ? null
      : Number.isFinite(Number(costText))
        ? Math.max(0, Number(costText))
        : null;

  const budgetSummary = calculateBudgetSummary(
    commission.constructionBudget,
    parsedCost,
    initialDraft?.itemizedCosts
  );

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (PNG, JPG, WebP, or SVG).');
      return;
    }
    try {
      setError(null);
      const dataUrl = await processImageFileToDataUrl(file);
      setImageDataUrl(dataUrl);
    } catch {
      setError('Could not read that image file. Please try another screenshot.');
    }
  };

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) {
        return;
      }
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            void handleFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageDataUrl) {
      setError(
        'Please attach a screenshot or image of your architectural design before delivering.'
      );
      return;
    }
    if (costText.trim() !== '' && (Number.isNaN(Number(costText)) || Number(costText) < 0)) {
      setError('Reported construction cost must be 0 or a positive number.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        projectTitle: projectTitle.trim() || `${commission.title} Design`,
        notes,
        reportedCost: parsedCost,
        itemizedCosts: initialDraft?.itemizedCosts,
        imageDataUrl,
        projectData: initialDraft?.projectData,
        source: initialDraft?.artifact ? 'workspace' : 'manual',
      });
    } catch {
      setError('Something went wrong while saving your delivery. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div
      className={modalStyles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delivery-modal-title"
      data-testid="delivery-modal"
    >
      <form className={modalStyles.dialog} onSubmit={handleFormSubmit}>
        <div className={modalStyles.dialogHeader}>
          <div>
            <span className={modalStyles.dialogEyebrow}>
              Deliver Commission {commission.order}
            </span>
            <h2 id="delivery-modal-title" className={modalStyles.dialogTitle}>
              Submit Design to Mr. Rabbit
            </h2>
          </div>
          <button
            type="button"
            className={modalStyles.closeBtn}
            onClick={onClose}
            aria-label="Close delivery dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className={modalStyles.dialogBody}>
          {/* Image / Screenshot Drop Zone */}
          <div className={modalStyles.fieldGroup}>
            <label className={modalStyles.fieldLabel}>
              Design Screenshot or Image <span style={{ color: 'var(--status-danger)' }}>*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              data-testid="delivery-file-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void handleFile(file);
                }
              }}
            />

            {imageDataUrl ? (
              <div
                style={{
                  border: '1.5px solid var(--border-blueprint)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-blueprint)',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <img
                  src={imageDataUrl}
                  alt="Design submission preview"
                  style={{
                    maxHeight: '230px',
                    width: '100%',
                    objectFit: 'contain',
                    borderRadius: '8px',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <button
                    type="button"
                    className={modalStyles.secondaryBtn}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Replace Image
                  </button>
                  <button
                    type="button"
                    className={modalStyles.secondaryBtn}
                    onClick={() => setImageDataUrl('')}
                  >
                    <Trash2 size={15} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    void handleFile(file);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                style={{
                  border: `2px dashed ${
                    dragActive ? 'var(--accent-terracotta)' : 'var(--border-blueprint)'
                  }`,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-blueprint)',
                  padding: '28px 18px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <ImagePlus size={30} color="var(--accent-blueprint)" />
                <strong>Click to upload an image, drag &amp; drop, or paste (Ctrl+V)</strong>
                <span className={modalStyles.fieldHint}>
                  Share a screenshot of your blueprint, 3D room, or sketch for Mr. Rabbit to inspect.
                </span>
              </div>
            )}
          </div>

          {/* Optional Project Title */}
          <div className={modalStyles.fieldGroup}>
            <label htmlFor="delivery-project-title" className={modalStyles.fieldLabel}>
              Project Title (optional)
            </label>
            <input
              id="delivery-project-title"
              type="text"
              className={modalStyles.textInput}
              placeholder={`e.g., ${commission.title} — Plan v1`}
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
            />
          </div>

          {/* Reported Construction Cost */}
          <div className={modalStyles.fieldGroup}>
            <label htmlFor="delivery-reported-cost" className={modalStyles.fieldLabel}>
              Reported Construction Cost (coins, optional)
            </label>
            <input
              id="delivery-reported-cost"
              type="number"
              min="0"
              step="1"
              className={modalStyles.textInput}
              placeholder={`Customer budget is ${commission.constructionBudget.toLocaleString()} coins`}
              value={costText}
              onChange={(e) => setCostText(e.target.value)}
            />
            <span className={modalStyles.fieldHint}>
              Customer Budget: {commission.constructionBudget.toLocaleString()} coins
              {budgetSummary.reportedCost !== null && (
                <>
                  {' '}
                  &bull; Remaining after build:{' '}
                  <strong
                    style={{
                      color: budgetSummary.isOverBudget
                        ? 'var(--status-danger)'
                        : 'var(--accent-sage)',
                    }}
                  >
                    {budgetSummary.remainingBudget.toLocaleString()} coins
                  </strong>
                </>
              )}
            </span>
          </div>

          {/* Optional Architect Notes */}
          <div className={modalStyles.fieldGroup}>
            <label htmlFor="delivery-notes" className={modalStyles.fieldLabel}>
              Notes for Mr. Rabbit (optional)
            </label>
            <textarea
              id="delivery-notes"
              rows={3}
              className={modalStyles.textarea}
              placeholder="Explain how your software and design solve Mr. Rabbit's request..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && (
            <div
              role="alert"
              style={{
                background: 'var(--status-danger-soft)',
                color: 'var(--status-danger)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.88rem',
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}
        </div>

        <div className={modalStyles.dialogFooter}>
          <button
            type="button"
            className={modalStyles.secondaryBtn}
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={modalStyles.primaryBtn}
            disabled={submitting}
            data-testid="submit-delivery-confirm"
          >
            <Send size={16} />
            <span>{submitting ? 'Sending...' : 'Send to Mr. Rabbit'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

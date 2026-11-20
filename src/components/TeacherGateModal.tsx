import { GraduationCap, X } from 'lucide-react';
import modalStyles from './Modal.module.css';

interface TeacherGateModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function TeacherGateModal({ onConfirm, onCancel }: TeacherGateModalProps) {
  return (
    <div
      className={modalStyles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-gate-title"
      data-testid="teacher-gate-modal"
    >
      <div className={modalStyles.dialog} style={{ width: 'min(460px, 100%)' }}>
        <div className={modalStyles.dialogHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GraduationCap size={22} color="var(--accent-blueprint)" />
            <div>
              <span className={modalStyles.dialogEyebrow}>Educator Desk</span>
              <h2 id="teacher-gate-title" className={modalStyles.dialogTitle}>
                Enter Teacher Controls?
              </h2>
            </div>
          </div>
          <button
            type="button"
            className={modalStyles.closeBtn}
            onClick={onCancel}
            aria-label="Cancel"
          >
            <X size={18} />
          </button>
        </div>

        <div className={modalStyles.dialogBody}>
          <p style={{ fontSize: '0.94rem', lineHeight: 1.55, color: 'var(--text-secondary)' }}>
            Teacher Controls let you inspect student submissions, send Mr. Rabbit&apos;s
            reviews, preview future sealed commissions, customize briefs, and back up
            progress.
          </p>
        </div>

        <div className={modalStyles.dialogFooter}>
          <button
            type="button"
            className={modalStyles.secondaryBtn}
            onClick={onCancel}
          >
            Stay in Studio
          </button>
          <button
            type="button"
            className={modalStyles.primaryBtn}
            onClick={onConfirm}
            data-testid="confirm-enter-teacher-btn"
          >
            Open Teacher Controls
          </button>
        </div>
      </div>
    </div>
  );
}

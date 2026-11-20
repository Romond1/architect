import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Coins,
  Download,
  LockOpen,
  MessageSquareWarning,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { MR_RABBIT_CUSTOMER } from '../config/customers/mrRabbit';
import {
  createFullBackup,
  parseAndValidateBackup,
  serializeBackup,
  type ParsedBackupPreview,
} from '../framework/persistence/backupService';
import { getVisibleAchievementList } from '../framework/rewards/achievementService';
import type {
  CommissionConfig,
  FrameworkState,
  RabbitExpression,
} from '../framework/types';
import { STATUS_LABELS } from './FeedbackPanel';
import modalStyles from './Modal.module.css';
import styles from './TeacherPanel.module.css';

type TeacherTab = 'review' | 'commissions' | 'wallet' | 'backup';

interface TeacherPanelProps {
  state: FrameworkState;
  artifacts: Record<string, string>;
  onMarkUnderReview: (commissionId: string, submissionId?: string) => void;
  onApproveSubmission: (input: {
    commissionId: string;
    submissionId?: string;
    feedbackMessage?: string;
    expression?: RabbitExpression;
    isCustomFeedback?: boolean;
  }) => void;
  onRequestRevision: (input: {
    commissionId: string;
    submissionId?: string;
    message: string;
    expression?: RabbitExpression;
    unmetRequirementIds?: string[];
    isCustom?: boolean;
  }) => void;
  onUnlockCommission: (commissionId: string, activateImmediately?: boolean) => void;
  onReopenCommission: (commissionId: string) => void;
  onSwitchCommission: (commissionId: string) => void;
  onUpdateCommission: (
    commissionId: string,
    patch: Partial<
      Pick<
        CommissionConfig,
        | 'title'
        | 'customerDialogue'
        | 'successDialogue'
        | 'constructionBudget'
        | 'architectPayment'
        | 'requirements'
        | 'dimensions'
      >
    >
  ) => void;
  onCreateCommission: (input: {
    title: string;
    customerDialogue: string;
    successDialogue: string;
    requirements: string[];
    dimensions: Array<{ id: string; label: string; value: string }>;
    constructionBudget: number;
    architectPayment: number;
  }) => void;
  onAdjustWallet: (delta: number, reason: string) => void;
  onUpdateStudioTitle: (studioTitle: string) => void;
  onExportFullBackup: () => Promise<Record<string, string>>;
  onExportWorkspaceData: () => Record<string, unknown>;
  onImportBackup: (
    backup: NonNullable<ParsedBackupPreview['backup']>,
    importWorkspace: boolean
  ) => Promise<void>;
  onResetProgress: (clearWorkspace: boolean) => Promise<void>;
  onClose: () => void;
}

export function TeacherPanel({
  state,
  artifacts,
  onMarkUnderReview,
  onApproveSubmission,
  onRequestRevision,
  onUnlockCommission,
  onReopenCommission,
  onSwitchCommission,
  onUpdateCommission,
  onCreateCommission,
  onAdjustWallet,
  onUpdateStudioTitle,
  onExportFullBackup,
  onExportWorkspaceData,
  onImportBackup,
  onResetProgress,
  onClose,
}: TeacherPanelProps) {
  const [activeTab, setActiveTab] = useState<TeacherTab>('review');

  // Review tab state
  const sortedCommissions = useMemo(
    () => [...state.commissions].sort((a, b) => a.order - b.order),
    [state.commissions]
  );

  const [reviewCommissionId, setReviewCommissionId] = useState(
    state.activeCommissionId
  );
  const reviewCommission =
    sortedCommissions.find((c) => c.id === reviewCommissionId) ??
    sortedCommissions[0];
  const reviewProgress = state.commissionProgress[reviewCommission.id];
  const activeSub = reviewProgress?.activeSubmissionId
    ? state.submissions[reviewProgress.activeSubmissionId]
    : undefined;

  const [approvalTemplateId, setApprovalTemplateId] = useState('app-signature');
  const [customApprovalMessage, setCustomApprovalMessage] = useState('');
  const [revisionTemplateId, setRevisionTemplateId] = useState(
    MR_RABBIT_CUSTOMER.scriptedRevisionTemplates[0].id
  );
  const [customRevisionMessage, setCustomRevisionMessage] = useState('');
  const [unmetIds, setUnmetIds] = useState<string[]>([]);

  // Commissions Editor state
  const [editCommissionId, setEditCommissionId] = useState(
    state.activeCommissionId
  );
  const editCommission =
    sortedCommissions.find((c) => c.id === editCommissionId) ??
    sortedCommissions[0];
  const [editTitle, setEditTitle] = useState(editCommission.title);
  const [editDialogue, setEditDialogue] = useState(
    editCommission.customerDialogue
  );
  const [editSuccessDialogue, setEditSuccessDialogue] = useState(
    editCommission.successDialogue
  );
  const [editBudget, setEditBudget] = useState(
    String(editCommission.constructionBudget)
  );
  const [editPayment, setEditPayment] = useState(
    String(editCommission.architectPayment)
  );
  const [editRequirementsText, setEditRequirementsText] = useState(
    editCommission.requirements.map((r) => r.text).join('\n')
  );
  const [editDimensionsText, setEditDimensionsText] = useState(
    editCommission.dimensions.map((d) => `${d.label}: ${d.value}`).join('\n')
  );
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Create Commission 6+ form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDialogue, setNewDialogue] = useState('');
  const [newSuccess, setNewSuccess] = useState('');
  const [newReqs, setNewReqs] = useState('');
  const [newBudget, setNewBudget] = useState('6000');
  const [newPayment, setNewPayment] = useState('400');

  // Wallet & Studio tab
  const [studioTitleDraft, setStudioTitleDraft] = useState(
    state.preferences.studioTitle
  );
  const [walletDelta, setWalletDelta] = useState('50');
  const [walletReason, setWalletReason] = useState('Bonus for thoughtful design');
  const [walletNotice, setWalletNotice] = useState<string | null>(null);

  // Backup & Reset tab
  const [importPreview, setImportPreview] = useState<ParsedBackupPreview | null>(
    null
  );
  const [importWorkspaceToggle, setImportWorkspaceToggle] = useState(true);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);
  const [resetPhrase, setResetPhrase] = useState('');
  const [resetWorkspaceToo, setResetWorkspaceToo] = useState(false);

  const loadCommissionIntoEditor = (id: string) => {
    setEditCommissionId(id);
    const target = sortedCommissions.find((c) => c.id === id);
    if (!target) {
      return;
    }
    setEditTitle(target.title);
    setEditDialogue(target.customerDialogue);
    setEditSuccessDialogue(target.successDialogue);
    setEditBudget(String(target.constructionBudget));
    setEditPayment(String(target.architectPayment));
    setEditRequirementsText(target.requirements.map((r) => r.text).join('\n'));
    setEditDimensionsText(
      target.dimensions.map((d) => `${d.label}: ${d.value}`).join('\n')
    );
    setSaveMessage(null);
  };

  const handleSaveCommissionEdits = () => {
    const parsedReqs = editRequirementsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((text, index) => ({
        id: editCommission.requirements[index]?.id ?? `${editCommission.id}-req-${index + 1}`,
        text,
      }));

    const parsedDims = editDimensionsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) {
          return {
            id: `${editCommission.id}-dim-${index + 1}`,
            label: 'Dimension',
            value: line,
          };
        }
        return {
          id: editCommission.dimensions[index]?.id ?? `${editCommission.id}-dim-${index + 1}`,
          label: line.slice(0, colonIdx).trim(),
          value: line.slice(colonIdx + 1).trim(),
        };
      });

    onUpdateCommission(editCommission.id, {
      title: editTitle.trim() || editCommission.title,
      customerDialogue: editDialogue.trim() || editCommission.customerDialogue,
      successDialogue:
        editSuccessDialogue.trim() || editCommission.successDialogue,
      constructionBudget: Math.max(0, Number(editBudget) || 0),
      architectPayment: Math.max(0, Number(editPayment) || 0),
      requirements: parsedReqs,
      dimensions: parsedDims,
    });
    setSaveMessage('Commission details updated.');
  };

  const handleApproveClick = () => {
    if (!activeSub) {
      return;
    }
    const tpl = MR_RABBIT_CUSTOMER.scriptedApprovalTemplates.find(
      (t) => t.id === approvalTemplateId
    );
    const trimmedCustom = customApprovalMessage.trim();
    const message =
      trimmedCustom.length > 0
        ? trimmedCustom
        : tpl && tpl.message.length > 0
          ? tpl.message
          : reviewCommission.successDialogue;

    onApproveSubmission({
      commissionId: reviewCommission.id,
      submissionId: activeSub.id,
      feedbackMessage: message,
      expression: reviewCommission.isGrandFinale
        ? 'extremelyHappy'
        : tpl?.expression ?? 'celebrating',
      isCustomFeedback: trimmedCustom.length > 0,
    });
    setCustomApprovalMessage('');
    setUnmetIds([]);
    onClose();
  };

  const handleRequestRevisionClick = () => {
    if (!activeSub) {
      return;
    }
    const tpl = MR_RABBIT_CUSTOMER.scriptedRevisionTemplates.find(
      (t) => t.id === revisionTemplateId
    );
    const trimmedCustom = customRevisionMessage.trim();
    const message =
      trimmedCustom.length > 0
        ? trimmedCustom
        : tpl?.message ??
          "Let's refine a couple of details together before finalizing!";

    onRequestRevision({
      commissionId: reviewCommission.id,
      submissionId: activeSub.id,
      message,
      expression: tpl?.expression ?? 'concerned',
      unmetRequirementIds: unmetIds,
      isCustom: trimmedCustom.length > 0,
    });
    setCustomRevisionMessage('');
  };

  const handleDownloadBackup = async () => {
    const allArtifacts = await onExportFullBackup();
    const workspaceDump = onExportWorkspaceData();
    const backup = createFullBackup(state, allArtifacts, workspaceDump);
    const json = serializeBackup(backup);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `himari-studio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setBackupNotice('Full backup downloaded.');
  };

  const handleBackupFileSelected = async (file: File) => {
    const text = await file.text();
    const parsed = parseAndValidateBackup(text);
    setImportPreview(parsed);
    setBackupNotice(null);
  };

  const teacherAchievements = getVisibleAchievementList(state, {
    includeSpoilersForTeacher: true,
  });

  return (
    <div
      className={modalStyles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-panel-title"
      data-testid="teacher-panel"
    >
      <div className={`${modalStyles.dialog} ${modalStyles.dialogWide}`}>
        <div className={modalStyles.dialogHeader}>
          <div>
            <span className={modalStyles.dialogEyebrow}>Educator Control Center</span>
            <h2 id="teacher-panel-title" className={modalStyles.dialogTitle}>
              Teacher Controls &amp; Commission Desk
            </h2>
          </div>
          <button
            type="button"
            className={modalStyles.closeBtn}
            onClick={onClose}
            aria-label="Close teacher controls"
          >
            <X size={18} />
          </button>
        </div>

        <div className={styles.tabRow}>
          <button
            type="button"
            className={`${styles.tabBtn} ${
              activeTab === 'review' ? styles.tabActive : ''
            }`}
            onClick={() => setActiveTab('review')}
            data-testid="teacher-tab-review"
          >
            Review Submissions
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${
              activeTab === 'commissions' ? styles.tabActive : ''
            }`}
            onClick={() => setActiveTab('commissions')}
            data-testid="teacher-tab-commissions"
          >
            Commissions ({sortedCommissions.length})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${
              activeTab === 'wallet' ? styles.tabActive : ''
            }`}
            onClick={() => setActiveTab('wallet')}
            data-testid="teacher-tab-wallet"
          >
            Wallet &amp; Studio
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${
              activeTab === 'backup' ? styles.tabActive : ''
            }`}
            onClick={() => setActiveTab('backup')}
            data-testid="teacher-tab-backup"
          >
            Backup &amp; Reset
          </button>
        </div>

        <div className={modalStyles.dialogBody}>
          {/* TAB 1: REVIEW SUBMISSIONS */}
          {activeTab === 'review' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className={modalStyles.fieldGroup}>
                <label htmlFor="review-commission-select" className={modalStyles.fieldLabel}>
                  Select Commission to Inspect
                </label>
                <select
                  id="review-commission-select"
                  className={modalStyles.selectInput}
                  value={reviewCommission.id}
                  onChange={(e) => {
                    setReviewCommissionId(e.target.value);
                    setUnmetIds([]);
                  }}
                >
                  {sortedCommissions.map((c) => {
                    const p = state.commissionProgress[c.id];
                    return (
                      <option key={c.id} value={c.id}>
                        Commission {c.order}: {c.title} (
                        {p ? STATUS_LABELS[p.status] : 'Locked'})
                      </option>
                    );
                  })}
                </select>
              </div>

              {!activeSub ? (
                <div className={styles.sectionBox}>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    No submission has been sent yet for{' '}
                    <strong>{reviewCommission.title}</strong>. Once Himari delivers
                    her design from the studio, it will appear right here for
                    joint inspection.
                  </p>
                </div>
              ) : (
                <div className={styles.splitGrid}>
                  {/* Submission Artifact Inspector */}
                  <div className={styles.sectionBox}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 className={styles.sectionTitle}>{activeSub.projectTitle}</h3>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-blueprint)' }}>
                        {STATUS_LABELS[reviewProgress.status]}
                      </span>
                    </div>

                    {artifacts[activeSub.imageArtifactId] && (
                      <img
                        src={artifacts[activeSub.imageArtifactId]}
                        alt={activeSub.projectTitle}
                        style={{
                          maxHeight: '240px',
                          width: '100%',
                          objectFit: 'contain',
                          borderRadius: '8px',
                          border: '1px solid var(--border-blueprint)',
                          background: 'var(--bg-blueprint)',
                        }}
                      />
                    )}

                    <div style={{ fontSize: '0.86rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>
                        <strong>Reported Cost:</strong>{' '}
                        {activeSub.reportedCost !== null
                          ? `${activeSub.reportedCost.toLocaleString()} coins (Budget: ${reviewCommission.constructionBudget.toLocaleString()})`
                          : `Not specified (Budget: ${reviewCommission.constructionBudget.toLocaleString()})`}
                      </div>
                      {activeSub.notes && (
                        <div>
                          <strong>Student Notes:</strong> {activeSub.notes}
                        </div>
                      )}
                    </div>

                    {reviewProgress.status === 'design_submitted' && (
                      <button
                        type="button"
                        className={modalStyles.secondaryBtn}
                        onClick={() =>
                          onMarkUnderReview(reviewCommission.id, activeSub.id)
                        }
                        data-testid="teacher-mark-under-review-btn"
                      >
                        Mark as Under Review
                      </button>
                    )}
                  </div>

                  {/* Approve or Request Revision */}
                  <div className={styles.sectionBox}>
                    <h3 className={styles.sectionTitle}>Customer Decision</h3>

                    {/* Approval section */}
                    <div className={modalStyles.fieldGroup}>
                      <label htmlFor="approval-template" className={modalStyles.fieldLabel}>
                        Approval Response
                      </label>
                      <select
                        id="approval-template"
                        className={modalStyles.selectInput}
                        value={approvalTemplateId}
                        onChange={(e) => setApprovalTemplateId(e.target.value)}
                      >
                        {MR_RABBIT_CUSTOMER.scriptedApprovalTemplates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                      <textarea
                        rows={2}
                        className={modalStyles.textarea}
                        placeholder="Optional custom approval note from Mr. Rabbit..."
                        value={customApprovalMessage}
                        onChange={(e) => setCustomApprovalMessage(e.target.value)}
                      />
                      <button
                        type="button"
                        className={modalStyles.primaryBtn}
                        onClick={handleApproveClick}
                        data-testid="teacher-approve-btn"
                      >
                        <CheckCircle2 size={16} />
                        <span>
                          {reviewProgress.paymentAwarded
                            ? 'Approve Updated Design (No Duplicate Coins)'
                            : `Approve & Award ${reviewCommission.architectPayment} Coins`}
                        </span>
                      </button>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px dashed var(--border-warm)' }} />

                    {/* Constructive Revision section */}
                    <div className={modalStyles.fieldGroup}>
                      <span className={modalStyles.fieldLabel}>
                        Or Request Constructive Revision
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {reviewCommission.requirements.map((req) => (
                          <label key={req.id} className={styles.reqCheckboxRow}>
                            <input
                              type="checkbox"
                              checked={unmetIds.includes(req.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setUnmetIds((prev) => [...prev, req.id]);
                                } else {
                                  setUnmetIds((prev) =>
                                    prev.filter((id) => id !== req.id)
                                  );
                                }
                              }}
                            />
                            <span>{req.text}</span>
                          </label>
                        ))}
                      </div>

                      <select
                        aria-label="Revision feedback template"
                        className={modalStyles.selectInput}
                        value={revisionTemplateId}
                        onChange={(e) => setRevisionTemplateId(e.target.value)}
                      >
                        {MR_RABBIT_CUSTOMER.scriptedRevisionTemplates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>

                      <textarea
                        rows={2}
                        className={modalStyles.textarea}
                        placeholder="Optional custom encouraging revision note..."
                        value={customRevisionMessage}
                        onChange={(e) => setCustomRevisionMessage(e.target.value)}
                        data-testid="teacher-revision-custom-input"
                      />

                      <button
                        type="button"
                        className={modalStyles.secondaryBtn}
                        onClick={handleRequestRevisionClick}
                        data-testid="teacher-request-revision-btn"
                      >
                        <MessageSquareWarning size={16} />
                        <span>Send Constructive Revision Request</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: COMMISSIONS PREVIEW & EDITOR */}
          {activeTab === 'commissions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className={styles.splitGrid}>
                {/* Commission List (including locked previews!) */}
                <div className={styles.sectionBox}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className={styles.sectionTitle}>All Commissions (Teacher Preview)</h3>
                    <button
                      type="button"
                      className={modalStyles.secondaryBtn}
                      onClick={() => setShowCreateForm((v) => !v)}
                      data-testid="teacher-toggle-create-commission"
                    >
                      <Plus size={15} />
                      <span>New Commission</span>
                    </button>
                  </div>

                  {sortedCommissions.map((c) => {
                    const p = state.commissionProgress[c.id];
                    const isSelected = c.id === editCommission.id;
                    return (
                      <div
                        key={c.id}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: isSelected
                            ? 'var(--accent-blueprint-soft)'
                            : 'var(--bg-surface)',
                          border: `1.5px solid ${
                            isSelected ? 'var(--accent-blueprint)' : 'var(--border-warm)'
                          }`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                          <div>
                            <strong>
                              {c.order}. {c.title}
                            </strong>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              State: {p?.unlockState ?? 'locked'} &bull; Budget:{' '}
                              {c.constructionBudget} &bull; Fee: {c.architectPayment}
                            </div>
                          </div>
                          <button
                            type="button"
                            className={modalStyles.secondaryBtn}
                            style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                            onClick={() => loadCommissionIntoEditor(c.id)}
                          >
                            Edit
                          </button>
                        </div>

                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {p?.unlockState === 'locked' && (
                            <button
                              type="button"
                              className={modalStyles.secondaryBtn}
                              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                              onClick={() => onUnlockCommission(c.id, true)}
                              data-testid={`teacher-unlock-${c.order}`}
                            >
                              <LockOpen size={13} />
                              <span>Unlock &amp; Open</span>
                            </button>
                          )}
                          {p?.unlockState === 'completed' && (
                            <button
                              type="button"
                              className={modalStyles.secondaryBtn}
                              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                              onClick={() => onReopenCommission(c.id)}
                              data-testid={`teacher-reopen-${c.order}`}
                            >
                              <RotateCcw size={13} />
                              <span>Reopen</span>
                            </button>
                          )}
                          {p?.unlockState !== 'locked' &&
                            state.activeCommissionId !== c.id && (
                              <button
                                type="button"
                                className={modalStyles.secondaryBtn}
                                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                                onClick={() => onSwitchCommission(c.id)}
                              >
                                Show in Studio
                              </button>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Commission Editor */}
                <div className={styles.sectionBox}>
                  <h3 className={styles.sectionTitle}>
                    Edit Commission {editCommission.order}
                  </h3>
                  <div className={modalStyles.fieldGroup}>
                    <label className={modalStyles.fieldLabel}>Title</label>
                    <input
                      type="text"
                      className={modalStyles.textInput}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                  </div>
                  <div className={modalStyles.fieldGroup}>
                    <label className={modalStyles.fieldLabel}>Customer Dialogue</label>
                    <textarea
                      rows={3}
                      className={modalStyles.textarea}
                      value={editDialogue}
                      onChange={(e) => setEditDialogue(e.target.value)}
                    />
                  </div>
                  <div className={modalStyles.fieldGroup}>
                    <label className={modalStyles.fieldLabel}>Success Dialogue</label>
                    <textarea
                      rows={2}
                      className={modalStyles.textarea}
                      value={editSuccessDialogue}
                      onChange={(e) => setEditSuccessDialogue(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className={modalStyles.fieldGroup}>
                      <label className={modalStyles.fieldLabel}>Construction Budget</label>
                      <input
                        type="number"
                        min="0"
                        className={modalStyles.textInput}
                        value={editBudget}
                        onChange={(e) => setEditBudget(e.target.value)}
                      />
                    </div>
                    <div className={modalStyles.fieldGroup}>
                      <label className={modalStyles.fieldLabel}>Architect Fee</label>
                      <input
                        type="number"
                        min="0"
                        className={modalStyles.textInput}
                        value={editPayment}
                        onChange={(e) => setEditPayment(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className={modalStyles.fieldGroup}>
                    <label className={modalStyles.fieldLabel}>
                      Requirements (one per line)
                    </label>
                    <textarea
                      rows={4}
                      className={modalStyles.textarea}
                      value={editRequirementsText}
                      onChange={(e) => setEditRequirementsText(e.target.value)}
                    />
                  </div>
                  <div className={modalStyles.fieldGroup}>
                    <label className={modalStyles.fieldLabel}>
                      Dimensions (Label: Value per line)
                    </label>
                    <textarea
                      rows={2}
                      className={modalStyles.textarea}
                      value={editDimensionsText}
                      onChange={(e) => setEditDimensionsText(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className={modalStyles.primaryBtn}
                    onClick={handleSaveCommissionEdits}
                    data-testid="teacher-save-commission-btn"
                  >
                    <Save size={15} />
                    <span>Save Commission Changes</span>
                  </button>
                  {saveMessage && (
                    <span style={{ fontSize: '0.84rem', color: 'var(--accent-sage)', fontWeight: 600 }}>
                      {saveMessage}
                    </span>
                  )}
                </div>
              </div>

              {showCreateForm && (
                <div className={styles.sectionBox}>
                  <h3 className={styles.sectionTitle}>Create Additional Commission</h3>
                  <div className={styles.splitGrid}>
                    <div className={modalStyles.fieldGroup}>
                      <label className={modalStyles.fieldLabel}>Title</label>
                      <input
                        type="text"
                        className={modalStyles.textInput}
                        placeholder="e.g., Sunny Carrot Conservatory"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className={modalStyles.fieldGroup}>
                        <label className={modalStyles.fieldLabel}>Budget (coins)</label>
                        <input
                          type="number"
                          className={modalStyles.textInput}
                          value={newBudget}
                          onChange={(e) => setNewBudget(e.target.value)}
                        />
                      </div>
                      <div className={modalStyles.fieldGroup}>
                        <label className={modalStyles.fieldLabel}>Payment (coins)</label>
                        <input
                          type="number"
                          className={modalStyles.textInput}
                          value={newPayment}
                          onChange={(e) => setNewPayment(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className={modalStyles.fieldGroup}>
                    <label className={modalStyles.fieldLabel}>Customer Dialogue</label>
                    <textarea
                      rows={2}
                      className={modalStyles.textarea}
                      value={newDialogue}
                      onChange={(e) => setNewDialogue(e.target.value)}
                    />
                  </div>
                  <div className={modalStyles.fieldGroup}>
                    <label className={modalStyles.fieldLabel}>Requirements (one per line)</label>
                    <textarea
                      rows={3}
                      className={modalStyles.textarea}
                      value={newReqs}
                      onChange={(e) => setNewReqs(e.target.value)}
                    />
                  </div>
                  <div className={modalStyles.fieldGroup}>
                    <label className={modalStyles.fieldLabel}>Success Dialogue</label>
                    <input
                      type="text"
                      className={modalStyles.textInput}
                      value={newSuccess}
                      onChange={(e) => setNewSuccess(e.target.value)}
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      className={modalStyles.primaryBtn}
                      onClick={() => {
                        onCreateCommission({
                          title: newTitle || `Bonus Commission ${sortedCommissions.length + 1}`,
                          customerDialogue:
                            newDialogue ||
                            'I have a brand new idea to expand my architectural home!',
                          successDialogue:
                            newSuccess || 'Splendid craftsmanship, architect!',
                          requirements: newReqs
                            .split('\n')
                            .map((s) => s.trim())
                            .filter(Boolean),
                          dimensions: [],
                          constructionBudget: Math.max(0, Number(newBudget) || 6000),
                          architectPayment: Math.max(0, Number(newPayment) || 400),
                        });
                        setShowCreateForm(false);
                        setNewTitle('');
                        setNewDialogue('');
                        setNewReqs('');
                        setNewSuccess('');
                      }}
                    >
                      <Plus size={15} />
                      <span>Add Commission to Campaign</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WALLET, STUDIO TITLE & ACHIEVEMENTS */}
          {activeTab === 'wallet' && (
            <div className={styles.splitGrid}>
              <div className={styles.sectionBox}>
                <h3 className={styles.sectionTitle}>Studio &amp; Wallet Controls</h3>
                <div className={modalStyles.fieldGroup}>
                  <label htmlFor="studio-title-input" className={modalStyles.fieldLabel}>
                    Configurable Studio Title
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      id="studio-title-input"
                      type="text"
                      className={modalStyles.textInput}
                      value={studioTitleDraft}
                      onChange={(e) => setStudioTitleDraft(e.target.value)}
                    />
                    <button
                      type="button"
                      className={modalStyles.secondaryBtn}
                      onClick={() => onUpdateStudioTitle(studioTitleDraft)}
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <div className={modalStyles.fieldGroup}>
                  <span className={modalStyles.fieldLabel}>
                    Adjust Personal Wallet (Current: {state.wallet.balance.toLocaleString()} coins)
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      className={modalStyles.textInput}
                      value={walletDelta}
                      onChange={(e) => setWalletDelta(e.target.value)}
                      style={{ maxWidth: '120px' }}
                    />
                    <input
                      type="text"
                      className={modalStyles.textInput}
                      value={walletReason}
                      onChange={(e) => setWalletReason(e.target.value)}
                      placeholder="Reason for adjustment"
                    />
                    <button
                      type="button"
                      className={modalStyles.primaryBtn}
                      onClick={() => {
                        const parsed = Number(walletDelta);
                        if (!Number.isFinite(parsed) || parsed === 0) {
                          setWalletNotice('Enter a non-zero coin amount.');
                          return;
                        }
                        if (state.wallet.balance + parsed < 0) {
                          setWalletNotice('Balance cannot go below 0 coins.');
                          return;
                        }
                        onAdjustWallet(parsed, walletReason);
                        setWalletNotice(
                          `Adjusted wallet by ${parsed > 0 ? `+${parsed}` : parsed} coins.`
                        );
                      }}
                    >
                      <Coins size={15} />
                      <span>Adjust</span>
                    </button>
                  </div>
                  {walletNotice && (
                    <span className={modalStyles.fieldHint}>{walletNotice}</span>
                  )}
                </div>

                <div>
                  <div className={modalStyles.fieldLabel} style={{ marginBottom: '6px' }}>
                    All Achievements (Teacher View)
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.85rem' }}>
                    {teacherAchievements.map((item) => (
                      <li key={item.definition.id}>
                        <strong>{item.definition.title}</strong> —{' '}
                        {item.earned ? 'Earned' : 'Not yet earned'}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className={styles.sectionBox}>
                <h3 className={styles.sectionTitle}>
                  Personal Wallet Ledger ({state.wallet.transactions.length})
                </h3>
                <div className={styles.ledgerList}>
                  {state.wallet.transactions.length === 0 ? (
                    <span className={modalStyles.fieldHint}>
                      No wallet transactions recorded yet.
                    </span>
                  ) : (
                    state.wallet.transactions.map((tx) => (
                      <div key={tx.id} className={styles.ledgerRow}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{tx.description}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {new Date(tx.timestamp).toLocaleString()} &bull; Balance:{' '}
                            {tx.balanceAfter.toLocaleString()}
                          </div>
                        </div>
                        <span
                          className={
                            tx.amount >= 0 ? styles.positive : styles.negative
                          }
                        >
                          {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BACKUP, IMPORT & RESET */}
          {activeTab === 'backup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className={styles.splitGrid}>
                <div className={styles.sectionBox}>
                  <h3 className={styles.sectionTitle}>Export Saved Progress</h3>
                  <p style={{ fontSize: '0.87rem', color: 'var(--text-secondary)' }}>
                    Downloads a complete JSON backup of commissions, coins,
                    achievements, portfolio images, and workspace data.
                  </p>
                  <button
                    type="button"
                    className={modalStyles.primaryBtn}
                    onClick={handleDownloadBackup}
                    data-testid="teacher-export-backup-btn"
                  >
                    <Download size={16} />
                    <span>Download Studio Backup (.json)</span>
                  </button>
                  {backupNotice && (
                    <span style={{ fontSize: '0.84rem', color: 'var(--accent-sage)', fontWeight: 600 }}>
                      {backupNotice}
                    </span>
                  )}
                </div>

                <div className={styles.sectionBox}>
                  <h3 className={styles.sectionTitle}>Import Saved Progress</h3>
                  <input
                    type="file"
                    accept=".json,application/json"
                    data-testid="teacher-import-file-input"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        void handleBackupFileSelected(file);
                      }
                    }}
                  />
                  {importPreview && !importPreview.valid && (
                    <div style={{ color: 'var(--status-danger)', fontSize: '0.86rem', fontWeight: 600 }}>
                      {importPreview.error}
                    </div>
                  )}
                  {importPreview?.valid && importPreview.summary && importPreview.backup && (
                    <div
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-warm)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '10px',
                        fontSize: '0.84rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div>
                        <strong>Studio:</strong> {importPreview.summary.studioTitle}
                      </div>
                      <div>
                        <strong>Progress:</strong>{' '}
                        {importPreview.summary.completedCommissions}/
                        {importPreview.summary.totalCommissions} commissions &bull;{' '}
                        {importPreview.summary.walletBalance} coins &bull;{' '}
                        {importPreview.summary.rank}
                      </div>
                      {importPreview.summary.hasWorkspaceData && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="checkbox"
                            checked={importWorkspaceToggle}
                            onChange={(e) =>
                              setImportWorkspaceToggle(e.target.checked)
                            }
                          />
                          <span>Also restore saved workspace data</span>
                        </label>
                      )}
                      <button
                        type="button"
                        className={modalStyles.primaryBtn}
                        onClick={async () => {
                          if (!importPreview.backup) {
                            return;
                          }
                          await onImportBackup(
                            importPreview.backup,
                            importWorkspaceToggle
                          );
                          setImportPreview(null);
                          setBackupNotice('Studio progress restored from backup.');
                        }}
                        data-testid="teacher-confirm-import-btn"
                      >
                        <Upload size={15} />
                        <span>Restore Backup Now</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.dangerBox}>
                <h3 className={styles.sectionTitle}>Reset Studio Progress</h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                  Resets Mr. Rabbit&apos;s campaign back to Commission 1, personal coins to
                  0, and clears earned achievements and portfolio snapshots.
                </p>
                <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={resetWorkspaceToo}
                    onChange={(e) => setResetWorkspaceToo(e.target.checked)}
                  />
                  <span>Also clear saved workspace storage</span>
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Type RESET to confirm"
                    className={modalStyles.textInput}
                    style={{ maxWidth: '220px' }}
                    value={resetPhrase}
                    onChange={(e) => setResetPhrase(e.target.value)}
                    data-testid="teacher-reset-phrase-input"
                  />
                  <button
                    type="button"
                    className={modalStyles.dangerBtn}
                    disabled={resetPhrase.trim() !== 'RESET'}
                    onClick={async () => {
                      await onResetProgress(resetWorkspaceToo);
                      setResetPhrase('');
                      onClose();
                    }}
                    data-testid="teacher-reset-confirm-btn"
                  >
                    <Trash2 size={15} />
                    <span>Reset All Progress</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={modalStyles.dialogFooter}>
          <button
            type="button"
            className={modalStyles.secondaryBtn}
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

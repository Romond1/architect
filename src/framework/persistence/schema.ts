import { FRAMEWORK_SCHEMA_VERSION } from '../commissions/commissionService';
import { SHOP_ITEMS_BY_ID } from '../../config/rewards/shopItems';
import { ACHIEVEMENTS_BY_ID } from '../../config/rewards/achievements';
import { isSerializable } from '../utils/serializable';
import type { FrameworkState } from '../types';
export interface FrameworkStorageEnvelope {
  schemaVersion: number;
  savedAt: string;
  state: FrameworkState;
}
type Row = Record<string, unknown>;
const object = (v: unknown): v is Row =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === 'string';
const id = (v: unknown): v is string => text(v) && v.length > 0;
const number = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0;
const coins = (v: unknown): v is number => number(v) && Number.isSafeInteger(v);
const date = (v: unknown) => text(v) && Number.isFinite(Date.parse(v));
const optional = (v: unknown, check: (value: unknown) => boolean) =>
  v === undefined || check(v);
const list = (v: unknown, check: (value: unknown) => boolean): v is unknown[] =>
  Array.isArray(v) && v.every(check);
const expressions = [
  'greeting',
  'thinking',
  'waiting',
  'curious',
  'concerned',
  'impressed',
  'celebrating',
  'extremelyHappy',
];
const statuses = [
  'awaiting_design',
  'design_submitted',
  'under_review',
  'revision_requested',
  'commission_approved',
  'commission_completed',
];
const requirement = (v: unknown) => object(v) && id(v.id) && text(v.text);
const dimension = (v: unknown) =>
  object(v) && id(v.id) && text(v.label) && text(v.value);
const costItem = (v: unknown) =>
  object(v) &&
  id(v.id) &&
  text(v.label) &&
  number(v.totalCost) &&
  optional(v.category, text) &&
  optional(v.quantity, number) &&
  optional(v.unitCost, number);
const costs = (v: unknown) => optional(v, (value) => list(value, costItem));
const reportedCost = (v: unknown) => v === null || number(v);
const linked = (records: Row, key: unknown, commission: unknown) =>
  id(key) &&
  object(records[key]) &&
  (records[key] as Row).commissionId === commission;
const fail = (error: string) => ({ valid: false, error });
export function validateFrameworkState(raw: unknown): {
  valid: boolean;
  error?: string;
} {
  if (!object(raw) || raw.schemaVersion !== FRAMEWORK_SCHEMA_VERSION)
    return fail('Unsupported or missing framework schema version.');
  if (
    !object(raw.preferences) ||
    typeof raw.preferences.soundEnabled !== 'boolean' ||
    typeof raw.preferences.reducedMotion !== 'boolean' ||
    !id(raw.preferences.studioTitle)
  )
    return fail('Invalid studio preferences.');
  if (
    !Array.isArray(raw.commissions) ||
    raw.commissions.length === 0 ||
    !raw.commissions.every(
      (c) =>
        object(c) &&
        id(c.id) &&
        Number.isSafeInteger(c.order) &&
        Number(c.order) > 0 &&
        text(c.title) &&
        id(c.customerId) &&
        text(c.customerDialogue) &&
        text(c.successDialogue) &&
        expressions.includes(String(c.initialExpression)) &&
        list(c.requirements, requirement) &&
        list(c.dimensions, dimension) &&
        coins(c.constructionBudget) &&
        coins(c.architectPayment) &&
        text(c.achievementId) &&
        optional(c.isGrandFinale, (v) => typeof v === 'boolean')
    )
  )
    return fail('Invalid commission configuration.');
  const commissions = raw.commissions as Row[];
  const ids = new Set(commissions.map((c) => c.id));
  if (
    ids.size !== commissions.length ||
    new Set(commissions.map((c) => c.order)).size !== commissions.length ||
    !ids.has(raw.activeCommissionId)
  )
    return fail('Invalid or duplicate commission identity.');
  if (
    !object(raw.commissionProgress) ||
    !object(raw.submissions) ||
    !object(raw.feedbackHistory) ||
    !object(raw.earnedAchievements)
  )
    return fail(
      'Missing progress, submission, feedback, or achievement records.'
    );
  const submissions = raw.submissions,
    feedback = raw.feedbackHistory;
  for (const [key, value] of Object.entries(submissions)) {
    if (
      !object(value) ||
      value.id !== key ||
      !ids.has(value.commissionId) ||
      !date(value.createdAt) ||
      !text(value.projectTitle) ||
      !text(value.notes) ||
      !reportedCost(value.reportedCost) ||
      !costs(value.itemizedCosts) ||
      !id(value.imageArtifactId) ||
      !['manual', 'workspace'].includes(String(value.source)) ||
      !['submitted', 'under_review', 'revision_requested', 'approved'].includes(
        String(value.status)
      ) ||
      !optional(value.projectData, isSerializable)
    )
      return fail('Invalid submission record.');
  }
  for (const [key, value] of Object.entries(feedback)) {
    if (
      !object(value) ||
      value.id !== key ||
      !ids.has(value.commissionId) ||
      !linked(submissions, value.submissionId, value.commissionId) ||
      !date(value.createdAt) ||
      !statuses.includes(String(value.status)) ||
      !text(value.message) ||
      !expressions.includes(String(value.expression)) ||
      typeof value.isCustom !== 'boolean' ||
      !optional(value.unmetRequirementIds, (v) => list(v, text))
    )
      return fail('Invalid customer feedback record.');
  }
  if (Object.keys(raw.commissionProgress).length !== commissions.length)
    return fail('Missing or unknown commission progress.');
  for (const c of commissions) {
    const p = raw.commissionProgress[String(c.id)];
    if (
      !object(p) ||
      p.commissionId !== c.id ||
      !['locked', 'unlocked_pending_accept', 'active', 'completed'].includes(
        String(p.unlockState)
      ) ||
      !statuses.includes(String(p.status)) ||
      typeof p.paymentAwarded !== 'boolean' ||
      typeof p.achievementAwarded !== 'boolean' ||
      !optional(p.acceptedAt, date) ||
      !optional(p.completedAt, date)
    )
      return fail('Invalid commission progress.');
    if (
      p.activeSubmissionId !== undefined &&
      !linked(submissions, p.activeSubmissionId, c.id)
    )
      return fail('A commission refers to the wrong design.');
    if (
      p.latestFeedbackId !== undefined &&
      !linked(feedback, p.latestFeedbackId, c.id)
    )
      return fail('A commission refers to the wrong feedback.');
    if (
      [
        'design_submitted',
        'under_review',
        'commission_approved',
        'commission_completed',
      ].includes(String(p.status)) &&
      !p.activeSubmissionId
    )
      return fail('A reviewed commission is missing its submission.');
  }
  if (
    !object(raw.wallet) ||
    !coins(raw.wallet.balance) ||
    !Array.isArray(raw.wallet.transactions)
  )
    return fail('Invalid wallet.');
  let balance = 0;
  const transactionIds = new Set();
  for (const tx of [...raw.wallet.transactions].reverse()) {
    if (
      !object(tx) ||
      !id(tx.id) ||
      transactionIds.has(tx.id) ||
      !['commission_payment', 'shop_purchase', 'teacher_adjustment'].includes(
        String(tx.type)
      ) ||
      !Number.isSafeInteger(tx.amount) ||
      !coins(tx.balanceAfter) ||
      !date(tx.timestamp) ||
      !text(tx.description) ||
      !optional(tx.relatedCommissionId, (v) => ids.has(v)) ||
      !optional(tx.relatedItemId, text)
    )
      return fail('Invalid wallet transaction.');
    transactionIds.add(tx.id);
    balance += Number(tx.amount);
    if (!coins(balance) || tx.balanceAfter !== balance)
      return fail('Wallet transaction balances do not match.');
  }
  if (balance !== raw.wallet.balance)
    return fail('Wallet balance does not match its history.');
  if (
    !object(raw.inventory) ||
    !list(
      raw.inventory.ownedItemIds,
      (v) => id(v) && Boolean(SHOP_ITEMS_BY_ID[v])
    ) ||
    new Set(raw.inventory.ownedItemIds).size !==
      raw.inventory.ownedItemIds.length ||
    !object(raw.inventory.equippedSlots)
  )
    return fail('Invalid cosmetic inventory.');
  for (const [slot, item] of Object.entries(raw.inventory.equippedSlots)) {
    if (
      !id(item) ||
      !raw.inventory.ownedItemIds.includes(item) ||
      SHOP_ITEMS_BY_ID[item]?.slot !== slot
    )
      return fail('Invalid equipped cosmetic.');
  }
  for (const [key, value] of Object.entries(raw.earnedAchievements)) {
    if (
      !object(value) ||
      value.achievementId !== key ||
      !ACHIEVEMENTS_BY_ID[key] ||
      !ids.has(value.commissionId) ||
      !date(value.unlockedAt)
    )
      return fail('Invalid earned achievement.');
  }
  if (!Array.isArray(raw.portfolio)) return fail('Missing portfolio.');
  const portfolioIds = new Set();
  const portfolioCommissions = new Set();
  const validSnapshot = (p: unknown): p is Row =>
    object(p) &&
    id(p.id) &&
    ids.has(p.commissionId) &&
    coins(p.commissionOrder) &&
    text(p.commissionTitle) &&
    text(p.customerName) &&
    date(p.completedAt) &&
    text(p.projectTitle) &&
    text(p.studentNotes) &&
    id(p.imageArtifactId) &&
    list(p.requirementsSnapshot, requirement) &&
    list(p.dimensionsSnapshot, dimension) &&
    coins(p.constructionBudgetSnapshot) &&
    reportedCost(p.reportedCostSnapshot) &&
    costs(p.itemizedCostsSnapshot) &&
    text(p.customerFeedback) &&
    coins(p.paymentReceived) &&
    optional(p.achievementId, text) &&
    optional(p.achievementTitle, text);
  for (const p of raw.portfolio) {
    if (
      !validSnapshot(p) ||
      portfolioCommissions.has(p.commissionId) ||
      !optional(p.previousApprovals, (v) =>
        list(
          v,
          (old) =>
            validSnapshot(old) &&
            old.commissionId === p.commissionId &&
            old.previousApprovals === undefined
        )
      )
    )
      return fail('Invalid portfolio snapshot or approval history.');
    for (const snapshot of [
      ...((p.previousApprovals as Row[] | undefined) ?? []),
      p,
    ]) {
      if (portfolioIds.has(snapshot.id))
        return fail('Duplicate portfolio snapshot identity.');
      portfolioIds.add(snapshot.id);
    }
    portfolioCommissions.add(p.commissionId);
  }
  for (const p of Object.values(raw.commissionProgress)) {
    if (
      object(p) &&
      Boolean(p.paymentAwarded) !== portfolioCommissions.has(p.commissionId)
    )
      return fail('Completed portfolio records do not match payment history.');
  }
  if (raw.activeCelebration !== null) {
    const c = raw.activeCelebration;
    if (
      !object(c) ||
      !ids.has(c.commissionId) ||
      !linked(submissions, c.submissionId, c.commissionId) ||
      !id(c.imageArtifactId) ||
      !text(c.commissionTitle) ||
      !text(c.customerName) ||
      !text(c.dialogue) ||
      !expressions.includes(String(c.expression)) ||
      !coins(c.coinsEarned) ||
      typeof c.paymentAlreadyAwarded !== 'boolean' ||
      !text(c.newRank) ||
      !text(c.projectTitle) ||
      !reportedCost(c.reportedCost) ||
      !coins(c.constructionBudget) ||
      typeof c.isGrandFinale !== 'boolean' ||
      !optional(c.nextCommissionId, (v) => ids.has(v)) ||
      !optional(c.achievementId, text)
    )
      return fail('Invalid celebration record.');
  }
  return { valid: true };
}
export function validateFrameworkEnvelope(raw: unknown): {
  valid: boolean;
  state?: FrameworkState;
  error?: string;
} {
  if (
    !object(raw) ||
    raw.schemaVersion !== FRAMEWORK_SCHEMA_VERSION ||
    !date(raw.savedAt)
  )
    return fail('Malformed framework storage envelope.');
  const check = validateFrameworkState(raw.state);
  return check.valid
    ? { valid: true, state: raw.state as FrameworkState }
    : check;
}

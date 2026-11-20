export type RabbitExpression =
  | 'greeting'
  | 'thinking'
  | 'waiting'
  | 'curious'
  | 'concerned'
  | 'impressed'
  | 'celebrating'
  | 'extremelyHappy';

export type CommissionStatus =
  | 'awaiting_design'
  | 'design_submitted'
  | 'under_review'
  | 'revision_requested'
  | 'commission_approved'
  | 'commission_completed';

export type CommissionUnlockState =
  'locked' | 'unlocked_pending_accept' | 'active' | 'completed';

export interface CommissionRequirement {
  id: string;
  text: string;
}

export interface CommissionDimension {
  id: string;
  label: string;
  value: string;
}

export interface CommissionConfig {
  id: string;
  order: number;
  title: string;
  customerId: string;
  customerDialogue: string;
  successDialogue: string;
  initialExpression: RabbitExpression;
  requirements: CommissionRequirement[];
  dimensions: CommissionDimension[];
  constructionBudget: number;
  architectPayment: number;
  achievementId: string;
  isGrandFinale?: boolean;
}

export interface CustomerProfile {
  id: string;
  name: string;
  subtitle: string;
  personalityTraits: string[];
  bio: string;
  awaitingReviewDialogues: string[];
  scriptedRevisionTemplates: Array<{
    id: string;
    label: string;
    message: string;
    expression: RabbitExpression;
  }>;
  scriptedApprovalTemplates: Array<{
    id: string;
    label: string;
    message: string;
    expression: RabbitExpression;
  }>;
}

export interface CostItem {
  id: string;
  label: string;
  category?: string;
  quantity?: number;
  unitCost?: number;
  totalCost: number;
}

export interface SubmissionRecord {
  id: string;
  commissionId: string;
  createdAt: string;
  projectTitle: string;
  notes: string;
  reportedCost: number | null;
  itemizedCosts?: CostItem[];
  imageArtifactId: string;
  projectData?: unknown;
  source: 'manual' | 'workspace';
  status: 'submitted' | 'under_review' | 'revision_requested' | 'approved';
}

export interface FeedbackRecord {
  id: string;
  commissionId: string;
  submissionId: string;
  createdAt: string;
  status: CommissionStatus;
  message: string;
  expression: RabbitExpression;
  unmetRequirementIds?: string[];
  isCustom: boolean;
}

export interface PortfolioEntry {
  /** Earlier explicitly approved versions, retained when a commission is reopened. */
  previousApprovals?: Omit<PortfolioEntry, 'previousApprovals'>[];
  id: string;
  commissionId: string;
  commissionOrder: number;
  commissionTitle: string;
  customerName: string;
  completedAt: string;
  projectTitle: string;
  studentNotes: string;
  imageArtifactId: string;
  requirementsSnapshot: CommissionRequirement[];
  dimensionsSnapshot: CommissionDimension[];
  constructionBudgetSnapshot: number;
  reportedCostSnapshot: number | null;
  itemizedCostsSnapshot?: CostItem[];
  customerFeedback: string;
  paymentReceived: number;
  achievementId?: string;
  achievementTitle?: string;
}

export type WalletTransactionType =
  'commission_payment' | 'shop_purchase' | 'teacher_adjustment';

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  amount: number;
  balanceAfter: number;
  timestamp: string;
  description: string;
  relatedCommissionId?: string;
  relatedItemId?: string;
}

export interface CommissionProgressRecord {
  commissionId: string;
  unlockState: CommissionUnlockState;
  status: CommissionStatus;
  paymentAwarded: boolean;
  achievementAwarded: boolean;
  acceptedAt?: string;
  completedAt?: string;
  activeSubmissionId?: string;
  latestFeedbackId?: string;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  visualTheme:
    | 'junior-bronze'
    | 'designer-silver'
    | '3d-gold'
    | 'creative-amethyst'
    | 'master-emerald';
  linkedCommissionId: string;
  rankTitle: string;
  lockedHint: string;
}

export interface EarnedAchievement {
  achievementId: string;
  unlockedAt: string;
  commissionId: string;
}

export type StudioThemeId = 'default' | 'starry' | 'elegant';

export type ShopItemCategory =
  'customer_accessory' | 'studio_decor' | 'studio_trophy' | 'studio_theme';

export type CosmeticSlot =
  | 'rabbit_neck'
  | 'rabbit_head'
  | 'rabbit_outfit'
  | 'desk_pencil'
  | 'trophy_bronze'
  | 'trophy_gold'
  | 'theme';

export interface ShopItemDefinition {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ShopItemCategory;
  slot: CosmeticSlot;
  themeValue?: StudioThemeId;
  previewEffect: string;
}

export interface CelebrationPayload {
  commissionId: string;
  commissionTitle: string;
  customerName: string;
  dialogue: string;
  expression: RabbitExpression;
  coinsEarned: number;
  paymentAlreadyAwarded: boolean;
  achievementId?: string;
  newRank: string;
  submissionId: string;
  imageArtifactId: string;
  projectTitle: string;
  reportedCost: number | null;
  constructionBudget: number;
  nextCommissionId?: string;
  isGrandFinale: boolean;
}

export interface StudioPreferences {
  soundEnabled: boolean;
  reducedMotion: boolean;
  studioTitle: string;
}

export interface FrameworkState {
  schemaVersion: number;
  preferences: StudioPreferences;
  activeCommissionId: string;
  commissions: CommissionConfig[];
  commissionProgress: Record<string, CommissionProgressRecord>;
  submissions: Record<string, SubmissionRecord>;
  feedbackHistory: Record<string, FeedbackRecord>;
  wallet: {
    balance: number;
    transactions: WalletTransaction[];
  };
  inventory: {
    ownedItemIds: string[];
    equippedSlots: Partial<Record<CosmeticSlot, string>>;
  };
  earnedAchievements: Record<string, EarnedAchievement>;
  portfolio: PortfolioEntry[];
  activeCelebration: CelebrationPayload | null;
}

export type ActiveTab = 'studio' | 'portfolio' | 'achievements' | 'shop';

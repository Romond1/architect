import { describe, expect, it } from 'vitest';
import {
  acceptUnlockedCommission,
  createCustomCommission,
  createInitialFrameworkState,
  manuallyUnlockCommission,
  reopenCommission,
  updateCommissionConfig,
} from '../framework/commissions/commissionService';
import {
  resolveCustomerDialogue,
  resolveRabbitExpression,
} from '../framework/customers/customerState';
import { calculateBudgetSummary } from '../framework/economy/constructionBudget';
import { adjustWallet } from '../framework/economy/personalWallet';
import {
  buildPortfolioHtmlExport,
  buildPortfolioJsonExport,
} from '../framework/portfolio/portfolioService';
import {
  getArchitectRank,
  getVisibleAchievementList,
} from '../framework/rewards/achievementService';
import {
  equipShopItem,
  evaluateShopPurchase,
  getActiveStudioTheme,
  purchaseShopItem,
  unequipShopItem,
} from '../framework/rewards/shopService';
import {
  approveCommissionSubmission,
  createSubmission,
  markSubmissionUnderReview,
  requestSubmissionRevision,
} from '../framework/submissions/submissionService';

describe('Framework Core Domain', () => {
  it('initializes with Commission 1 active, Commissions 2-5 locked, 0 coins, 0 achievements, empty portfolio', () => {
    const state = createInitialFrameworkState();

    expect(state.activeCommissionId).toBe('commission-1');
    expect(state.commissions).toHaveLength(5);
    expect(state.commissionProgress['commission-1'].unlockState).toBe('active');
    expect(state.commissionProgress['commission-1'].status).toBe('awaiting_design');

    for (const id of [
      'commission-2',
      'commission-3',
      'commission-4',
      'commission-5',
    ]) {
      expect(state.commissionProgress[id].unlockState).toBe('locked');
    }

    expect(state.wallet.balance).toBe(0);
    expect(state.wallet.transactions).toHaveLength(0);
    expect(Object.keys(state.earnedAchievements)).toHaveLength(0);
    expect(state.portfolio).toHaveLength(0);
    expect(state.inventory.ownedItemIds).toHaveLength(0);
    expect(getArchitectRank(0)).toBe('Apprentice Architect');
    expect(getActiveStudioTheme(state.inventory)).toBe('default');

    // Total possible commission payouts equals 2,000 coins
    const totalPayments = state.commissions.reduce(
      (sum, c) => sum + c.architectPayment,
      0
    );
    expect(totalPayments).toBe(2000);
  });

  it('handles submission, under review, constructive revision, resubmission, and approval without auto-advancing', () => {
    let state = createInitialFrameworkState();

    // 1. Submit Commission 1
    const sub1 = createSubmission(state, {
      commissionId: 'commission-1',
      projectTitle: 'First Floor Plan v1',
      notes: 'Drafted initial rectangle',
      reportedCost: 850,
      imageArtifactId: 'art-1',
      source: 'manual',
    });
    state = sub1.state;
    expect(sub1.submissionId).toBeTruthy();
    expect(state.commissionProgress['commission-1'].status).toBe('design_submitted');

    // 2. Teacher marks under review
    state = markSubmissionUnderReview(state, 'commission-1', sub1.submissionId!);
    expect(state.commissionProgress['commission-1'].status).toBe('under_review');
    expect(
      resolveRabbitExpression(
        state.commissions[0],
        state.commissionProgress['commission-1']
      )
    ).toBe('thinking');

    // 3. Teacher requests constructive revision
    state = requestSubmissionRevision(state, {
      commissionId: 'commission-1',
      submissionId: sub1.submissionId!,
      message: 'Please show the 4m and 5m labels clearly!',
      expression: 'concerned',
      unmetRequirementIds: ['c1-req-5'],
      isCustom: true,
    });
    expect(state.commissionProgress['commission-1'].status).toBe(
      'revision_requested'
    );
    const revFbId = state.commissionProgress['commission-1'].latestFeedbackId!;
    expect(state.feedbackHistory[revFbId].unmetRequirementIds).toEqual([
      'c1-req-5',
    ]);
    expect(
      resolveCustomerDialogue(
        state.commissions[0],
        state.commissionProgress['commission-1'],
        state.feedbackHistory[revFbId]
      )
    ).toContain('4m and 5m');

    // 4. Student submits revised design
    const sub2 = createSubmission(state, {
      commissionId: 'commission-1',
      projectTitle: 'First Floor Plan v2',
      notes: 'Added clear 4m x 5m dimension lines',
      reportedCost: 880,
      imageArtifactId: 'art-2',
      source: 'manual',
    });
    state = sub2.state;
    expect(state.commissionProgress['commission-1'].status).toBe('design_submitted');

    // 5. Teacher approves submission
    state = approveCommissionSubmission(state, {
      commissionId: 'commission-1',
      submissionId: sub2.submissionId!,
    });

    expect(state.commissionProgress['commission-1'].unlockState).toBe('completed');
    expect(state.commissionProgress['commission-1'].status).toBe(
      'commission_completed'
    );
    expect(state.wallet.balance).toBe(100);
    expect(state.earnedAchievements['junior-architect']).toBeDefined();
    expect(getArchitectRank(Object.keys(state.earnedAchievements).length)).toBe(
      'Junior Architect'
    );
    expect(state.portfolio).toHaveLength(1);
    expect(state.portfolio[0].projectTitle).toBe('First Floor Plan v2');

    // Does NOT automatically advance while celebrating; Commission 2 awaits acceptance
    expect(state.activeCommissionId).toBe('commission-1');
    expect(state.commissionProgress['commission-2'].unlockState).toBe(
      'unlocked_pending_accept'
    );
    expect(state.activeCelebration).not.toBeNull();

    // Explicit acceptance switches active commission and clears celebration
    state = acceptUnlockedCommission(state, 'commission-2');
    expect(state.activeCommissionId).toBe('commission-2');
    expect(state.commissionProgress['commission-2'].unlockState).toBe('active');
    expect(state.activeCelebration).toBeNull();
  });

  it('prevents duplicate payments and duplicate achievements on re-approval or reopening', () => {
    let state = createInitialFrameworkState();

    const sub = createSubmission(state, {
      commissionId: 'commission-1',
      projectTitle: 'Room Plan',
      notes: '',
      reportedCost: 700,
      imageArtifactId: 'art-1',
      source: 'manual',
    });
    state = sub.state;

    state = approveCommissionSubmission(state, {
      commissionId: 'commission-1',
      submissionId: sub.submissionId!,
    });
    expect(state.wallet.balance).toBe(100);

    // Duplicate approval call on same submission
    state = approveCommissionSubmission(state, {
      commissionId: 'commission-1',
      submissionId: sub.submissionId!,
    });
    expect(state.wallet.balance).toBe(100);
    expect(state.portfolio).toHaveLength(1);

    // Reopen completed commission, resubmit, and re-approve
    state = reopenCommission(state, 'commission-1');
    expect(state.commissionProgress['commission-1'].paymentAwarded).toBe(true);

    const sub2 = createSubmission(state, {
      commissionId: 'commission-1',
      projectTitle: 'Room Plan Improved',
      notes: '',
      reportedCost: 750,
      imageArtifactId: 'art-2',
      source: 'manual',
    });
    state = approveCommissionSubmission(sub2.state, {
      commissionId: 'commission-1',
      submissionId: sub2.submissionId!,
    });

    // Still 100 coins — zero duplicate payout!
    expect(state.wallet.balance).toBe(100);
    expect(state.activeCelebration?.paymentAlreadyAwarded).toBe(true);
    expect(state.portfolio).toHaveLength(1);
    expect(state.portfolio[0].projectTitle).toBe('Room Plan Improved');
  });

  it('progresses sequentially across all 5 commissions to 2,000 coins and Master Architect', () => {
    let state = createInitialFrameworkState();

    for (let i = 1; i <= 5; i += 1) {
      const cId = `commission-${i}`;
      const created = createSubmission(state, {
        commissionId: cId,
        projectTitle: `Milestone ${i}`,
        notes: `Notes ${i}`,
        reportedCost: 500 * i,
        imageArtifactId: `art-${i}`,
        source: 'manual',
      });
      state = approveCommissionSubmission(created.state, {
        commissionId: cId,
        submissionId: created.submissionId!,
      });
      if (i < 5) {
        state = acceptUnlockedCommission(state, `commission-${i + 1}`);
      }
    }

    expect(state.wallet.balance).toBe(2000);
    expect(Object.keys(state.earnedAchievements)).toHaveLength(5);
    expect(getArchitectRank(5)).toBe('Master Architect');
    expect(state.portfolio).toHaveLength(5);
    expect(state.activeCelebration?.isGrandFinale).toBe(true);
  });

  it('keeps customer construction budget completely separate from personal wallet', () => {
    let state = createInitialFrameworkState();
    // Earn 100 coins from Commission 1
    const c1 = createSubmission(state, {
      commissionId: 'commission-1',
      projectTitle: 'Plan 1',
      notes: '',
      reportedCost: 900,
      imageArtifactId: 'art-1',
      source: 'manual',
    });
    state = approveCommissionSubmission(c1.state, {
      commissionId: 'commission-1',
      submissionId: c1.submissionId!,
    });
    state = acceptUnlockedCommission(state, 'commission-2');

    // Commission 2 has 1,500 construction budget (independent, non-cumulative)
    const beforePurchaseBudget = calculateBudgetSummary(
      state.commissions[1].constructionBudget,
      1200
    );
    expect(beforePurchaseBudget.totalBudget).toBe(1500);
    expect(beforePurchaseBudget.remainingBudget).toBe(300);
    expect(beforePurchaseBudget.isOverBudget).toBe(false);

    // Spend 50 personal coins on Rabbit Bow Tie
    const purchase = purchaseShopItem(state, 'rabbit-bow-tie');
    expect(purchase.ok).toBe(true);
    state = purchase.state;
    expect(state.wallet.balance).toBe(50);

    // Customer construction budget remains completely untouched
    const afterPurchaseBudget = calculateBudgetSummary(
      state.commissions[1].constructionBudget,
      1200
    );
    expect(afterPurchaseBudget.totalBudget).toBe(1500);
    expect(afterPurchaseBudget.remainingBudget).toBe(300);

    // Over-budget check on customer side does not touch personal wallet
    const overBudget = calculateBudgetSummary(1500, 1850);
    expect(overBudget.isOverBudget).toBe(true);
    expect(overBudget.remainingBudget).toBe(-350);
    expect(state.wallet.balance).toBe(50);
  });

  it('enforces shop purchase limits, duplicate prevention, and cosmetic equipping', () => {
    let state = createInitialFrameworkState();

    // Cannot buy with 0 coins
    const cannotBuy = evaluateShopPurchase(state, 'rabbit-bow-tie');
    expect(cannotBuy.canBuy).toBe(false);
    const failed = purchaseShopItem(state, 'rabbit-bow-tie');
    expect(failed.ok).toBe(false);
    expect(state.wallet.balance).toBe(0);

    // Grant 500 coins via teacher adjustment for test
    const adjusted = adjustWallet(state.wallet, 500, 'Test grant');
    expect(adjusted.ok).toBe(true);
    state = { ...state, wallet: adjusted.wallet };

    // Buy Starry Studio Theme (200) and Elegant Studio Theme (300)
    state = purchaseShopItem(state, 'starry-studio-theme').state;
    expect(state.wallet.balance).toBe(300);
    expect(getActiveStudioTheme(state.inventory)).toBe('starry');

    // Prevent duplicate purchase
    const dup = purchaseShopItem(state, 'starry-studio-theme');
    expect(dup.ok).toBe(false);
    expect(state.wallet.balance).toBe(300);

    // Buy Elegant Studio Theme (300) -> balance becomes 0 cleanly
    state = purchaseShopItem(state, 'elegant-studio-theme').state;
    expect(state.wallet.balance).toBe(0);
    expect(getActiveStudioTheme(state.inventory)).toBe('elegant');

    // Switch back to Starry and unequip to default
    state = equipShopItem(state, 'starry-studio-theme');
    expect(getActiveStudioTheme(state.inventory)).toBe('starry');
    state = unequipShopItem(state, 'starry-studio-theme');
    expect(getActiveStudioTheme(state.inventory)).toBe('default');
  });

  it('prevents negative wallet adjustments and masks locked achievements from students', () => {
    const state = createInitialFrameworkState();

    // Cannot reduce wallet below 0
    const badAdjust = adjustWallet(state.wallet, -10, 'Invalid');
    expect(badAdjust.ok).toBe(false);

    // Student view masks locked commissions 2-5
    const studentView = getVisibleAchievementList(state, {
      includeSpoilersForTeacher: false,
    });
    expect(studentView[0].revealed).toBe(true); // Commission 1 active
    expect(studentView[1].revealed).toBe(false);
    expect(studentView[1].displayTitle).toBe('Locked Honor #2');

    // Teacher view sees full titles
    const teacherView = getVisibleAchievementList(state, {
      includeSpoilersForTeacher: true,
    });
    expect(teacherView[1].revealed).toBe(true);
    expect(teacherView[1].displayTitle).toBe('Building Designer');
  });

  it('preserves immutable portfolio snapshots even after commission edits and exports HTML/JSON', () => {
    let state = createInitialFrameworkState();
    const sub = createSubmission(state, {
      commissionId: 'commission-1',
      projectTitle: 'Original Meadow Box',
      notes: 'Drawn in SVG',
      reportedCost: 640,
      imageArtifactId: 'art-pf-1',
      source: 'workspace',
    });
    state = approveCommissionSubmission(sub.state, {
      commissionId: 'commission-1',
      submissionId: sub.submissionId!,
    });

    // Teacher later edits Commission 1 title & budget
    state = updateCommissionConfig(state, 'commission-1', {
      title: 'Edited Future Title',
      constructionBudget: 9999,
    });

    // Existing portfolio entry keeps the original snapshot!
    expect(state.portfolio[0].commissionTitle).toBe('My First Room');
    expect(state.portfolio[0].constructionBudgetSnapshot).toBe(1000);

    const artifacts = {
      'art-pf-1': 'data:image/png;base64,AAAA',
    };
    const jsonOut = buildPortfolioJsonExport(
      state.portfolio,
      artifacts,
      state.preferences.studioTitle,
      'Junior Architect'
    );
    expect(jsonOut).toContain('Original Meadow Box');
    expect(jsonOut).toContain('data:image/png;base64,AAAA');

    const htmlOut = buildPortfolioHtmlExport(
      state.portfolio,
      artifacts,
      state.preferences.studioTitle,
      'Junior Architect'
    );
    expect(htmlOut).toContain('<!doctype html>');
    expect(htmlOut).toContain('Original Meadow Box');
    expect(htmlOut).toContain('My First Room');
  });

  it('supports teacher creating additional commissions and manual unlocking', () => {
    let state = createInitialFrameworkState();
    state = manuallyUnlockCommission(state, 'commission-3', true);
    expect(state.commissionProgress['commission-3'].unlockState).toBe('active');
    expect(state.activeCommissionId).toBe('commission-3');

    state = createCustomCommission(state, {
      title: 'Carrot Conservatory',
      customerDialogue: 'I want a greenhouse for winter carrots!',
      successDialogue: 'What a bright conservatory!',
      requirements: ['Glass roof', 'Planter boxes'],
      dimensions: [{ id: 'd1', label: 'Width', value: '3 metres' }],
      constructionBudget: 6500,
      architectPayment: 450,
    });

    expect(state.commissions).toHaveLength(6);
    expect(state.commissions[5].order).toBe(6);
    expect(state.commissions[5].title).toBe('Carrot Conservatory');
  });
});

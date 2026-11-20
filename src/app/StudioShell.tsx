import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { AchievementsView } from '../components/AchievementsView';
import { CelebrationModal } from '../components/CelebrationModal';
import { CommissionsModal } from '../components/CommissionsModal';
import { CustomerPanel } from '../components/CustomerPanel';
import { DeliveryModal } from '../components/DeliveryModal';
import { PortfolioView } from '../components/PortfolioView';
import { RewardShopView } from '../components/RewardShopView';
import { TeacherGateModal } from '../components/TeacherGateModal';
import { TeacherPanel } from '../components/TeacherPanel';
import { TopNavBar } from '../components/TopNavBar';
import { WorkspaceHost } from '../components/WorkspaceHost';
import {
  getReadyToAcceptCommission,
  getSortedCommissions,
  createInitialFrameworkState,
} from '../framework/commissions/commissionService';
import { getCustomerProfile } from '../framework/customers/customerState';
import {
  clearAllArtifacts,
  getAllArtifacts,
  getArtifactsMap,
  saveArtifact,
} from '../framework/persistence/artifactStore';
import {
  loadFrameworkState,
  saveFrameworkState,
} from '../framework/persistence/frameworkStorage';
import {
  createWorkspaceStorageApi,
  replaceWorkspaceData,
} from '../framework/persistence/workspaceStorage';
import { cloneSerializable } from '../framework/utils/serializable';
import { restoreStudioBackup } from '../framework/persistence/restoreService';
import { listPortfolioSnapshots } from '../framework/portfolio/portfolioService';
import { getArchitectRank } from '../framework/rewards/achievementService';
import {
  getActiveStudioTheme,
  getEquippedCosmeticIds,
  purchaseShopItem,
} from '../framework/rewards/shopService';
import { playStudioSound } from '../framework/sound/soundEngine';
import { studioReducer } from '../framework/studioReducer';
import type { ActiveTab, CostItem } from '../framework/types';
import { createUniqueId } from '../framework/utils/id';
import type {
  WorkspaceArtifact,
  WorkspaceBridge,
  WorkspaceDeliverableStatus,
  WorkspaceDeliveryDraft,
} from '../workspace/integration';
import styles from './StudioShell.module.css';

const EMPTY_WORKSPACE_STATUS: WorkspaceDeliverableStatus = {
  projectName: null,
  estimatedCost: null,
  itemizedCosts: [],
  hasDeliverable: false,
};

export function StudioShell() {
  const initialLoadRef = useRef<ReturnType<typeof loadFrameworkState> | null>(
    null
  );
  if (!initialLoadRef.current) {
    initialLoadRef.current = loadFrameworkState();
  }

  const [state, dispatch] = useReducer(
    studioReducer,
    initialLoadRef.current.state
  );
  const persistenceBlockedRef = useRef(
    Boolean(initialLoadRef.current.writeBlocked)
  );
  const [corruptedBanner, setCorruptedBanner] = useState<string | null>(
    initialLoadRef.current.corruptedRecovered
      ? (initialLoadRef.current.errorMessage ??
          'Previous studio save appeared corrupted and was safely backed up.')
      : null
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>('studio');
  const [artifacts, setArtifacts] = useState<Record<string, string>>({});
  const [workspaceFullscreen, setWorkspaceFullscreen] = useState(false);
  const [workspaceEpoch, setWorkspaceEpoch] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const deliverySequence = useRef(0);
  const activeCommissionIdRef = useRef(state.activeCommissionId);
  activeCommissionIdRef.current = state.activeCommissionId;
  const [workspaceStatus, setWorkspaceStatus] =
    useState<WorkspaceDeliverableStatus>(EMPTY_WORKSPACE_STATUS);
  const workspaceStatusRef = useRef(workspaceStatus);
  workspaceStatusRef.current = workspaceStatus;

  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [deliveryDraft, setDeliveryDraft] =
    useState<WorkspaceDeliveryDraft | null>(null);
  const [commissionsModalOpen, setCommissionsModalOpen] = useState(false);
  const [teacherGateOpen, setTeacherGateOpen] = useState(false);
  const [teacherPanelOpen, setTeacherPanelOpen] = useState(false);

  const workspaceStorage = useMemo(() => createWorkspaceStorageApi(), []);
  const snapshotProviderRef = useRef<
    (() => Promise<WorkspaceArtifact | null> | WorkspaceArtifact | null) | null
  >(null);
  const projectDataProviderRef = useRef<(() => unknown | null) | null>(null);

  const activeTheme = getActiveStudioTheme(state.inventory);
  const equippedItemIds = getEquippedCosmeticIds(state.inventory);
  const earnedCount = Object.keys(state.earnedAchievements).length;
  const architectRank = getArchitectRank(earnedCount);

  const sortedCommissions = useMemo(() => getSortedCommissions(state), [state]);
  const completedCount = useMemo(
    () =>
      Object.values(state.commissionProgress).filter(
        (p) => p.unlockState === 'completed'
      ).length,
    [state.commissionProgress]
  );

  const activeCommission =
    sortedCommissions.find((c) => c.id === state.activeCommissionId) ??
    sortedCommissions[0];
  const activeProgress = state.commissionProgress[activeCommission.id];
  const activeSubmission = activeProgress?.activeSubmissionId
    ? state.submissions[activeProgress.activeSubmissionId]
    : undefined;
  const latestFeedback = activeProgress?.latestFeedbackId
    ? state.feedbackHistory[activeProgress.latestFeedbackId]
    : undefined;
  const nextReadyCommission = getReadyToAcceptCommission(state);

  // Sync theme and reduced motion attributes
  useEffect(() => {
    const root = document.documentElement;
    if (activeTheme === 'default') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', activeTheme);
    }
    root.setAttribute(
      'data-reduced-motion',
      String(state.preferences.reducedMotion)
    );
    document.title = state.preferences.studioTitle;
  }, [
    activeTheme,
    state.preferences.reducedMotion,
    state.preferences.studioTitle,
  ]);

  // Persist framework state cleanly on every state change
  useEffect(() => {
    setSaveError(
      !persistenceBlockedRef.current && saveFrameworkState(state)
        ? null
        : 'Your progress could not be saved on this computer. Keep this page open and export a full backup in Teacher controls before closing it.'
    );
  }, [state]);

  // Hydrate referenced artifact images from IndexedDB / local fallback
  useEffect(() => {
    const neededIds: string[] = [];
    for (const sub of Object.values(state.submissions)) {
      if (sub.imageArtifactId) {
        neededIds.push(sub.imageArtifactId);
      }
    }
    for (const entry of listPortfolioSnapshots(state.portfolio)) {
      if (entry.imageArtifactId) {
        neededIds.push(entry.imageArtifactId);
      }
    }
    if (state.activeCelebration?.imageArtifactId) {
      neededIds.push(state.activeCelebration.imageArtifactId);
    }
    if (neededIds.length === 0) {
      return;
    }
    let cancelled = false;
    void getArtifactsMap(neededIds).then((loaded) => {
      if (!cancelled && Object.keys(loaded).length > 0) {
        setArtifacts((prev) => ({ ...loaded, ...prev }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [state.submissions, state.portfolio, state.activeCelebration]);

  // Escape exits workspace fullscreen
  useEffect(() => {
    if (!workspaceFullscreen) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setWorkspaceFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [workspaceFullscreen]);

  const openDeliveryDialogWithDraft = useCallback(
    async (explicitDraft?: WorkspaceDeliveryDraft) => {
      const sequence = ++deliverySequence.current;
      const commissionId = activeCommissionIdRef.current;
      setDeliveryError(null);
      let draft: WorkspaceDeliveryDraft = {
        projectTitle:
          explicitDraft?.projectTitle ??
          workspaceStatusRef.current.projectName ??
          undefined,
        notes: explicitDraft?.notes,
        reportedCost:
          explicitDraft?.reportedCost !== undefined
            ? explicitDraft.reportedCost
            : workspaceStatusRef.current.estimatedCost,
        itemizedCosts:
          explicitDraft?.itemizedCosts ??
          workspaceStatusRef.current.itemizedCosts,
        artifact: explicitDraft?.artifact
          ? { ...explicitDraft.artifact }
          : null,
        projectData: explicitDraft?.projectData,
      };
      try {
        if (draft.projectData === undefined && projectDataProviderRef.current)
          draft.projectData = projectDataProviderRef.current() ?? undefined;
        if (draft.projectData !== undefined)
          draft.projectData = cloneSerializable(draft.projectData);
        if (draft.itemizedCosts)
          draft.itemizedCosts = cloneSerializable(draft.itemizedCosts);
      } catch {
        setDeliveryError(
          'Project data could not be captured. Save plain JSON project data, then try Deliver Design again.'
        );
        return;
      }

      if (!draft.artifact && snapshotProviderRef.current) {
        try {
          const snap = await snapshotProviderRef.current();
          if (snap) {
            draft = { ...draft, artifact: { ...snap } };
          }
        } catch {
          // Allow student to attach manually if snapshot fails
          setDeliveryError(
            'The workspace image could not be captured. Please attach a screenshot in the delivery form.'
          );
        }
      }

      if (
        sequence !== deliverySequence.current ||
        commissionId !== activeCommissionIdRef.current
      )
        return;

      setDeliveryDraft(draft);
      setDeliveryModalOpen(true);
    },
    []
  );

  const toggleFullscreen = useCallback(() => {
    setWorkspaceFullscreen((prev) => !prev);
  }, []);

  const workspaceBridge: WorkspaceBridge = useMemo(
    () => ({
      context: {
        activeCommission: {
          id: activeCommission.id,
          order: activeCommission.order,
          title: activeCommission.title,
          customerName: getCustomerProfile(activeCommission.customerId).name,
          constructionBudget: activeCommission.constructionBudget,
          requirements: activeCommission.requirements.map((r) => ({ ...r })),
          dimensions: activeCommission.dimensions.map((d) => ({ ...d })),
        },
        theme: activeTheme,
        reducedMotion: state.preferences.reducedMotion,
        isFullscreen: workspaceFullscreen,
        toggleFullscreen,
      },
      storage: workspaceStorage,
      reportStatus: (partial) => {
        if (
          partial.estimatedCost !== undefined &&
          partial.estimatedCost !== null &&
          (!Number.isFinite(partial.estimatedCost) || partial.estimatedCost < 0)
        )
          throw new Error(
            'Estimated cost must be a finite, non-negative number.'
          );
        const patch = { ...partial };
        if (patch.itemizedCosts)
          patch.itemizedCosts = cloneSerializable(patch.itemizedCosts);
        const next = { ...workspaceStatusRef.current, ...patch };
        if (
          JSON.stringify(workspaceStatusRef.current) !== JSON.stringify(next)
        ) {
          workspaceStatusRef.current = next;
          setWorkspaceStatus(next);
        }
      },
      registerSnapshotProvider: (provider) => {
        snapshotProviderRef.current = provider;
      },
      registerProjectDataProvider: (provider) => {
        projectDataProviderRef.current = provider;
      },
      requestDelivery: (draft) => {
        void openDeliveryDialogWithDraft(draft);
      },
    }),
    [
      activeCommission,
      activeTheme,
      state.preferences.reducedMotion,
      workspaceFullscreen,
      toggleFullscreen,
      workspaceStorage,
      openDeliveryDialogWithDraft,
    ]
  );

  const handleSubmitDelivery = async (payload: {
    projectTitle: string;
    notes: string;
    reportedCost: number | null;
    itemizedCosts?: CostItem[];
    imageDataUrl: string;
    projectData?: unknown;
    source: 'manual' | 'workspace';
  }) => {
    const projectData =
      payload.projectData === undefined
        ? undefined
        : cloneSerializable(payload.projectData);
    const artifactId = createUniqueId('art');
    await saveArtifact(artifactId, payload.imageDataUrl);
    setArtifacts((prev) => ({ ...prev, [artifactId]: payload.imageDataUrl }));

    dispatch({
      type: 'SUBMIT_DESIGN',
      payload: {
        commissionId: activeCommission.id,
        projectTitle: payload.projectTitle,
        notes: payload.notes,
        reportedCost: payload.reportedCost,
        itemizedCosts: payload.itemizedCosts,
        imageArtifactId: artifactId,
        projectData,
        source: payload.source,
      },
    });
    playStudioSound('submit', state.preferences.soundEnabled);
    setDeliveryModalOpen(false);
    setDeliveryDraft(null);
  };

  const handleBuyShopItem = (itemId: string) => {
    const result = purchaseShopItem(state, itemId);
    if (!result.ok) {
      return;
    }
    dispatch({ type: 'PURCHASE_SHOP_ITEM', payload: { itemId } });
    playStudioSound('coin', state.preferences.soundEnabled);
  };

  const handleAcceptNextCommission = (commissionId: string) => {
    dispatch({ type: 'ACCEPT_COMMISSION', payload: { commissionId } });
    setWorkspaceStatus(EMPTY_WORKSPACE_STATUS);
    setActiveTab('studio');
    playStudioSound('chime', state.preferences.soundEnabled);
  };

  const celebrationNextCommission = state.activeCelebration?.nextCommissionId
    ? state.commissions.find(
        (c) => c.id === state.activeCelebration?.nextCommissionId
      )
    : undefined;

  return (
    <div
      className={styles.appFrame}
      data-theme={activeTheme === 'default' ? undefined : activeTheme}
      data-reduced-motion={String(state.preferences.reducedMotion)}
    >
      <TopNavBar
        studioTitle={state.preferences.studioTitle}
        architectRank={architectRank}
        walletBalance={state.wallet.balance}
        completedCount={completedCount}
        totalCount={sortedCommissions.length}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setWorkspaceFullscreen(false);
        }}
        onOpenCommissions={() => setCommissionsModalOpen(true)}
        onOpenTeacherControls={() => setTeacherGateOpen(true)}
        soundEnabled={state.preferences.soundEnabled}
        onToggleSound={() =>
          dispatch({
            type: 'UPDATE_PREFERENCES',
            payload: { soundEnabled: !state.preferences.soundEnabled },
          })
        }
        reducedMotion={state.preferences.reducedMotion}
        onToggleReducedMotion={() =>
          dispatch({
            type: 'UPDATE_PREFERENCES',
            payload: { reducedMotion: !state.preferences.reducedMotion },
          })
        }
        equippedItemIds={equippedItemIds}
        hasPendingCommissionAccept={Boolean(nextReadyCommission)}
      />

      {corruptedBanner && (
        <div className={styles.recoveryBanner} role="status">
          <span>
            <strong>Recovery notice:</strong> {corruptedBanner}
          </span>
          <button
            type="button"
            className={styles.recoveryClose}
            onClick={() => setCorruptedBanner(null)}
          >
            Dismiss
          </button>
        </div>
      )}
      {saveError && (
        <div className={styles.recoveryBanner} role="alert">
          <span>{saveError}</span>
        </div>
      )}
      {deliveryError && (
        <div className={styles.recoveryBanner} role="alert">
          <span>{deliveryError}</span>
          <button
            className={styles.recoveryClose}
            onClick={() => setDeliveryError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {
        <div
          className={styles.studioMain}
          style={activeTab === 'studio' ? undefined : { display: 'none' }}
        >
          <CustomerPanel
            commission={activeCommission}
            progress={activeProgress}
            submission={activeSubmission}
            submissionImageUrl={
              activeSubmission
                ? (artifacts[activeSubmission.imageArtifactId] ?? null)
                : null
            }
            latestFeedback={latestFeedback}
            equippedItemIds={equippedItemIds}
            reducedMotion={state.preferences.reducedMotion}
            workspaceStatus={workspaceStatus}
            nextReadyCommission={nextReadyCommission}
            onOpenDelivery={() => void openDeliveryDialogWithDraft()}
            onAcceptNextCommission={handleAcceptNextCommission}
          />

          <WorkspaceHost
            key={workspaceEpoch}
            bridge={workspaceBridge}
            workspaceStatus={workspaceStatus}
            isFullscreen={workspaceFullscreen}
            onToggleFullscreen={toggleFullscreen}
            onOpenDelivery={() => void openDeliveryDialogWithDraft()}
          />
        </div>
      }

      {activeTab === 'portfolio' && (
        <PortfolioView
          entries={state.portfolio}
          artifacts={artifacts}
          studioTitle={state.preferences.studioTitle}
          architectRank={architectRank}
          onBackToStudio={() => setActiveTab('studio')}
        />
      )}

      {activeTab === 'achievements' && (
        <AchievementsView
          state={state}
          architectRank={architectRank}
          equippedItemIds={equippedItemIds}
        />
      )}

      {activeTab === 'shop' && (
        <RewardShopView
          state={state}
          equippedItemIds={equippedItemIds}
          onBuyItem={handleBuyShopItem}
          onEquipItem={(itemId) => {
            dispatch({ type: 'EQUIP_SHOP_ITEM', payload: { itemId } });
            playStudioSound('chime', state.preferences.soundEnabled);
          }}
          onUnequipItem={(itemId) =>
            dispatch({ type: 'UNEQUIP_SHOP_ITEM', payload: { itemId } })
          }
        />
      )}

      {/* Modals */}
      {deliveryModalOpen && (
        <DeliveryModal
          commission={activeCommission}
          initialDraft={deliveryDraft}
          onClose={() => {
            setDeliveryModalOpen(false);
            setDeliveryDraft(null);
          }}
          onSubmit={handleSubmitDelivery}
        />
      )}

      {commissionsModalOpen && (
        <CommissionsModal
          commissions={state.commissions}
          progressMap={state.commissionProgress}
          activeCommissionId={state.activeCommissionId}
          onSelectActive={(commissionId) => {
            dispatch({ type: 'SWITCH_COMMISSION', payload: { commissionId } });
            setActiveTab('studio');
          }}
          onAcceptUnlocked={handleAcceptNextCommission}
          onClose={() => setCommissionsModalOpen(false)}
        />
      )}

      {state.activeCelebration && (
        <CelebrationModal
          celebration={state.activeCelebration}
          nextCommission={celebrationNextCommission}
          submissionImageUrl={
            artifacts[state.activeCelebration.imageArtifactId] ?? null
          }
          equippedItemIds={equippedItemIds}
          reducedMotion={state.preferences.reducedMotion}
          onDismiss={() => dispatch({ type: 'DISMISS_CELEBRATION' })}
          onAcceptNext={handleAcceptNextCommission}
        />
      )}

      {teacherGateOpen && (
        <TeacherGateModal
          onCancel={() => setTeacherGateOpen(false)}
          onConfirm={() => {
            setTeacherGateOpen(false);
            setTeacherPanelOpen(true);
          }}
        />
      )}

      {teacherPanelOpen && (
        <TeacherPanel
          state={state}
          artifacts={artifacts}
          onMarkUnderReview={(commissionId, submissionId) =>
            dispatch({
              type: 'MARK_UNDER_REVIEW',
              payload: { commissionId, submissionId },
            })
          }
          onApproveSubmission={(input) => {
            const target = state.commissions.find(
              (c) => c.id === input.commissionId
            );
            dispatch({ type: 'APPROVE_SUBMISSION', payload: input });
            playStudioSound(
              target?.isGrandFinale ? 'grandFinale' : 'celebrate',
              state.preferences.soundEnabled
            );
          }}
          onRequestRevision={(input) => {
            dispatch({ type: 'REQUEST_REVISION', payload: input });
            playStudioSound('revision', state.preferences.soundEnabled);
          }}
          onUnlockCommission={(commissionId, activateImmediately) =>
            dispatch({
              type: 'TEACHER_UNLOCK_COMMISSION',
              payload: { commissionId, activateImmediately },
            })
          }
          onReopenCommission={(commissionId) =>
            dispatch({
              type: 'TEACHER_REOPEN_COMMISSION',
              payload: { commissionId },
            })
          }
          onSwitchCommission={(commissionId) => {
            dispatch({
              type: 'SWITCH_COMMISSION',
              payload: { commissionId },
            });
            setActiveTab('studio');
          }}
          onUpdateCommission={(commissionId, patch) =>
            dispatch({
              type: 'TEACHER_UPDATE_COMMISSION',
              payload: { commissionId, patch },
            })
          }
          onCreateCommission={(input) =>
            dispatch({ type: 'TEACHER_CREATE_COMMISSION', payload: input })
          }
          onAdjustWallet={(delta, reason) =>
            dispatch({
              type: 'TEACHER_ADJUST_WALLET',
              payload: { delta, reason },
            })
          }
          onUpdateStudioTitle={(studioTitle) =>
            dispatch({
              type: 'UPDATE_PREFERENCES',
              payload: { studioTitle },
            })
          }
          onExportFullBackup={async () => {
            const all = await getAllArtifacts();
            return { ...all, ...artifacts };
          }}
          onExportWorkspaceData={() => workspaceStorage.exportAll()}
          onImportBackup={async (backup, importWorkspace) => {
            deliverySequence.current++;
            setDeliveryModalOpen(false);
            const restored = await restoreStudioBackup(
              backup,
              workspaceStorage,
              importWorkspace
            );
            setArtifacts(restored.artifacts);
            snapshotProviderRef.current = null;
            projectDataProviderRef.current = null;
            setWorkspaceStatus(EMPTY_WORKSPACE_STATUS);
            setWorkspaceEpoch((epoch) => epoch + 1);
            dispatch({
              type: 'REPLACE_STATE',
              payload: restored.state,
            });
            persistenceBlockedRef.current = false;
          }}
          onResetProgress={async (clearWorkspace) => {
            const fresh = createInitialFrameworkState();
            const previousWorkspace = clearWorkspace
              ? workspaceStorage.exportAll()
              : undefined;
            if (clearWorkspace) replaceWorkspaceData(workspaceStorage, {});
            if (!saveFrameworkState(fresh)) {
              if (previousWorkspace)
                replaceWorkspaceData(workspaceStorage, previousWorkspace);
              throw new Error(
                'Progress could not be reset because browser storage is unavailable. Existing progress was retained.'
              );
            }
            deliverySequence.current++;
            setDeliveryModalOpen(false);
            persistenceBlockedRef.current = false;
            setArtifacts({});
            setWorkspaceStatus(EMPTY_WORKSPACE_STATUS);
            snapshotProviderRef.current = null;
            projectDataProviderRef.current = null;
            setWorkspaceEpoch((epoch) => epoch + 1);
            dispatch({ type: 'RESET_ALL' });
            try {
              await clearAllArtifacts();
            } catch {
              setDeliveryError(
                'Progress was reset, but some unused images could not be removed from browser storage.'
              );
            }
          }}
          onClose={() => setTeacherPanelOpen(false)}
        />
      )}
    </div>
  );
}

import type { WorkspaceStorageApi } from '../framework/persistence/workspaceStorage';
import type { StudioThemeId } from '../framework/types';

export type { WorkspaceStorageApi };

/**
 * Generic itemized expense line reported by workspace tools.
 * Intentionally avoids architectural entity names so the student defines them.
 */
export interface WorkspaceCostItem {
  id: string;
  label: string;
  category?: string;
  quantity?: number;
  unitCost?: number;
  totalCost: number;
}

/**
 * Rendered image or screenshot captured from the student's workspace.
 */
export interface WorkspaceArtifact {
  dataUrl: string;
  mimeType?: string;
  width?: number;
  height?: number;
}

/**
 * Live status published by the student's workspace to the studio framework.
 */
export interface WorkspaceDeliverableStatus {
  projectName: string | null;
  estimatedCost: number | null;
  itemizedCosts?: WorkspaceCostItem[];
  hasDeliverable: boolean;
  statusNote?: string;
}

/**
 * Optional pre-filled submission payload when the workspace requests delivery.
 */
export interface WorkspaceDeliveryDraft {
  projectTitle?: string;
  notes?: string;
  reportedCost?: number | null;
  itemizedCosts?: WorkspaceCostItem[];
  artifact?: WorkspaceArtifact | null;
  projectData?: unknown;
}

/**
 * Read-only summary of the active customer commission exposed to the workspace.
 */
export interface WorkspaceCommissionSummary {
  id: string;
  order: number;
  title: string;
  customerName: string;
  constructionBudget: number;
  requirements: Array<{ id: string; text: string }>;
  dimensions: Array<{ id: string; label: string; value: string }>;
}

/**
 * Documented contract connecting the student's architectural workspace to
 * Himari's Architecture Studio framework.
 */
export interface WorkspaceBridge {
  context: {
    activeCommission: WorkspaceCommissionSummary;
    theme: StudioThemeId;
    reducedMotion: boolean;
    isFullscreen: boolean;
    toggleFullscreen: () => void;
  };
  /** Isolated persistence dedicated solely to workspace data. */
  storage: WorkspaceStorageApi;
  /** Report current project name, estimated cost, itemized breakdown, or readiness. */
  reportStatus: (status: Partial<WorkspaceDeliverableStatus>) => void;
  /** Register a snapshot/image capture callback invoked when Himari clicks Deliver Design. */
  registerSnapshotProvider: (
    provider: (() => Promise<WorkspaceArtifact | null> | WorkspaceArtifact | null) | null
  ) => void;
  /** Register a JSON-serializable state exporter stored alongside submissions. */
  registerProjectDataProvider: (provider: (() => unknown | null) | null) => void;
  /** Open the framework delivery dialog optionally pre-populated with workspace data. */
  requestDelivery: (draft?: WorkspaceDeliveryDraft) => void;
}

export interface ArchitectureWorkspaceProps {
  bridge: WorkspaceBridge;
}

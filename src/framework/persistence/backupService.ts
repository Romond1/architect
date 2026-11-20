import { getArchitectRank } from '../rewards/achievementService';
import type { FrameworkState } from '../types';
import { validateFrameworkState } from './schema';
import { isSerializable } from '../utils/serializable';
import { listPortfolioSnapshots } from '../portfolio/portfolioService';

export const BACKUP_FORMAT_ID = 'himari-architecture-studio-backup';
export const BACKUP_FORMAT_VERSION = 1;

export interface StudioBackupFile {
  format: typeof BACKUP_FORMAT_ID;
  backupVersion: typeof BACKUP_FORMAT_VERSION;
  exportedAt: string;
  frameworkState: FrameworkState;
  artifacts: Record<string, string>;
  workspaceData?: Record<string, unknown>;
}

export interface ParsedBackupPreview {
  valid: boolean;
  error?: string;
  backup?: StudioBackupFile;
  summary?: {
    exportedAt: string;
    studioTitle: string;
    completedCommissions: number;
    totalCommissions: number;
    walletBalance: number;
    rank: string;
    portfolioCount: number;
    artifactCount: number;
    hasWorkspaceData: boolean;
  };
}

export function createFullBackup(
  state: FrameworkState,
  artifacts: Record<string, string>,
  workspaceData?: Record<string, unknown>
): StudioBackupFile {
  return {
    format: BACKUP_FORMAT_ID,
    backupVersion: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    frameworkState: state,
    artifacts: { ...artifacts },
    workspaceData:
      workspaceData && Object.keys(workspaceData).length > 0
        ? { ...workspaceData }
        : undefined,
  };
}

export function serializeBackup(backup: StudioBackupFile): string {
  return JSON.stringify(backup, null, 2);
}

export function parseAndValidateBackup(
  jsonString: string
): ParsedBackupPreview {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return {
      valid: false,
      error: 'The selected file is not valid JSON.',
    };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {
      valid: false,
      error: 'Backup file must contain a JSON object.',
    };
  }

  const candidate = parsed as Record<string, unknown>;
  if (candidate.format !== BACKUP_FORMAT_ID) {
    return {
      valid: false,
      error: 'This file does not appear to be a Himari Studio backup.',
    };
  }
  if (
    typeof candidate.backupVersion !== 'number' ||
    candidate.backupVersion !== BACKUP_FORMAT_VERSION
  ) {
    return {
      valid: false,
      error: 'Unsupported backup format version.',
    };
  }

  const stateCheck = validateFrameworkState(candidate.frameworkState);
  if (!stateCheck.valid) {
    return {
      valid: false,
      error: `Invalid studio state inside backup: ${stateCheck.error}`,
    };
  }

  const artifactsObj: Record<string, string> = {};
  if (
    candidate.artifacts &&
    typeof candidate.artifacts === 'object' &&
    !Array.isArray(candidate.artifacts)
  ) {
    for (const [k, v] of Object.entries(
      candidate.artifacts as Record<string, unknown>
    )) {
      if (typeof v === 'string') {
        artifactsObj[k] = v;
      }
    }
  }

  const workspaceData =
    candidate.workspaceData &&
    typeof candidate.workspaceData === 'object' &&
    !Array.isArray(candidate.workspaceData)
      ? (candidate.workspaceData as Record<string, unknown>)
      : undefined;

  const fw = candidate.frameworkState as FrameworkState;
  const requiredImages = new Set([
    ...Object.values(fw.submissions).map((s) => s.imageArtifactId),
    ...listPortfolioSnapshots(fw.portfolio).map((p) => p.imageArtifactId),
    ...(fw.activeCelebration ? [fw.activeCelebration.imageArtifactId] : []),
  ]);
  if (
    [...requiredImages].some(
      (id) =>
        !/^data:image\/(png|jpeg|jpg|webp|svg\+xml|gif);(?:base64,|utf8,|charset=utf-8,)/i.test(
          artifactsObj[id] ?? ''
        )
    )
  ) {
    return {
      valid: false,
      error:
        'The backup is missing a required design image or contains an unsupported image artifact.',
    };
  }
  if (
    candidate.workspaceData !== undefined &&
    (!workspaceData || !isSerializable(workspaceData))
  ) {
    return { valid: false, error: 'Invalid workspace data in backup.' };
  }
  const completedCommissions = Object.values(fw.commissionProgress).filter(
    (p) => p.unlockState === 'completed'
  ).length;

  const backup: StudioBackupFile = {
    format: BACKUP_FORMAT_ID,
    backupVersion: BACKUP_FORMAT_VERSION,
    exportedAt:
      typeof candidate.exportedAt === 'string'
        ? candidate.exportedAt
        : new Date().toISOString(),
    frameworkState: fw,
    artifacts: artifactsObj,
    workspaceData,
  };

  return {
    valid: true,
    backup,
    summary: {
      exportedAt: backup.exportedAt,
      studioTitle: fw.preferences.studioTitle,
      completedCommissions,
      totalCommissions: fw.commissions.length,
      walletBalance: fw.wallet.balance,
      rank: getArchitectRank(Object.keys(fw.earnedAchievements).length),
      portfolioCount: fw.portfolio.length,
      artifactCount: Object.keys(artifactsObj).length,
      hasWorkspaceData: Boolean(
        workspaceData && Object.keys(workspaceData).length > 0
      ),
    },
  };
}

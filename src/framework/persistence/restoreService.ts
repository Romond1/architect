import type { FrameworkState } from '../types';
import { listPortfolioSnapshots } from '../portfolio/portfolioService';
import { createUniqueId } from '../utils/id';
import { saveArtifact } from './artifactStore';
import {
  parseAndValidateBackup,
  serializeBackup,
  type StudioBackupFile,
} from './backupService';
import { saveFrameworkState } from './frameworkStorage';
import {
  replaceWorkspaceData,
  type WorkspaceStorageApi,
} from './workspaceStorage';

/** Validate and stage restored images under new IDs so a failed import cannot
 * overwrite images still referenced by the current portfolio. */
export async function restoreStudioBackup(
  backup: StudioBackupFile,
  workspace: WorkspaceStorageApi,
  importWorkspace: boolean
): Promise<{ state: FrameworkState; artifacts: Record<string, string> }> {
  const checked = parseAndValidateBackup(serializeBackup(backup));
  if (!checked.valid || !checked.backup)
    throw new Error(checked.error ?? 'Invalid backup.');
  const restored = checked.backup;
  const artifacts: Record<string, string> = {};
  const replacements = new Map<string, string>();
  for (const [oldId, image] of Object.entries(restored.artifacts)) {
    const newId = createUniqueId('restored-art');
    await saveArtifact(newId, image);
    replacements.set(oldId, newId);
    artifacts[newId] = image;
  }
  const state = restored.frameworkState;
  for (const sub of Object.values(state.submissions))
    sub.imageArtifactId = replacements.get(sub.imageArtifactId)!;
  for (const entry of listPortfolioSnapshots(state.portfolio))
    entry.imageArtifactId = replacements.get(entry.imageArtifactId)!;
  if (state.activeCelebration)
    state.activeCelebration.imageArtifactId = replacements.get(
      state.activeCelebration.imageArtifactId
    )!;
  const restoreWorkspace =
    importWorkspace && restored.workspaceData !== undefined;
  const previousWorkspace = restoreWorkspace
    ? workspace.exportAll()
    : undefined;
  if (restoreWorkspace)
    replaceWorkspaceData(workspace, restored.workspaceData!);
  if (!saveFrameworkState(state)) {
    if (previousWorkspace) replaceWorkspaceData(workspace, previousWorkspace);
    throw new Error(
      'The restored progress could not be saved. Existing framework progress was not replaced.'
    );
  }
  return { state, artifacts };
}

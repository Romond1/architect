import { beforeEach, describe, expect, it } from 'vitest';
import { createInitialFrameworkState } from '../framework/commissions/commissionService';
import {
  createFullBackup,
  parseAndValidateBackup,
  serializeBackup,
} from '../framework/persistence/backupService';
import {
  clearFrameworkState,
  CORRUPTED_QUARANTINE_PREFIX,
  FRAMEWORK_STORAGE_KEY,
  loadFrameworkState,
  saveFrameworkState,
} from '../framework/persistence/frameworkStorage';
import { createWorkspaceStorageApi } from '../framework/persistence/workspaceStorage';
import { purchaseShopItem } from '../framework/rewards/shopService';
import {
  approveCommissionSubmission,
  createSubmission,
} from '../framework/submissions/submissionService';

describe('Persistence, Recovery, Isolation & Backup', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists framework progress, wallet, cosmetics, and portfolio across reloads', () => {
    let state = createInitialFrameworkState();
    const sub = createSubmission(state, {
      commissionId: 'commission-1',
      projectTitle: 'Reload Test Design',
      notes: 'Saved before reload',
      reportedCost: 777,
      imageArtifactId: 'art-reload',
      source: 'manual',
    });
    state = approveCommissionSubmission(sub.state, {
      commissionId: 'commission-1',
      submissionId: sub.submissionId!,
    });
    state = purchaseShopItem(state, 'rabbit-bow-tie').state;

    const saved = saveFrameworkState(state);
    expect(saved).toBe(true);

    const reloaded = loadFrameworkState();
    expect(reloaded.corruptedRecovered).toBe(false);
    expect(reloaded.state.wallet.balance).toBe(50);
    expect(reloaded.state.inventory.ownedItemIds).toEqual(['rabbit-bow-tie']);
    expect(reloaded.state.portfolio).toHaveLength(1);
    expect(reloaded.state.portfolio[0].projectTitle).toBe('Reload Test Design');
    expect(reloaded.state.earnedAchievements['junior-architect']).toBeDefined();
  });

  it('quarantines corrupted framework JSON and recovers gracefully without crashing', () => {
    localStorage.setItem(FRAMEWORK_STORAGE_KEY, '{corrupted:not-valid-json');

    const loaded = loadFrameworkState();
    expect(loaded.corruptedRecovered).toBe(true);
    expect(loaded.state.activeCommissionId).toBe('commission-1');
    expect(loaded.state.wallet.balance).toBe(0);

    // Corrupted payload must still be preserved under quarantine key
    const keys = Object.keys(localStorage);
    const quarantinedKey = keys.find((k) =>
      k.startsWith(CORRUPTED_QUARANTINE_PREFIX)
    );
    expect(quarantinedKey).toBeDefined();
    expect(localStorage.getItem(quarantinedKey!)).toBe(
      '{corrupted:not-valid-json'
    );
  });

  it('keeps framework storage and workspace storage strictly isolated', () => {
    const wsStorage = createWorkspaceStorageApi();
    let state = createInitialFrameworkState();
    const sub = createSubmission(state, {
      commissionId: 'commission-1',
      projectTitle: 'Framework Safe',
      notes: '',
      reportedCost: 500,
      imageArtifactId: 'art-iso',
      source: 'workspace',
    });
    state = approveCommissionSubmission(sub.state, {
      commissionId: 'commission-1',
      submissionId: sub.submissionId!,
    });
    saveFrameworkState(state);

    wsStorage.save('floorplan', { width: 4, length: 5 });
    expect(wsStorage.load<{ width: number; length: number }>('floorplan')).toEqual({
      width: 4,
      length: 5,
    });

    // Clearing workspace storage does not alter framework progression
    wsStorage.clear();
    expect(wsStorage.listKeys()).toHaveLength(0);
    expect(loadFrameworkState().state.wallet.balance).toBe(100);

    // Restoring workspace and clearing framework storage leaves workspace intact
    wsStorage.save('floorplan', { width: 4, length: 5 });
    clearFrameworkState();
    expect(loadFrameworkState().state.wallet.balance).toBe(0);
    expect(wsStorage.load<{ width: number; length: number }>('floorplan')).toEqual({
      width: 4,
      length: 5,
    });
  });

  it('exports and imports complete JSON backups with artifacts and rejects malformed files', () => {
    let state = createInitialFrameworkState();
    const sub = createSubmission(state, {
      commissionId: 'commission-1',
      projectTitle: 'Backup Project',
      notes: 'Export test',
      reportedCost: 600,
      imageArtifactId: 'art-b1',
      source: 'manual',
    });
    state = approveCommissionSubmission(sub.state, {
      commissionId: 'commission-1',
      submissionId: sub.submissionId!,
    });

    const backup = createFullBackup(
      state,
      { 'art-b1': 'data:image/png;base64,TESTDATA' },
      { draftName: 'RoomV1' }
    );
    const json = serializeBackup(backup);

    const parsed = parseAndValidateBackup(json);
    expect(parsed.valid).toBe(true);
    expect(parsed.summary?.walletBalance).toBe(100);
    expect(parsed.summary?.completedCommissions).toBe(1);
    expect(parsed.summary?.artifactCount).toBe(1);
    expect(parsed.summary?.hasWorkspaceData).toBe(true);
    expect(parsed.backup?.artifacts['art-b1']).toBe(
      'data:image/png;base64,TESTDATA'
    );

    const invalid = parseAndValidateBackup('{"format":"wrong"}');
    expect(invalid.valid).toBe(false);
    expect(invalid.error).toBeTruthy();

    const invalidJson = parseAndValidateBackup('not json');
    expect(invalidJson.valid).toBe(false);
  });
});

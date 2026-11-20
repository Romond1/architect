import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createInitialFrameworkState,
  reopenCommission,
} from '../framework/commissions/commissionService';
import {
  createSubmission,
  approveCommissionSubmission,
} from '../framework/submissions/submissionService';
import { createWorkspaceStorageApi } from '../framework/persistence/workspaceStorage';
import {
  createFullBackup,
  parseAndValidateBackup,
  serializeBackup,
} from '../framework/persistence/backupService';
import { saveArtifact } from '../framework/persistence/artifactStore';
import { validateFrameworkState } from '../framework/persistence/schema';
import {
  loadFrameworkState,
  FRAMEWORK_STORAGE_KEY,
} from '../framework/persistence/frameworkStorage';
import { restoreStudioBackup } from '../framework/persistence/restoreService';
import { getArtifact } from '../framework/persistence/artifactStore';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});
const input = {
  commissionId: 'commission-1',
  projectTitle: 'Original',
  notes: '',
  reportedCost: 200,
  imageArtifactId: 'saved-image',
  source: 'workspace' as const,
};

describe('Lesson reliability regression coverage', () => {
  it('preserves workspace when a framework-only backup has no workspace section', async () => {
    const storage = createWorkspaceStorageApi();
    storage.save('draft', 'Keep this project');
    await restoreStudioBackup(
      createFullBackup(createInitialFrameworkState(), {}),
      storage,
      true
    );
    expect(storage.load('draft')).toBe('Keep this project');
  });
  it('restores backups without overwriting existing image IDs', async () => {
    await saveArtifact('saved-image', 'data:image/png;base64,ORIGINAL');
    const state = createSubmission(createInitialFrameworkState(), input).state;
    const backup = createFullBackup(state, {
      'saved-image': 'data:image/png;base64,RESTORED',
    });
    const restored = await restoreStudioBackup(
      backup,
      createWorkspaceStorageApi(),
      false
    );
    expect(await getArtifact('saved-image')).toBe(
      'data:image/png;base64,ORIGINAL'
    );
    const restoredId = Object.values(restored.state.submissions)[0]
      .imageArtifactId;
    expect(restoredId).not.toBe('saved-image');
    expect(restored.artifacts[restoredId]).toBe(
      'data:image/png;base64,RESTORED'
    );
  });
  it('rolls back workspace import if framework progress cannot be saved', async () => {
    const workspace = createWorkspaceStorageApi();
    workspace.save('draft', 'Original');
    const previous = localStorage.getItem(FRAMEWORK_STORAGE_KEY);
    const original = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key,
      value
    ) {
      if (key === FRAMEWORK_STORAGE_KEY) throw new Error('Full');
      original.call(this, key, value);
    });
    const backup = createFullBackup(
      createInitialFrameworkState(),
      {},
      { draft: 'Replacement' }
    );
    await expect(restoreStudioBackup(backup, workspace, true)).rejects.toThrow(
      /could not be saved/
    );
    expect(workspace.load('draft')).toBe('Original');
    expect(localStorage.getItem(FRAMEWORK_STORAGE_KEY)).toBe(previous);
  });
  it('blocks replacement of unreadable progress when quarantine storage is full', () => {
    localStorage.setItem(FRAMEWORK_STORAGE_KEY, 'original corrupt save');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Full');
    });
    const loaded = loadFrameworkState();
    expect(loaded.writeBlocked).toBe(true);
    expect(localStorage.getItem(FRAMEWORK_STORAGE_KEY)).toBe(
      'original corrupt save'
    );
  });
  it('freezes serializable project data when evidence is submitted', () => {
    const data = { version: 1, content: { name: 'Original' } };
    const result = createSubmission(createInitialFrameworkState(), {
      ...input,
      projectData: data,
    });
    data.content.name = 'Later edit';
    expect(result.state.submissions[result.submissionId!].projectData).toEqual({
      version: 1,
      content: { name: 'Original' },
    });
  });
  it('rejects non-JSON project state before creating a submission', () => {
    expect(() =>
      createSubmission(createInitialFrameworkState(), {
        ...input,
        projectData: { value: BigInt(1) },
      })
    ).toThrow(/serializ|JSON/i);
  });
  it('preserves the original approved portfolio entry when a commission is reopened', () => {
    const first = createSubmission(createInitialFrameworkState(), input);
    let state = approveCommissionSubmission(first.state, {
      commissionId: input.commissionId,
    });
    const original = structuredClone(state.portfolio[0]);
    state = reopenCommission(state, input.commissionId);
    state = createSubmission(state, {
      ...input,
      projectTitle: 'Revision',
      imageArtifactId: 'revised-image',
    }).state;
    state = approveCommissionSubmission(state, {
      commissionId: input.commissionId,
    });
    expect(state.portfolio[0].previousApprovals?.[0]).toEqual(original);
    expect(state.portfolio[0].projectTitle).toBe('Revision');
    expect(state.wallet.balance).toBe(100);
    expect(
      state.submissions[
        state.commissionProgress[input.commissionId].activeSubmissionId!
      ].projectTitle
    ).toBe('Revision');
  });
  it('surfaces workspace quota failures and keeps the last durable save intact', () => {
    const storage = createWorkspaceStorageApi();
    storage.save('draft', { title: 'Saved' });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });
    expect(() => storage.save('draft', { title: 'Unsaved' })).toThrow(
      /sav|storage/i
    );
    expect(storage.load('draft')).toEqual({ title: 'Saved' });
  });
  it('rejects invalid JSON workspace values instead of writing undefined or lossy data', () => {
    const storage = createWorkspaceStorageApi();
    expect(() => storage.save('draft', undefined)).toThrow();
    expect(() => storage.save('draft', { value: Infinity })).toThrow();
  });
  it('reports failure when neither artifact store can save the evidence', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });
    await expect(
      saveArtifact('failed-artifact', 'data:image/png;base64,TESTDATA')
    ).rejects.toThrow(/sav|storage/i);
  });
  it.each([
    [
      'invalid requirement',
      (s: any) => {
        s.commissions[0].requirements = {};
      },
    ],
    [
      'unknown active commission',
      (s: any) => {
        s.activeCommissionId = 'absent';
      },
    ],
    [
      'non-finite balance',
      (s: any) => {
        s.wallet.balance = NaN;
      },
    ],
    [
      'missing commission progress',
      (s: any) => {
        delete s.commissionProgress['commission-1'];
      },
    ],
    [
      'invalid preferences',
      (s: any) => {
        s.preferences.reducedMotion = 'false';
      },
    ],
  ])('rejects a structurally corrupt save: %s', (_name, mutate) => {
    const state = createInitialFrameworkState();
    mutate(state);
    expect(validateFrameworkState(state).valid).toBe(false);
  });
  it('rejects backups missing the images referenced by submissions', () => {
    const state = createSubmission(createInitialFrameworkState(), input).state;
    expect(
      parseAndValidateBackup(serializeBackup(createFullBackup(state, {}))).valid
    ).toBe(false);
  });
  it('rejects cross-commission review references and malformed itemized expenses', () => {
    const result = createSubmission(createInitialFrameworkState(), input);
    const state = result.state;
    state.commissionProgress['commission-2'].activeSubmissionId =
      result.submissionId!;
    expect(validateFrameworkState(state).valid).toBe(false);
    delete state.commissionProgress['commission-2'].activeSubmissionId;
    (state.submissions[result.submissionId!] as any).itemizedCosts = {};
    expect(validateFrameworkState(state).valid).toBe(false);
  });
});

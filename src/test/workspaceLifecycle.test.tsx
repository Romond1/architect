import { useEffect, useState, type ComponentType } from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  ArchitectureWorkspaceProps,
  WorkspaceBridge,
} from '../workspace/integration';
import { StudioShell } from '../app/StudioShell';
import type { StudioBackupFile } from '../framework/persistence/backupService';
import { createFullBackup } from '../framework/persistence/backupService';
import { createInitialFrameworkState } from '../framework/commissions/commissionService';

const fixture = vi.hoisted(() => ({
  component: null as ComponentType<ArchitectureWorkspaceProps> | null,
  teacher: null as null | {
    onResetProgress: (clear: boolean) => Promise<void>;
    onImportBackup: (
      backup: StudioBackupFile,
      workspace: boolean
    ) => Promise<void>;
  },
}));
vi.mock('../components/TeacherPanel', () => ({
  TeacherPanel: (props: NonNullable<typeof fixture.teacher>) => {
    fixture.teacher = props;
    return <div>Teacher controls for lifecycle test</div>;
  },
}));
vi.mock('../workspace/ArchitectureWorkspace', () => ({
  ArchitectureWorkspace: (props: ArchitectureWorkspaceProps) => {
    const Component = fixture.component;
    return Component ? <Component {...props} /> : <div />;
  },
}));
beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  fixture.component = null;
  vi.restoreAllMocks();
});

describe('Real shell workspace lifecycle', () => {
  it('reloads workspace storage after reset and backup import, with fresh providers', async () => {
    fixture.component = function Editor({ bridge }) {
      const [name, setName] = useState(
        () => bridge.storage.load<string>('draft') ?? ''
      );
      useEffect(() => {
        bridge.registerProjectDataProvider(() => ({ name }));
        return () => bridge.registerProjectDataProvider(null);
      }, [bridge, name]);
      return (
        <input
          aria-label="Restorable project"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            bridge.storage.save('draft', e.target.value);
          }}
        />
      );
    };
    render(<StudioShell />);
    fireEvent.change(screen.getByLabelText('Restorable project'), {
      target: { value: 'Before reset' },
    });
    fireEvent.click(screen.getByTestId('open-teacher-controls-btn'));
    fireEvent.click(screen.getByTestId('confirm-enter-teacher-btn'));
    await act(async () => {
      await fixture.teacher!.onResetProgress(true);
    });
    expect(screen.getByLabelText('Restorable project')).toHaveValue('');
    const backup = createFullBackup(
      createInitialFrameworkState(),
      {},
      { draft: 'From backup' }
    );
    await act(async () => {
      await fixture.teacher!.onImportBackup(backup, true);
    });
    expect(screen.getByLabelText('Restorable project')).toHaveValue(
      'From backup'
    );
  });
  it('does not recreate the bridge or loop when a workspace effect reports status', async () => {
    let effects = 0;
    fixture.component = function Reporter({ bridge }) {
      useEffect(() => {
        effects++;
        if (effects < 5)
          bridge.reportStatus({
            projectName: 'Lesson',
            estimatedCost: 123,
            hasDeliverable: true,
          });
      }, [bridge]);
      return <div>Test workspace</div>;
    };
    render(<StudioShell />);
    await waitFor(() =>
      expect(screen.getByTestId('budget-reported')).toHaveTextContent(
        '123 coins'
      )
    );
    expect(effects).toBe(1);
  });
  it('preserves an unfinished workspace when visiting another studio tab', () => {
    fixture.component = function Editor() {
      const [name, setName] = useState('');
      return (
        <input
          aria-label="Lesson project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      );
    };
    render(<StudioShell />);
    fireEvent.change(screen.getByLabelText('Lesson project name'), {
      target: { value: 'Keep my work' },
    });
    fireEvent.click(screen.getByTestId('nav-tab-portfolio'));
    fireEvent.click(screen.getByTestId('nav-tab-studio'));
    expect(screen.getByLabelText('Lesson project name')).toHaveValue(
      'Keep my work'
    );
  });
  it('uses the actual shell capture and project providers to prefill a delivery', async () => {
    let bridge: WorkspaceBridge;
    const project = { title: 'Captured' };
    fixture.component = function Provider(props) {
      bridge = props.bridge;
      useEffect(() => {
        bridge.registerSnapshotProvider(() => ({
          dataUrl: 'data:image/png;base64,TESTDATA',
        }));
        bridge.registerProjectDataProvider(() => project);
        return () => {
          bridge.registerSnapshotProvider(null);
          bridge.registerProjectDataProvider(null);
        };
      }, [bridge]);
      return <div>Test provider</div>;
    };
    render(<StudioShell />);
    await act(async () => {
      bridge!.reportStatus({
        projectName: 'Captured project',
        estimatedCost: 432,
      });
      bridge!.requestDelivery();
    });
    expect(screen.getByLabelText(/Project Title/i)).toHaveValue(
      'Captured project'
    );
    expect(screen.getByLabelText(/Reported Construction Cost/i)).toHaveValue(
      432
    );
    expect(screen.getByAltText('Design submission preview')).toHaveAttribute(
      'src',
      'data:image/png;base64,TESTDATA'
    );
    project.title = 'Changed after capture';
    await act(async () => {
      fireEvent.click(screen.getByTestId('submit-delivery-confirm'));
    });
    const saved = JSON.parse(
      localStorage.getItem('himari.studio.framework.v1')!
    );
    expect(
      Object.values(saved.state.submissions).map((s: any) => s.projectData)
    ).toEqual([{ title: 'Captured' }]);
  });
  it('displays an unsaved-progress warning when framework persistence fails', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });
    render(<StudioShell />);
    await waitFor(() =>
      expect(
        screen.getByText(/progress.*not.*saved|progress.*could not.*saved/i)
      ).toBeInTheDocument()
    );
  });
});

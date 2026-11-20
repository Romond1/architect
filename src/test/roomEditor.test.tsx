import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ArchitectureWorkspace } from '../workspace/ArchitectureWorkspace';
import { createWorkspaceStorageApi } from '../framework/persistence/workspaceStorage';
import type {
  WorkspaceBridge,
  WorkspaceArtifact,
} from '../workspace/integration';
import { PROJECT_KEY, createProject, createRoom } from '../workspace/roomModel';
import { serializePlan } from '../workspace/planExport';

function harness() {
  let snapshot:
    | (() => Promise<WorkspaceArtifact | null> | WorkspaceArtifact | null)
    | null = null;
  let data: (() => unknown) | null = null;
  const bridge: WorkspaceBridge = {
    context: {
      activeCommission: {
        id: 'commission-1',
        order: 1,
        title: 'My First Room',
        customerName: 'Mr. Rabbit',
        constructionBudget: 1000,
        requirements: [],
        dimensions: [],
      },
      theme: 'default',
      reducedMotion: true,
      isFullscreen: false,
      toggleFullscreen: vi.fn(),
    },
    storage: createWorkspaceStorageApi(),
    reportStatus: vi.fn(),
    requestDelivery: vi.fn(),
    registerSnapshotProvider: vi.fn((provider) => {
      snapshot = provider;
    }),
    registerProjectDataProvider: vi.fn((provider) => {
      data = provider;
    }),
  };
  return { bridge, snapshot: () => snapshot, data: () => data };
}
beforeEach(() => localStorage.clear());
describe('Room editor', () => {
  it('opens without a room and creates a neutral room only when the learner asks', () => {
    const { bridge } = harness();
    render(<ArchitectureWorkspace bridge={bridge} />);
    expect(screen.queryByTestId('room-north-wall')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Room width (m)')).toHaveValue(3);
    fireEvent.click(screen.getByRole('button', { name: 'Create room' }));
    expect(screen.getByTestId('room-north-wall')).toBeInTheDocument();
    expect(screen.getByTestId('room-area')).toHaveTextContent('9 m²');
    expect(bridge.reportStatus).toHaveBeenLastCalledWith(
      expect.objectContaining({ hasDeliverable: true, estimatedCost: null })
    );
  });
  it('applies inside dimensions and wall thickness with real measurements and four walls', () => {
    const { bridge } = harness();
    render(<ArchitectureWorkspace bridge={bridge} />);
    fireEvent.change(screen.getByLabelText('Room width (m)'), {
      target: { value: '4' },
    });
    fireEvent.change(screen.getByLabelText('Room length (m)'), {
      target: { value: '5' },
    });
    fireEvent.change(screen.getByLabelText('Wall thickness (m)'), {
      target: { value: '0.2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create room' }));
    expect(screen.getByTestId('room-area')).toHaveTextContent('20 m²');
    expect(screen.getByTestId('room-perimeter')).toHaveTextContent('18 m');
    expect(screen.getByTestId('room-north-wall')).toHaveAttribute(
      'width',
      '4.4'
    );
    expect(screen.getByTestId('room-east-wall')).toHaveAttribute('height', '5');
    expect(screen.getByTestId('room-dimensions')).toHaveTextContent('4 m');
    expect(screen.getByTestId('room-dimensions')).toHaveTextContent('5 m');
  });
  it('rejects invalid form values without changing a good saved design', () => {
    const { bridge } = harness();
    bridge.storage.save(PROJECT_KEY, {
      ...createProject(),
      room: createRoom(4, 5, 0.15),
    });
    render(<ArchitectureWorkspace bridge={bridge} />);
    fireEvent.change(screen.getByLabelText('Room width (m)'), {
      target: { value: '0' },
    });
    fireEvent.submit(screen.getByTestId('room-form'));
    expect(screen.getByRole('alert')).toHaveTextContent('1 and 30');
    expect(screen.getByTestId('room-area')).toHaveTextContent('20 m²');
  });
  it('reloads an independently persisted project and unregisters providers on cleanup', () => {
    const h = harness();
    const { unmount } = render(<ArchitectureWorkspace bridge={h.bridge} />);
    fireEvent.click(screen.getByRole('button', { name: 'Create room' }));
    expect(h.data()!()).toEqual({ ...createProject(), room: createRoom() });
    expect(h.snapshot()).toBeTypeOf('function');
    unmount();
    expect(h.data()).toBeNull();
    expect(h.snapshot()).toBeNull();
    render(<ArchitectureWorkspace bridge={h.bridge} />);
    expect(screen.getByTestId('room-area')).toHaveTextContent('9 m²');
  });
  it('keeps a malformed saved project untouched until an explicit reset', () => {
    const { bridge } = harness();
    bridge.storage.save(PROJECT_KEY, {
      version: 55,
      room: { unreadable: true },
    });
    render(<ArchitectureWorkspace bridge={bridge} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/saved|format/i);
    expect(bridge.storage.load(PROJECT_KEY)).toEqual({
      version: 55,
      room: { unreadable: true },
    });
  });
  it('zooms and fits the drawing without changing project data, and resets only after confirmation', async () => {
    const h = harness();
    render(<ArchitectureWorkspace bridge={h.bridge} />);
    fireEvent.click(screen.getByRole('button', { name: 'Create room' }));
    const before = h.data()!();
    const initial = screen.getByTestId('floor-plan').getAttribute('viewBox');
    const headingSize = screen
      .getByTestId('floor-plan')
      .querySelector('text')!
      .getAttribute('font-size');
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(screen.getByTestId('floor-plan').getAttribute('viewBox')).not.toBe(
      initial
    );
    expect(h.data()!()).toEqual(before);
    expect(
      screen
        .getByTestId('floor-plan')
        .querySelector('text')!
        .getAttribute('font-size')
    ).toBe(headingSize);
    fireEvent.click(screen.getByRole('button', { name: 'Fit to view' }));
    expect(screen.getByTestId('floor-plan').getAttribute('viewBox')).toBe(
      initial
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reset project' }));
    expect(screen.getByTestId('room-north-wall')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Keep my room' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset project' }));
    await act(async () =>
      fireEvent.click(
        screen.getByRole('button', { name: 'Start a new project' })
      )
    );
    await waitFor(() =>
      expect(screen.queryByTestId('room-north-wall')).not.toBeInTheDocument()
    );
  });
  it('keeps unsaved geometry available and retries saving after a storage failure', () => {
    const h = harness();
    const save = vi
      .spyOn(h.bridge.storage, 'save')
      .mockImplementationOnce(() => {
        throw new Error('Storage is full');
      });
    render(<ArchitectureWorkspace bridge={h.bridge} />);
    fireEvent.click(screen.getByRole('button', { name: 'Create room' }));
    expect(screen.getByRole('alert')).toHaveTextContent('could not be saved');
    expect(screen.getByTestId('room-area')).toHaveTextContent('9 m²');
    expect(h.data()!()).toEqual({ ...createProject(), room: createRoom() });
    fireEvent.click(screen.getByRole('button', { name: 'Try saving again' }));
    expect(save).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(h.bridge.storage.load(PROJECT_KEY)).toEqual(h.data()!());
  });
  it('keeps applied evidence stable until changed measurements are applied', () => {
    const h = harness();
    render(<ArchitectureWorkspace bridge={h.bridge} />);
    fireEvent.click(screen.getByRole('button', { name: 'Create room' }));
    fireEvent.change(screen.getByLabelText('Room width (m)'), {
      target: { value: '4' },
    });
    expect(
      screen.getByRole('button', { name: 'Deliver this plan' })
    ).toBeDisabled();
    expect(h.data()!()).toEqual({ ...createProject(), room: createRoom() });
    fireEvent.click(screen.getByRole('button', { name: 'Apply dimensions' }));
    expect(
      screen.getByRole('button', { name: 'Deliver this plan' })
    ).toBeEnabled();
    expect(h.data()!()).toEqual({ ...createProject(), room: createRoom(4, 3) });
  });
  it('fits long headings on narrow rooms and safely serializes title text', () => {
    const h = harness();
    h.bridge.storage.save(PROJECT_KEY, {
      ...createProject(),
      title: 'W'.repeat(32),
      room: createRoom(1, 30),
    });
    render(<ArchitectureWorkspace bridge={h.bridge} />);
    const svg = screen.getByTestId('floor-plan') as unknown as SVGSVGElement;
    const heading = svg.querySelector('text')!;
    const view = svg.getAttribute('viewBox')!.split(' ').map(Number);
    expect(Number(heading.getAttribute('font-size')) * 32).toBeLessThanOrEqual(
      view[2]
    );
    fireEvent.change(screen.getByLabelText('Room project name'), {
      target: { value: '<script> & my room' },
    });
    const xml = serializePlan(svg);
    expect(xml).toContain('&lt;script&gt; &amp; my room');
    expect(xml).not.toContain('<script>');
    expect(xml).toContain('width="1600"');
    expect(xml).toContain('height="1200"');
  });
});

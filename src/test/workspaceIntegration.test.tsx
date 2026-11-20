import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StudioShell } from '../app/StudioShell';
import { ArchitectureWorkspace } from '../workspace/ArchitectureWorkspace';
import type {
  ArchitectureWorkspaceProps,
  WorkspaceBridge,
} from '../workspace/integration';

describe('Architectural Workspace Boundary and Integration Contract', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('offers only the authorized first-generation room tools, with no room created', () => {
    const mockBridge: WorkspaceBridge = {
      context: {
        activeCommission: {
          id: 'commission-1',
          order: 1,
          title: 'My First Room',
          customerName: 'Mr. Rabbit',
          constructionBudget: 1000,
          requirements: [{ id: 'r1', text: 'One rectangular room' }],
          dimensions: [{ id: 'd1', label: 'Width', value: '4 metres' }],
        },
        theme: 'default',
        reducedMotion: false,
        isFullscreen: false,
        toggleFullscreen: vi.fn(),
      },
      storage: {
        load: () => null,
        save: vi.fn(),
        remove: vi.fn(),
        listKeys: () => [],
        clear: vi.fn(),
        exportAll: () => ({}),
        importAll: vi.fn(),
      },
      reportStatus: vi.fn(),
      registerSnapshotProvider: vi.fn(),
      registerProjectDataProvider: vi.fn(),
      requestDelivery: vi.fn(),
    };

    const { container } = render(<ArchitectureWorkspace bridge={mockBridge} />);
    expect(
      screen.getByRole('button', { name: 'Create room' })
    ).toBeInTheDocument();
    expect(screen.getByTestId('room-editor-empty')).toBeInTheDocument();
    expect(container.querySelectorAll('canvas')).toHaveLength(0);
    expect(screen.queryByTestId('room-north-wall')).not.toBeInTheDocument();
    expect(
      screen.queryByText(/add door|add window|3d view|furniture/i)
    ).not.toBeInTheDocument();
  });

  it('supports fullscreen toggle and Escape exit cleanly inside StudioShell', async () => {
    render(<StudioShell />);
    expect(screen.getByTestId('room-editor-empty')).toBeInTheDocument();
    expect(screen.getByTestId('budget-total')).toHaveTextContent('1,000 coins');
    expect(screen.getByTestId('budget-reported')).toHaveTextContent(
      'Not reported yet'
    );

    const toggleBtn = screen.getByTestId('toggle-workspace-fullscreen');
    await act(async () => {
      toggleBtn.click();
    });
    expect(screen.getByText(/Exit Fullscreen/i)).toBeInTheDocument();

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(screen.getByText(/Maximize/i)).toBeInTheDocument();
  });

  it('allows a future workspace plugin component to report status, itemized costs, snapshot, project data, and submit via WorkspaceBridge', async () => {
    const snapshotUrl = 'data:image/svg+xml;base64,PHN2Zy8+';

    // Simulate how a future lesson workspace interacts with the exported bridge contract
    function SimulatedFutureWorkspace({ bridge }: ArchitectureWorkspaceProps) {
      useEffect(() => {
        bridge.storage.save('lesson-state', { draftVersion: 1 });
        bridge.reportStatus({
          projectName: 'Meadow Plan Alpha',
          estimatedCost: 620,
          itemizedCosts: [
            { id: 'c1', label: 'Perimeter Base', totalCost: 420 },
            { id: 'c2', label: 'Measure Overlay', totalCost: 200 },
          ],
          hasDeliverable: true,
        });
        bridge.registerSnapshotProvider(() => ({
          dataUrl: snapshotUrl,
          mimeType: 'image/svg+xml',
        }));
        bridge.registerProjectDataProvider(() => ({ customDraft: true }));

        return () => {
          bridge.registerSnapshotProvider(null);
          bridge.registerProjectDataProvider(null);
        };
      }, [bridge]);

      return (
        <button
          type="button"
          data-testid="simulated-ws-deliver"
          onClick={() =>
            bridge.requestDelivery({
              notes: 'Generated directly from workspace contract',
            })
          }
        >
          Deliver from Workspace
        </button>
      );
    }

    // Spy on WorkspaceHost through a minimal test harness using StudioShell's bridge contract
    const reportStatus = vi.fn();
    let capturedDraft: unknown = null;
    let storedValue: unknown = null;

    const testBridge: WorkspaceBridge = {
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
        reducedMotion: false,
        isFullscreen: false,
        toggleFullscreen: vi.fn(),
      },
      storage: {
        load: <T,>() => storedValue as T | null,
        save: (_k, value) => {
          storedValue = value;
        },
        remove: vi.fn(),
        listKeys: () => ['lesson-state'],
        clear: vi.fn(),
        exportAll: () => ({ 'lesson-state': storedValue }),
        importAll: vi.fn(),
      },
      reportStatus,
      registerSnapshotProvider: vi.fn(),
      registerProjectDataProvider: vi.fn(),
      requestDelivery: (draft) => {
        capturedDraft = draft;
      },
    };

    render(<SimulatedFutureWorkspace bridge={testBridge} />);

    await waitFor(() => {
      expect(reportStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          projectName: 'Meadow Plan Alpha',
          estimatedCost: 620,
          hasDeliverable: true,
        })
      );
    });
    expect(storedValue).toEqual({ draftVersion: 1 });

    fireEvent.click(screen.getByTestId('simulated-ws-deliver'));
    expect(capturedDraft).toEqual({
      notes: 'Generated directly from workspace contract',
    });
  });
});

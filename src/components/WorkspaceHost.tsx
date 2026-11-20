import { Maximize2, Minimize2, Send } from 'lucide-react';
import { ArchitectureWorkspace } from '../workspace/ArchitectureWorkspace';
import type {
  WorkspaceBridge,
  WorkspaceDeliverableStatus,
} from '../workspace/integration';
import styles from './WorkspaceHost.module.css';

interface WorkspaceHostProps {
  bridge: WorkspaceBridge;
  workspaceStatus: WorkspaceDeliverableStatus;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenDelivery: () => void;
}

export function WorkspaceHost({
  bridge,
  workspaceStatus,
  isFullscreen,
  onToggleFullscreen,
  onOpenDelivery,
}: WorkspaceHostProps) {
  return (
    <main
      className={`${styles.host} ${isFullscreen ? styles.fullscreen : ''}`}
      aria-label="Architectural Design Workspace"
      data-testid="workspace-host"
    >
      <div className={styles.hostHeader}>
        <div className={styles.headerLeft}>
          <span className={styles.workspaceTag}>Architectural Workspace</span>
          {workspaceStatus.projectName && (
            <span className={styles.statusPill}>
              Project: <strong>{workspaceStatus.projectName}</strong>
            </span>
          )}
          {workspaceStatus.estimatedCost !== null && (
            <span className={styles.statusPill}>
              Estimated Cost:{' '}
              <strong>
                {workspaceStatus.estimatedCost.toLocaleString()} coins
              </strong>
            </span>
          )}
          {workspaceStatus.statusNote && (
            <span className={styles.noteText}>{workspaceStatus.statusNote}</span>
          )}
        </div>

        <div className={styles.headerRight}>
          {isFullscreen && (
            <button
              type="button"
              className={styles.deliverQuickBtn}
              onClick={onOpenDelivery}
            >
              <Send size={14} />
              <span>Deliver Design</span>
            </button>
          )}
          <button
            type="button"
            className={styles.fullscreenBtn}
            onClick={onToggleFullscreen}
            aria-label={
              isFullscreen
                ? 'Exit fullscreen workspace'
                : 'Maximize workspace'
            }
            data-testid="toggle-workspace-fullscreen"
          >
            {isFullscreen ? (
              <>
                <Minimize2 size={15} />
                <span>Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 size={15} />
                <span>Maximize</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className={styles.workspaceCanvasArea}>
        <ArchitectureWorkspace bridge={bridge} />
      </div>
    </main>
  );
}

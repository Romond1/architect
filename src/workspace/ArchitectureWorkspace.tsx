import {
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Download,
  Focus,
  Hand,
  Plus,
  Ruler,
  Send,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Check,
  Save,
} from 'lucide-react';
import type { ArchitectureWorkspaceProps } from './integration';
import {
  cameraViewBox,
  createProject,
  createRoom,
  formatMeasure,
  INITIAL_CAMERA,
  LIMITS,
  measurements,
  planBounds,
  PROJECT_KEY,
  validateProject,
  type Camera,
  type RoomProject,
} from './roomModel';
import { FloorPlanDrawing } from './FloorPlanDrawing';
import { capturePlan, downloadPlan, serializePlan } from './planExport';
import styles from './ArchitectureWorkspace.module.css';

function loadProject(bridge: ArchitectureWorkspaceProps['bridge']) {
  try {
    const saved = bridge.storage.load<unknown>(PROJECT_KEY);
    return {
      project: saved === null ? createProject() : validateProject(saved),
      error: '',
      blocked: false,
    };
  } catch (error) {
    return {
      project: createProject(),
      error: `Your saved room was left untouched. ${(error as Error).message} Export a studio backup in Teacher controls before starting a new project.`,
      blocked: true,
    };
  }
}
function formValues(project: RoomProject) {
  const room = project.room ?? createRoom();
  return {
    width: String(room.widthM),
    length: String(room.lengthM),
    thickness: String(room.wallThicknessM),
  };
}

export function ArchitectureWorkspace({ bridge }: ArchitectureWorkspaceProps) {
  const [initial] = useState(() => loadProject(bridge));
  const [project, setProject] = useState(initial.project),
    [draft, setDraft] = useState(() => formValues(initial.project));
  const [error, setError] = useState(initial.error),
    [blocked, setBlocked] = useState(initial.blocked),
    [saved, setSaved] = useState(true),
    [busy, setBusy] = useState(false),
    [confirmReset, setConfirmReset] = useState(false);
  const [camera, setCamera] = useState<Camera>(INITIAL_CAMERA);
  const svgRef = useRef<SVGSVGElement>(null),
    exportRef = useRef<SVGSVGElement>(null),
    projectRef = useRef(project);
  const drag = useRef<{
    inverse: DOMMatrix;
    startX: number;
    startY: number;
    camera: Camera;
    pointerId: number;
  } | null>(null);
  const exportBusy = useRef(false);
  const id = useId().replace(/:/g, '');
  projectRef.current = project;
  const room = project.room,
    bounds = room ? planBounds(room) : null;
  const box = bounds ? cameraViewBox(bounds, camera) : null;
  const stats = room ? measurements(room) : null;
  const pending =
    !!room &&
    (Number(draft.width) !== room.widthM ||
      Number(draft.length) !== room.lengthM ||
      Number(draft.thickness) !== room.wallThicknessM);
  const fit = () => setCamera({ ...INITIAL_CAMERA });
  const zoom = (factor: number) =>
    setCamera((previous) => ({
      ...previous,
      zoom: Math.min(8, Math.max(0.25, previous.zoom * factor)),
    }));
  const pan = (x: number, y: number) => {
    if (box)
      setCamera((previous) => ({
        ...previous,
        panX: previous.panX + x * box.width * 0.12,
        panY: previous.panY + y * box.height * 0.12,
      }));
  };

  function saveProject(next: RoomProject) {
    setProject(next);
    try {
      bridge.storage.save(PROJECT_KEY, next);
      setSaved(true);
      setError('');
    } catch (error) {
      setSaved(false);
      setError(
        `Your room is still here, but it could not be saved. ${(error as Error).message}`
      );
    }
  }
  function applyRoom() {
    if (blocked) return;
    try {
      const next = {
        ...project,
        room: createRoom(
          Number(draft.width),
          Number(draft.length),
          Number(draft.thickness)
        ),
      };
      saveProject(next);
      fit();
    } catch (error) {
      setError((error as Error).message);
    }
  }
  function reset() {
    const next = createProject();
    try {
      bridge.storage.save(PROJECT_KEY, next);
      setProject(next);
      setDraft(formValues(next));
      setBlocked(false);
      setError('');
      setSaved(true);
      setConfirmReset(false);
      fit();
    } catch (error) {
      setError(`The project was not reset. ${(error as Error).message}`);
    }
  }
  useEffect(() => {
    bridge.reportStatus({
      projectName: room ? project.title.trim() || 'Room study' : null,
      estimatedCost: null,
      itemizedCosts: [],
      hasDeliverable: !!room,
      statusNote: room ? '2D room plan' : 'Ready to create a room',
    });
  }, [bridge, project, room]);
  useEffect(() => {
    bridge.registerSnapshotProvider(() =>
      projectRef.current.room && exportRef.current
        ? capturePlan(exportRef.current)
        : null
    );
    bridge.registerProjectDataProvider(() =>
      validateProject(projectRef.current)
    );
    return () => {
      bridge.registerSnapshotProvider(null);
      bridge.registerProjectDataProvider(null);
    };
  }, [bridge]);

  async function exportImage() {
    if (!exportRef.current || exportBusy.current) return;
    exportBusy.current = true;
    setBusy(true);
    try {
      const image = await capturePlan(exportRef.current);
      downloadPlan('room-floor-plan.png', image.dataUrl);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
      exportBusy.current = false;
    }
  }
  function pointerDown(e: ReactPointerEvent<SVGSVGElement>) {
    if (e.button !== 0 && e.button !== 1) return;
    const inverse = e.currentTarget.getScreenCTM()?.inverse();
    if (!inverse) return;
    const start = new DOMPoint(e.clientX, e.clientY).matrixTransform(inverse);
    drag.current = {
      inverse,
      startX: start.x,
      startY: start.y,
      camera: { ...camera },
      pointerId: e.pointerId,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  }
  function pointerMove(e: ReactPointerEvent<SVGSVGElement>) {
    const start = drag.current;
    if (!start || start.pointerId !== e.pointerId) return;
    const current = new DOMPoint(e.clientX, e.clientY).matrixTransform(
      start.inverse
    );
    setCamera({
      ...start.camera,
      panX: start.camera.panX - (current.x - start.startX),
      panY: start.camera.panY - (current.y - start.startY),
    });
  }
  const endDrag = () => {
    drag.current = null;
  };

  return (
    <section
      className={styles.editor}
      data-testid="room-editor"
      aria-label="Single room floor plan editor"
    >
      <div className={styles.intro}>
        <span className={styles.kicker}>
          <Ruler size={17} /> YOUR FIRST DRAWING TOOLS
        </span>
        <h2>A little room. Your own design.</h2>
        <p>Choose your measurements, then see your idea take shape.</p>
      </div>
      {error && (
        <div className={styles.error} role="alert">
          {error}
          {!saved && !blocked && (
            <button type="button" onClick={() => saveProject(project)}>
              <Save size={16} />
              Try saving again
            </button>
          )}
        </div>
      )}
      <form
        className={styles.form}
        data-testid="room-form"
        onSubmit={(e) => {
          e.preventDefault();
          applyRoom();
        }}
      >
        <label className={styles.titleField}>
          Project name
          <input
            aria-label="Room project name"
            maxLength={80}
            value={project.title}
            disabled={blocked}
            onChange={(e) => saveProject({ ...project, title: e.target.value })}
          />
        </label>
        <div className={styles.measureFields}>
          <label>
            Inside width
            <span className={styles.inputUnit}>
              <input
                aria-label="Room width (m)"
                type="number"
                min={LIMITS.dimensionMin}
                max={LIMITS.dimensionMax}
                step="0.01"
                required
                value={draft.width}
                disabled={blocked}
                onChange={(e) => setDraft({ ...draft, width: e.target.value })}
              />
              <span>m</span>
            </span>
          </label>
          <span className={styles.times} aria-hidden="true">
            ×
          </span>
          <label>
            Inside length
            <span className={styles.inputUnit}>
              <input
                aria-label="Room length (m)"
                type="number"
                min={LIMITS.dimensionMin}
                max={LIMITS.dimensionMax}
                step="0.01"
                required
                value={draft.length}
                disabled={blocked}
                onChange={(e) => setDraft({ ...draft, length: e.target.value })}
              />
              <span>m</span>
            </span>
          </label>
          <label>
            Wall thickness
            <span className={styles.inputUnit}>
              <input
                aria-label="Wall thickness (m)"
                type="number"
                min={LIMITS.thicknessMin}
                max={LIMITS.thicknessMax}
                step="0.01"
                required
                value={draft.thickness}
                disabled={blocked}
                onChange={(e) =>
                  setDraft({ ...draft, thickness: e.target.value })
                }
              />
              <span>m</span>
            </span>
          </label>
        </div>
        <div className={styles.applyRow}>
          <p>
            Width and length measure the space <strong>inside</strong> the
            walls.
          </p>
          <button type="submit" className={styles.primary} disabled={blocked}>
            {room ? (
              <>
                <Check size={18} />
                Apply dimensions
              </>
            ) : (
              <>
                <Plus size={18} />
                Create room
              </>
            )}
          </button>
        </div>
      </form>
      {pending && (
        <p className={styles.pending} role="status">
          Your measurements have changed. Apply dimensions to update the
          drawing.
        </p>
      )}
      <div className={styles.drawingToolbar}>
        <div className={styles.toolbarGroup}>
          <span className={styles.drawingLabel}>FLOOR PLAN</span>
          <span className={styles.gridNote}>0.5 m drafting grid</span>
        </div>
        <div className={styles.toolbarGroup}>
          <button
            aria-label="Zoom out"
            title="Zoom out"
            disabled={!room || camera.zoom <= 0.25}
            onClick={() => zoom(1 / 1.25)}
          >
            <ZoomOut size={19} />
          </button>
          <output aria-label="Drawing zoom">
            {Math.round(camera.zoom * 100)}%
          </output>
          <button
            aria-label="Zoom in"
            title="Zoom in"
            disabled={!room || camera.zoom >= 8}
            onClick={() => zoom(1.25)}
          >
            <ZoomIn size={19} />
          </button>
          <button
            aria-label="Fit to view"
            title="Fit to view"
            disabled={!room}
            onClick={fit}
          >
            <Focus size={18} />
            <span>Fit</span>
          </button>
        </div>
      </div>
      <div className={styles.canvas}>
        {room && box ? (
          <svg
            ref={svgRef}
            data-testid="floor-plan"
            role="img"
            aria-label="Rectangular room floor plan with inside dimensions"
            viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
            preserveAspectRatio="xMidYMid meet"
            onPointerDown={pointerDown}
            onPointerMove={pointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onLostPointerCapture={endDrag}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') {
                pan(-1, 0);
                e.preventDefault();
              }
              if (e.key === 'ArrowRight') {
                pan(1, 0);
                e.preventDefault();
              }
              if (e.key === 'ArrowUp') {
                pan(0, -1);
                e.preventDefault();
              }
              if (e.key === 'ArrowDown') {
                pan(0, 1);
                e.preventDefault();
              }
              if (e.key === '+' || e.key === '=') {
                zoom(1.25);
                e.preventDefault();
              }
              if (e.key === '-') {
                zoom(0.8);
                e.preventDefault();
              }
              if (e.key === '0') {
                fit();
                e.preventDefault();
              }
            }}
          >
            <title>{project.title || 'Room study'}</title>
            <desc>
              One room, {formatMeasure(room.widthM)} metres wide and{' '}
              {formatMeasure(room.lengthM)} metres long. Four walls,{' '}
              {formatMeasure(room.wallThicknessM)} metres thick. Drag to pan,
              use the zoom controls or arrow keys, and press zero to fit.
            </desc>
            <FloorPlanDrawing
              project={project}
              box={box}
              prefix={`${id}-live`}
            />
          </svg>
        ) : (
          <div className={styles.empty} data-testid="room-editor-empty">
            <div className={styles.emptyMark}>
              <Ruler size={42} strokeWidth={1.4} />
            </div>
            <span className={styles.kicker}>
              A BLANK PAGE. A NEW POSSIBILITY.
            </span>
            <h3>Let’s make your first room.</h3>
            <p>
              Read Mr. Rabbit’s brief, choose a width and length, then select{' '}
              <strong>Create room</strong>.
            </p>
            <span className={styles.emptyNote}>
              You’re the architect. The measurements are up to you.
            </span>
          </div>
        )}
      </div>
      <div className={styles.panBar}>
        <span>
          <Hand size={16} />
          Drag the plan to move around
        </span>
        <div className={styles.toolbarGroup} aria-label="Pan drawing">
          <button
            aria-label="Pan left"
            disabled={!room}
            onClick={() => pan(-1, 0)}
          >
            <ArrowLeft size={17} />
          </button>
          <button
            aria-label="Pan up"
            disabled={!room}
            onClick={() => pan(0, -1)}
          >
            <ArrowUp size={17} />
          </button>
          <button
            aria-label="Pan down"
            disabled={!room}
            onClick={() => pan(0, 1)}
          >
            <ArrowDown size={17} />
          </button>
          <button
            aria-label="Pan right"
            disabled={!room}
            onClick={() => pan(1, 0)}
          >
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
      <div className={styles.stats} aria-live="polite">
        <div>
          <span>Floor area</span>
          <strong data-testid="room-area">
            {stats ? `${formatMeasure(stats.areaM2)} m²` : '—'}
          </strong>
        </div>
        <div>
          <span>Inside perimeter</span>
          <strong data-testid="room-perimeter">
            {stats ? `${formatMeasure(stats.perimeterM)} m` : '—'}
          </strong>
        </div>
        <div>
          <span>Outside size</span>
          <strong>
            {stats
              ? `${formatMeasure(stats.outsideWidthM)} × ${formatMeasure(stats.outsideLengthM)} m`
              : '—'}
          </strong>
        </div>
      </div>
      <div className={styles.actions}>
        <div className={styles.exportButtons}>
          <button
            className={styles.secondary}
            disabled={!room || busy || pending}
            onClick={() => void exportImage()}
          >
            <Download size={18} />
            {busy ? 'Preparing image…' : 'Export PNG'}
          </button>
          <button
            className={styles.secondary}
            disabled={!room || pending}
            onClick={() => {
              if (exportRef.current)
                downloadPlan(
                  'room-floor-plan.svg',
                  serializePlan(exportRef.current),
                  'image/svg+xml'
                );
            }}
          >
            Save SVG
          </button>
        </div>
        <button
          className={styles.primary}
          disabled={!room || pending || busy}
          onClick={() => bridge.requestDelivery()}
        >
          <Send size={17} />
          Deliver this plan
        </button>
      </div>
      <footer className={styles.footer}>
        <span className={saved ? styles.saved : styles.unsaved}>
          <span className={styles.saveDot} />
          {room
            ? saved
              ? 'Room project saved on this computer'
              : 'Changes are not saved yet'
            : 'Ready for your first room'}
        </span>
        <button
          className={styles.reset}
          onClick={() => setConfirmReset(true)}
          disabled={!room && !blocked}
        >
          <RotateCcw size={15} />
          Reset project
        </button>
      </footer>
      {confirmReset && (
        <div
          className={styles.resetConfirm}
          role="group"
          aria-label="Confirm room project reset"
        >
          <strong>Start a fresh room project?</strong>
          <p>
            This replaces this room project only. Your commissions, coins and
            portfolio stay as they are.
            {blocked
              ? ' Export a studio backup first if you need to keep the unreadable project.'
              : ''}
          </p>
          <div>
            <button
              className={styles.secondary}
              onClick={() => setConfirmReset(false)}
            >
              Keep my room
            </button>
            <button className={styles.primary} onClick={reset}>
              Start a new project
            </button>
          </div>
        </div>
      )}
      {room && bounds && (
        <div className={styles.exportSource} aria-hidden="true">
          <svg
            ref={exportRef}
            xmlns="http://www.w3.org/2000/svg"
            width="1600"
            height="1200"
            viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <title>{project.title || 'Room study'}</title>
            <desc>
              Measured single-room floor plan. All dimensions are in metres.
            </desc>
            <FloorPlanDrawing
              project={project}
              box={bounds}
              print
              prefix={`${id}-export`}
              testIds={false}
            />
          </svg>
        </div>
      )}
    </section>
  );
}

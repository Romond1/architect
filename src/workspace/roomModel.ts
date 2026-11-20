/** Student-owned architectural data. All lengths are in metres; no SVG pixels. */
export interface RectangularRoom {
  widthM: number;
  lengthM: number;
  wallThicknessM: number;
}
export interface RoomProject {
  version: 1;
  title: string;
  room: RectangularRoom | null;
}
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface Camera {
  zoom: number;
  panX: number;
  panY: number;
}
export const PROJECT_KEY = 'room-editor.project.v1';
export const INITIAL_CAMERA: Camera = { zoom: 1, panX: 0, panY: 0 };
export const LIMITS = {
  dimensionMin: 1,
  dimensionMax: 30,
  thicknessMin: 0.05,
  thicknessMax: 0.6,
};
export function createProject(): RoomProject {
  return { version: 1, title: 'My room study', room: null };
}
export function createRoom(
  widthM = 3,
  lengthM = 3,
  wallThicknessM = 0.15
): RectangularRoom {
  if (
    ![widthM, lengthM].every(
      (n) =>
        Number.isFinite(n) &&
        n >= LIMITS.dimensionMin &&
        n <= LIMITS.dimensionMax
    )
  )
    throw new Error('Width and length must be between 1 and 30 metres.');
  if (
    !Number.isFinite(wallThicknessM) ||
    wallThicknessM < LIMITS.thicknessMin ||
    wallThicknessM > LIMITS.thicknessMax
  )
    throw new Error('Wall thickness must be between 0.05 and 0.60 metres.');
  return { widthM, lengthM, wallThicknessM };
}
export function validateProject(raw: unknown): RoomProject {
  if (!raw || typeof raw !== 'object')
    throw new Error('The saved room project is unreadable.');
  const value = raw as Record<string, unknown>;
  if (
    value.version !== 1 ||
    typeof value.title !== 'string' ||
    value.title.length > 80 ||
    !('room' in value)
  )
    throw new Error('This saved project uses an unsupported room format.');
  if (value.room === null)
    return { version: 1, title: value.title, room: null };
  if (!value.room || typeof value.room !== 'object')
    throw new Error('The saved room dimensions are unreadable.');
  const r = value.room as RectangularRoom;
  if (
    typeof r.widthM !== 'number' ||
    typeof r.lengthM !== 'number' ||
    typeof r.wallThicknessM !== 'number'
  )
    throw new Error('The saved room is missing its measurements.');
  return {
    version: 1,
    title: value.title,
    room: createRoom(r.widthM, r.lengthM, r.wallThicknessM),
  };
}
const precise = (n: number) => Math.round(n * 1_000_000) / 1_000_000;
export function measurements(room: RectangularRoom) {
  return {
    areaM2: precise(room.widthM * room.lengthM),
    perimeterM: precise(2 * (room.widthM + room.lengthM)),
    outsideWidthM: precise(room.widthM + 2 * room.wallThicknessM),
    outsideLengthM: precise(room.lengthM + 2 * room.wallThicknessM),
  };
}
/** Drawing margins include dimensions, heading, and scale bar. Geometry stays unchanged. */
export function drawingMetrics(room: RectangularRoom) {
  const span = Math.max(room.widthM, room.lengthM);
  return {
    font: span * 0.04,
    offset: room.wallThicknessM + span * 0.12,
    tick: span * 0.018,
    scaleM: span > 12 ? 5 : 1,
  };
}
export function planBounds(room: RectangularRoom): Bounds {
  const { font, offset } = drawingMetrics(room);
  const x = -offset - font * 2,
    y = -offset - font * 3.5;
  const right = room.widthM + room.wallThicknessM + font * 3;
  const bottom = room.lengthM + room.wallThicknessM + font * 6;
  // Keep space for annotation text even with a very tall, narrow room.
  const width = Math.max(right - x, font * 24);
  return { x: x - (width - (right - x)) / 2, y, width, height: bottom - y };
}
export function cameraViewBox(bounds: Bounds, camera: Camera): Bounds {
  const zoom = Math.min(8, Math.max(0.25, camera.zoom));
  const width = bounds.width / zoom,
    height = bounds.height / zoom;
  return {
    x: bounds.x + (bounds.width - width) / 2 + camera.panX,
    y: bounds.y + (bounds.height - height) / 2 + camera.panY,
    width,
    height,
  };
}
export function formatMeasure(n: number) {
  return new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(n);
}

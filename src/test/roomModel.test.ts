import { describe, expect, it } from 'vitest';
import {
  createProject,
  createRoom,
  validateProject,
  measurements,
  planBounds,
  cameraViewBox,
} from '../workspace/roomModel';

describe('First-generation room model', () => {
  it('starts without a room and does not derive dimensions from a commission', () => {
    const p = createProject();
    expect(p.version).toBe(1);
    expect(p.room).toBeNull();
    expect(createRoom()).toEqual({
      widthM: 3,
      lengthM: 3,
      wallThicknessM: 0.15,
    });
  });
  it('calculates clear floor area/perimeter and outside dimensions without changing inside measurements', () => {
    const room = createRoom(4, 5, 0.2);
    expect(measurements(room)).toEqual({
      areaM2: 20,
      perimeterM: 18,
      outsideWidthM: 4.4,
      outsideLengthM: 5.4,
    });
    expect(room.widthM).toBe(4);
  });
  it('round-trips versioned plain data and rejects malformed or unsupported saves', () => {
    const p = { ...createProject(), room: createRoom(4.2, 5.7, 0.18) };
    expect(validateProject(JSON.parse(JSON.stringify(p)))).toEqual(p);
    for (const invalid of [
      {},
      { ...p, room: {} },
      { ...p, room: { widthM: 4, lengthM: 5 } },
      { ...p, version: 2 },
      { ...p, room: { widthM: 0, lengthM: 5, wallThicknessM: 0.1 } },
      { ...p, room: { widthM: 4, lengthM: Infinity, wallThicknessM: 0.1 } },
    ])
      expect(() => validateProject(invalid)).toThrow();
  });
  it('rejects unsafe room sizes and thickness instead of silently creating a different design', () => {
    for (const args of [
      [0, 5, 0.1],
      [31, 5, 0.1],
      [4, NaN, 0.1],
      [4, 5, 0],
      [4, 5, 1],
    ])
      expect(() => createRoom(...(args as [number, number, number]))).toThrow();
  });
  it('fits all outside walls, zooms around the centre, and pans without changing geometry', () => {
    const room = createRoom(4, 5, 0.2),
      bounds = planBounds(room);
    expect(bounds.x).toBeLessThan(-0.2);
    expect(bounds.y).toBeLessThan(-0.2);
    expect(bounds.x + bounds.width).toBeGreaterThan(4.2);
    expect(bounds.y + bounds.height).toBeGreaterThan(5.2);
    const fit = cameraViewBox(bounds, { zoom: 1, panX: 0, panY: 0 });
    expect(fit).toEqual(bounds);
    const zoom = cameraViewBox(bounds, { zoom: 2, panX: 1, panY: -1 });
    expect(zoom.width).toBeCloseTo(bounds.width / 2);
    expect(zoom.x + zoom.width / 2).toBeCloseTo(
      bounds.x + bounds.width / 2 + 1
    );
    expect(room).toEqual(createRoom(4, 5, 0.2));
  });
});

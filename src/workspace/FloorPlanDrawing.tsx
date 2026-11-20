import {
  drawingMetrics,
  formatMeasure,
  measurements,
  planBounds,
  type Bounds,
  type RoomProject,
} from './roomModel';

/** One SVG unit is one metre. This view never edits the project model. */
export function FloorPlanDrawing({
  project,
  box,
  print = false,
  prefix = 'room',
  testIds = true,
}: {
  project: RoomProject;
  box: Bounds;
  print?: boolean;
  prefix?: string;
  testIds?: boolean;
}) {
  if (!project.room) return null;
  const room = project.room,
    { widthM: w, lengthM: l, wallThicknessM: t } = room;
  const { font, offset, tick, scaleM } = drawingMetrics(room),
    stats = measurements(room);
  const ink = print ? '#263c53' : '#cfe6f6',
    muted = print ? '#52677d' : '#a6c6db',
    accent = print ? '#376c7b' : '#87d8f1';
  const fullTitle = project.title.trim() || 'Room study';
  const heading =
    fullTitle.length > 32 ? `${fullTitle.slice(0, 32)}…` : fullTitle;
  // Allow even wide glyphs to fit; camera changes must not change text geometry.
  const headingSize = Math.min(
    font * 1.1,
    (planBounds(room).width - font * 2) / heading.length
  );
  const test = (name: string) => (testIds ? name : undefined);
  const walls = [
    { name: 'north', x: -t, y: -t, width: w + 2 * t, height: t },
    { name: 'east', x: w, y: 0, width: t, height: l },
    { name: 'south', x: -t, y: l, width: w + 2 * t, height: t },
    { name: 'west', x: -t, y: 0, width: t, height: l },
  ];
  return (
    <>
      <defs>
        <pattern
          id={`${prefix}-grid`}
          width="0.5"
          height="0.5"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 0.5 0 L 0 0 0 0.5"
            fill="none"
            stroke={print ? '#dbe4e8' : '#29425b'}
            strokeWidth="0.6"
            vectorEffect="non-scaling-stroke"
          />
        </pattern>
      </defs>
      <rect
        x={box.x}
        y={box.y}
        width={box.width}
        height={box.height}
        fill={print ? '#fcfdfd' : '#112139'}
      />
      <rect
        x={box.x}
        y={box.y}
        width={box.width}
        height={box.height}
        fill={`url(#${prefix}-grid)`}
      />
      <g fontFamily="Arial, Helvetica, sans-serif" letterSpacing="0" fill={ink}>
        <text
          x={w / 2}
          y={-offset - font * 2}
          textAnchor="middle"
          fontSize={headingSize}
          fontWeight="700"
        >
          {heading}
        </text>
        <rect
          x="0"
          y="0"
          width={w}
          height={l}
          fill={print ? '#eff5f3' : '#1c3449'}
        />
        <g
          fill={print ? '#33475b' : '#d6e6ed'}
          stroke={print ? '#26394d' : '#eef6fa'}
          strokeWidth="0.7"
          vectorEffect="non-scaling-stroke"
        >
          {walls.map((wall) => (
            <rect
              vectorEffect="non-scaling-stroke"
              key={wall.name}
              data-testid={test(`room-${wall.name}-wall`)}
              x={wall.x}
              y={wall.y}
              width={wall.width}
              height={wall.height}
            />
          ))}
        </g>
        {Math.min(w, l) / Math.max(w, l) > 0.2 && (
          <g textAnchor="middle" fill={muted}>
            <text
              x={w / 2}
              y={l / 2 - font * 0.3}
              fontSize={Math.min(font, w / 6)}
              fontWeight="700"
            >
              ROOM 01
            </text>
            <text
              x={w / 2}
              y={l / 2 + font * 1.3}
              fontSize={Math.min(font, w / 6)}
            >
              {formatMeasure(stats.areaM2)} m²
            </text>
          </g>
        )}
        <g
          data-testid={test('room-dimensions')}
          stroke={accent}
          fill={accent}
          strokeWidth="1.3"
          vectorEffect="non-scaling-stroke"
        >
          <path
            vectorEffect="non-scaling-stroke"
            d={`M 0 ${-t} V ${-offset - tick * 2} M ${w} ${-t} V ${-offset - tick * 2} M ${-t} 0 H ${-offset - tick * 2} M ${-t} ${l} H ${-offset - tick * 2}`}
            opacity=".65"
            fill="none"
          />
          <path
            vectorEffect="non-scaling-stroke"
            d={`M 0 ${-offset} H ${w} M ${-offset} 0 V ${l}`}
            fill="none"
          />
          <path
            vectorEffect="non-scaling-stroke"
            d={`M ${-tick} ${-offset + tick} l ${tick * 2} ${-tick * 2} M ${w - tick} ${-offset + tick} l ${tick * 2} ${-tick * 2} M ${-offset - tick} ${tick} l ${tick * 2} ${-tick * 2} M ${-offset - tick} ${l + tick} l ${tick * 2} ${-tick * 2}`}
            fill="none"
          />
          <text
            x={w / 2}
            y={-offset - font * 0.5}
            textAnchor="middle"
            fontSize={font}
            stroke="none"
            fontWeight="700"
          >
            {formatMeasure(w)} m
          </text>
          <text
            x={-offset - font * 0.5}
            y={l / 2}
            textAnchor="middle"
            fontSize={font}
            stroke="none"
            fontWeight="700"
            transform={`rotate(-90 ${-offset - font * 0.5} ${l / 2})`}
          >
            {formatMeasure(l)} m
          </text>
        </g>
        <g
          transform={`translate(${box.x + font} ${l + t + font * 2})`}
          fill={ink}
        >
          <path
            d={`M 0 ${-font * 0.35} V ${font * 0.35} M 0 0 H ${scaleM} M ${scaleM} ${-font * 0.35} V ${font * 0.35}`}
            stroke={ink}
            strokeWidth="2"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
          <text
            x={scaleM / 2}
            y={font * 1.5}
            textAnchor="middle"
            fontSize={font * 0.8}
          >
            {scaleM} m
          </text>
        </g>
        <text
          x={box.x + font}
          y={l + t + font * 4.6}
          fontSize={font * 0.75}
          fill={muted}
        >
          Inside dimensions · Walls {formatMeasure(t)} m · Grid 0.5 m
        </text>
      </g>
    </>
  );
}

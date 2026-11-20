# Himari's Architectural Workspace

Welcome to **`src/workspace/`**! This folder is Himari's personal software studio where she will progressively build her own architectural design application during lessons.

Everything outside this folder (`src/framework/`, `src/config/`, `src/components/`) manages Mr. Rabbit, commissions, budgets, coins, achievements, the portfolio, and teacher controls. **Your architectural tools belong right here inside `src/workspace/`.**

## First-generation room editor

`ArchitectureWorkspace.tsx` is the React entry point. `WorkspaceHost` provides its container and fullscreen control. Everything architectural stays in this folder; no framework contract was changed for this editor.

- `roomModel.ts`: plain project data, input validation, real-world measurements, drawing bounds and camera calculations.
- `FloorPlanDrawing.tsx`: SVG view of the project, shared by the interactive plan and the export. One SVG coordinate unit equals one metre. Four filled rectangles form the walls; strokes stay a constant screen width. No renderer data is stored in the project.
- `planExport.ts`: clones the separate always-fitted SVG and serializes it, or rasterizes it using the browser’s native image/canvas APIs to a 1600 × 1200 PNG. Export uses inline SVG styles and local primitives, without fonts or external images to fetch. It never captures the zoomed or panned viewport.
- `ArchitectureWorkspace.module.css`: editor controls and layout using the existing studio design tokens.

### Version 1 project data

```json
{
  "version": 1,
  "title": "My room study",
  "room": { "widthM": 4, "lengthM": 5, "wallThicknessM": 0.15 }
}
```

A fresh project has `room: null`. Creating a room is an explicit learner action; the form starts at 3 × 3 m, independently of the active commission. Width and length describe the **clear interior**. The floor starts at `(0, 0)` and extends to `(widthM, lengthM)`. Walls extend outward by the thickness. Thus area = width × length, inside perimeter = 2 × (width + length), and outside dimensions add twice the thickness. The four SVG rectangles are a visual representation, not four additional stored model entities.

Version 1 accepts finite width/length values from 1–30 m and thickness from 0.05–0.60 m. Controls use 0.01 m steps. Displayed measurements round to two decimal places. Validation runs when creating/applying and when loading data. Unsupported versions or malformed records produce a visible recovery message and are preserved until an explicit reset. A later format change should introduce a deliberate version migration rather than silently replacing student work.

Project name changes and applied geometry save through `bridge.storage` at key `room-editor.project.v1` (full browser key `himari.studio.workspace.v1.room-editor.project.v1`). Camera state and unapplied form edits are presentation state only; reload fits the saved geometry. Tab navigation keeps the editor mounted. A failed save retains the current design in memory, shows a warning and offers **Try saving again**. Reset requires confirmation, saves the empty replacement first, and never touches progression.

### Drawing and controls

SVG supplies accurate proportions, 0.5 m drafting grid, inside dimensions, four walls, area label and a 1 m or 5 m scale bar. The live view uses the studio’s blueprint styling; exported evidence uses light paper for legibility. Fit includes annotations. Zoom is 25–800%; drag, directional buttons or arrow keys pan, +/− zoom and 0 fits. The scale bar remains metrically correct when resized; there is no fixed physical print ratio.

Changing fields requires **Apply dimensions**. Until applied, the rendered plan and providers still represent the last applied geometry; the editor’s export/delivery buttons are disabled with a visible reminder. The surrounding customer delivery button also captures the currently applied drawing. Project titles remain fully stored (80 characters); the drawing heading abbreviates them after 32 characters.

### Current framework integration

The editor reports a project name and `hasDeliverable` only after a room exists. It reports `estimatedCost: null` and no itemized costs; construction cost is entered manually in the existing delivery dialog. Area is not a cost estimate. Status is reported from an effect, never during render.

Both providers read the current project from a ref and are unregistered on effect cleanup. The snapshot provider supplies the fitted PNG; the project provider supplies a validated plain JSON copy. **Deliver this plan** invokes `bridge.requestDelivery()` so the existing shell captures both providers. Delivery evidence is copied by the framework. Changing the project after opening delivery does not alter the captured submission. No editor action approves a commission or awards coins.

### Extension points for later lessons

Himari and her teacher should decide future tools during lessons. Data belongs in a deliberately versioned model, drawing belongs in views, and rendering/export should consume project data without mutating it. The existing bridge can already carry a cost estimate with itemized costs, a rendered image, and serializable project data. These are extension points, not implemented future architectural capabilities. Keep the provider cleanup, independent storage and teacher approval rules when adding a requested tool.

### Verification

`npm run typecheck`, `npm test`, and `npm run build` cover the project. `src/test/roomModel.test.ts` checks measurements, validation and camera independence; `roomEditor.test.tsx` checks creation, editing, persistence, reset and provider lifecycle. Existing integration and campaign tests remain in place. Real Chromium verification separately exercises native PNG rendering/download, SVG export, tab navigation, reload, submission, teacher approval, 100-coin payment, first achievement, persisted portfolio image and Commission 2. Use a new browser context for these tests so the lesson profile stays untouched.

## How `bridge` Works

```tsx
import type { ArchitectureWorkspaceProps } from './integration';
```

### 1. Read active commission context
```ts
const { activeCommission, theme, reducedMotion, isFullscreen } = bridge.context;
```
Provides the current commission's `title`, `customerName`, `constructionBudget`, `requirements`, and `dimensions` (read-only).

### 2. Persist workspace data separately from customer progression
```ts
// Save your own design state safely under `himari.studio.workspace.v1.*`
bridge.storage.save('current-project', myProjectState);
const saved = bridge.storage.load<MyProjectState>('current-project');
```
Workspace storage is isolated from framework progress so changing your data model later will never overwrite earned coins, achievements, or portfolio entries.

### 3. Report live project status and itemized costs
```ts
bridge.reportStatus({
  projectName: 'Sunny Meadow Cottage',
  estimatedCost: 820,
  itemizedCosts: [
    { id: 'walls', label: 'Perimeter Walls (18m)', totalCost: 620 },
    { id: 'floor', label: 'Timber Floor Base', totalCost: 200 },
  ],
  hasDeliverable: true,
});
```
Reporting `estimatedCost` updates Mr. Rabbit's Construction Budget meter live and pre-fills the delivery form!

### 4. Provide automatic screenshots & project data on delivery
```ts
bridge.registerSnapshotProvider(async () => {
  return { dataUrl: canvas.toDataURL('image/png'), mimeType: 'image/png' };
});

bridge.registerProjectDataProvider(() => mySerializableProjectState);
```
Remember to return a cleanup function from `useEffect` that clears providers (`registerSnapshotProvider(null)`).

### 5. Trigger delivery directly from your workspace
```ts
bridge.requestDelivery({
  projectTitle: 'My First 4m x 5m Floor Plan',
  reportedCost: 820,
  artifact: { dataUrl: renderedPngDataUrl },
  projectData: myProjectState,
});
```
This opens the studio's **Deliver Design** dialog pre-filled with your screenshot, project name, cost calculation, and data.

## Lifecycle and save rules for lesson tools

- The workspace remains mounted while other studio tabs are visible. Save meaningful changes anyway: React state alone does not survive a page reload.
- The bridge remains stable during status reports. Its identity can change when commission context, theme, reduced motion, or fullscreen changes. Publish status from an effect or action, never during render. Identical reports are ignored; partial reports merge with the current status.
- `storage.save`, `remove`, `clear`, and `importAll` can throw if browser storage is unavailable or full. Show the error and keep the student's unsaved state in memory. `load` returns `null` for a missing record and throws for an unreadable existing record, leaving its bytes untouched.
- Store plain JSON objects, arrays, strings, booleans, null, and finite numbers. Give your own project format a version. Do not store functions, DOM nodes, renderer objects, cycles, or binary objects directly.
- Both providers should return the current project data, not an outdated closure. Use effect cleanup to unregister them. Project data and itemized costs are copied when delivery opens; subsequent edits do not mutate captured evidence.
- If changing React state and delivering within the same action, pass the newly computed data explicitly to `requestDelivery`. Providers based on React state see the state of their current render.
- Import/reset remounts `ArchitectureWorkspace` and clears previous providers/status. Read `bridge.storage.load` in your initialization to load the restored project. A framework-only backup does not replace workspace records.
- None of these hooks can approve a commission or pay coins. Teacher review remains authoritative.

# Himari's Architectural Workspace

Welcome to **`src/workspace/`**! This folder is Himari's personal software studio where she will progressively build her own architectural design application during lessons.

Everything outside this folder (`src/framework/`, `src/config/`, `src/components/`) manages Mr. Rabbit, commissions, budgets, coins, achievements, the portfolio, and teacher controls. **Your architectural tools belong right here inside `src/workspace/`.**

## Entry Point

`ArchitectureWorkspace.tsx` receives a single prop: `bridge: WorkspaceBridge` (defined in `src/workspace/integration.ts`).

The surrounding `WorkspaceHost` gives this component the full workspace container (flex column, full height) and supports a distraction-free **Maximize / Fullscreen** toggle, so you can cleanly add:
- Toolbars and mode selectors
- 2D SVG or HTML5 Canvas floor plan editors
- 3D viewports (e.g., Three.js when Himari reaches 3D commissions)
- Property inspectors and itemized cost calculators
- Asset palettes

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

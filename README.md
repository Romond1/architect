# Himari's Architecture Studio

An interactive educational software development studio and customer simulation framework where Himari builds her own architectural design application lesson by lesson.

## Quick Start

1. **Install dependencies** (first time only):
   ```bash
   npm install
   ```
2. **Start the local development server** (with Hot Module Replacement):
   ```bash
   npm run dev
   ```
   Open the local URL shown in the terminal (typically `http://localhost:5173`).

3. **Run type checks, unit/integration tests, and production build:**
   ```bash
   npm run typecheck
   npm test
   npm run build
   ```

## Studio Structure

- **`src/workspace/`** — **Where Himari builds her architectural software.**
  - Starts intentionally empty with a clean drafting-table empty state.
  - `src/workspace/ArchitectureWorkspace.tsx` is the main React component entry point.
  - `src/workspace/integration.ts` defines the documented `WorkspaceBridge` interface (`bridge.context`, `bridge.storage`, `bridge.reportStatus`, `bridge.registerSnapshotProvider`, `bridge.registerProjectDataProvider`, `bridge.requestDelivery`).
  - See [src/workspace/README.md](src/workspace/README.md) for code examples.
- **`src/config/`** — Editable configuration for studio branding (`studio.ts`), customer dialogue (`customers/mrRabbit.ts`), commissions (`commissions/initialCommissions.ts`), achievements (`rewards/achievements.ts`), and cosmetic shop items (`rewards/shopItems.ts`).
- **`src/framework/`** — Pure domain logic for commissions, customer expressions, separate construction budget vs. personal wallet economy, shop inventory, achievements, portfolio snapshots, and persistence.
- **`src/components/` & `src/app/`** — Studio interface, Mr. Rabbit SVG portrait with 8 expressions & wearable cosmetics, delivery modal, portfolio gallery, achievements gallery, reward shop, celebration sequence, and teacher controls.

## Accessing Teacher Controls

Click the discreet **Teacher** button on the far right of the top navigation bar and confirm the prompt.

From Teacher Controls, you can:
- **Review Submissions:** Inspect Himari's submitted screenshot, notes, and construction cost; mark Under Review; Approve with scripted or custom Mr. Rabbit dialogue; or Request Constructive Revisions by checking unmet requirements.
- **Commissions:** Preview all future sealed commissions, customize titles/dialogue/requirements/dimensions/budgets/payments, manually unlock or reopen commissions, and create new commissions (Commission 6+).
- **Wallet & Studio:** Inspect personal coin transactions, apply teacher wallet adjustments, and configure the studio title.
- **Backup & Reset:** Export full `.json` backups (including saved submission/portfolio images and workspace data), import saved backups, or safely reset progress.

## Persistence & Backups

- Framework progression is stored under `localStorage` key `himari.studio.framework.v1`, with uploaded/captured image artifacts stored in IndexedDB (`himari-architecture-studio-artifacts-v1`).
- Workspace tools use completely separate `himari.studio.workspace.v1.*` keys via `bridge.storage`, so editing or evolving architectural tools never erases customer progression.
- You can download a complete **Studio Backup (.json)** at any time in **Teacher → Backup & Reset**, or export a standalone **HTML Portfolio** / **JSON Portfolio** from the **Portfolio** tab.

## Lesson reliability and recovery

- The workspace stays mounted when visiting Portfolio, Achievements, or Reward Shop, so an unfinished editor does not disappear during a tab visit. Tools should still save meaningful changes through `bridge.storage` to survive reloads.
- Workspace storage failures throw an actionable error. Catch them in lesson tools and keep the unsaved design available. Framework save failures show a visible warning: keep the page open and export a full backup before closing it.
- Submitted project data is copied when delivery opens and again when submitted. Use plain JSON data; renderer instances, DOM nodes, functions, cycles, and non-finite numbers are rejected.
- Backups are checked for nested record shapes, financial consistency, commission/submission references, and required images before restore. Imported images use fresh IDs to avoid overwriting the current portfolio if a restore fails. Framework-only backups leave workspace records untouched. Failed framework saves roll back workspace replacement.
- Reset and workspace restore remount the workspace so its initializer can load the restored data. No new loading callback is required by the existing bridge contract.
- Explicit teacher reapproval still displays the new approved design in the portfolio. Earlier approved snapshots remain available under **Earlier approved versions**, and full/JSON backups retain them. Personal commission payments are still awarded only once.
- Invalid framework saves are retained in recovery storage. If recovery storage itself is full, automatic saves are blocked so the original cannot be overwritten accidentally.

`npm run typecheck` checks both application and Vite configuration projects. The test suite includes domain, persistence, live shell/provider integration, workspace lifecycle, storage failure, restore, and portfolio-history regression tests. Browser verification uses isolated test storage; the ordinary Chrome lesson profile is not seeded with test progress.

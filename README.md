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
   Open the local URL shown in the terminal (`http://localhost:5190` (reserved for this app; Vite reports an error if it is occupied)).

3. **Run type checks, unit/integration tests, and production build:**
   ```bash
   npm run typecheck
   npm test
   npm run build
   ```

## Studio Structure

- **`src/workspace/`** — **Where Himari builds her architectural software.**
  - Includes a deliberately limited single-room SVG editor. The initial project has no room: Himari chooses the measurements and creates it herself.
  - `src/workspace/ArchitectureWorkspace.tsx` is the main React component entry point.
  - `src/workspace/integration.ts` defines the documented `WorkspaceBridge` interface (`bridge.context`, `bridge.storage`, `bridge.reportStatus`, `bridge.registerSnapshotProvider`, `bridge.registerProjectDataProvider`, `bridge.requestDelivery`).
  - See [src/workspace/README.md](src/workspace/README.md) for the project model, drawing conventions, controls and bridge integration.
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

## First lesson: the room editor

1. Read Mr. Rabbit’s brief. Enter the inside width, inside length and wall thickness, then select **Create room**. The form starts at a neutral 3 × 3 m; it does not copy the customer’s requested dimensions.
2. Change measurements and select **Apply dimensions**. The drawing, floor area, inside perimeter and outside size update together. Drag or use arrow buttons/keys to pan; use zoom buttons and **Fit** (keyboard: +, −, 0).
3. **Export PNG** or **Save SVG** downloads a complete fitted plan, regardless of the current camera. **Deliver this plan** sends that same generated plan and JSON project through the existing delivery form. Enter the reported construction cost there: this editor does not estimate material costs.
4. Teacher controls still decide whether the design meets the brief. Only teacher approval awards the payment, achievement, portfolio entry and next commission.

The editor saves applied geometry and project-name changes on this computer. Unapplied measurement fields and the camera are temporary. The fresh application starts on Commission 1 with zero coins, no approved designs and no room. No progression is pre-completed.

Version 1 supports exactly one rectangular room, dimensions from 1–30 m and wall thickness from 0.05–0.60 m. It deliberately has no later architectural tools or placeholders. PNGs are 1600 × 1200; the metre scale bar describes drawing proportions, not a guaranteed physical print scale. Browser storage is local to the browser profile **and origin (including port)**; moving from port 5173 to 5190 does not automatically carry old saves. To move an existing save, export a full Teacher backup at the old origin and import it at the new origin.

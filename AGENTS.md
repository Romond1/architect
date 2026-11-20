# AGENTS.md — Guidance for Future Codex Lessons

Welcome! This project is **Himari's Architecture Studio**, an educational software development environment where a young student named **Himari** learns to build her own architectural design application step by step with her teacher and Codex.

Read these rules carefully before making any changes.

---

## 1. Core Educational Principle

- **Himari is the software architect and developer.** She owns the architectural design tools she builds during lessons.
- **Do NOT anticipate future commissions.** Implement *only* the architectural tools or capabilities requested in the current lesson.
- For example, if Himari asks for a 2D rectangular room drawing tool for Commission 1, build only that — do **not** prematurely add doors, windows, 3D rendering, materials, lighting, or furniture.

## 2. Where Architectural Features Belong

- Put all architectural tools, editors, renderers, geometry models, cost calculators, and asset libraries inside **`src/workspace/`**.
- The entry component is **`src/workspace/ArchitectureWorkspace.tsx`**, which receives `bridge: WorkspaceBridge` (defined in `src/workspace/integration.ts`).
- Keep `src/framework/`, `src/config/`, and the studio UI shell intact unless explicitly asked to fix a framework bug or adjust configuration.
- Never alter Mr. Rabbit's progression, coin payouts, achievement unlocking, or portfolio history from workspace code.
- Never auto-unlock future commissions or bypass teacher review/approval.

## 3. Integrating Workspace Tools with the Studio Framework

Use the `bridge` prop passed to `ArchitectureWorkspace` (documented in `src/workspace/README.md` and `src/workspace/integration.ts`):

- **Read active brief:** `bridge.context.activeCommission` (read-only title, budget, dimensions, requirements).
- **Save workspace designs safely:** `bridge.storage.save(key, value)` / `bridge.storage.load(key)` (uses isolated `himari.studio.workspace.v1.*` keys so customer progression is never touched).
- **Report live project title & cost:** `bridge.reportStatus({ projectName, estimatedCost, itemizedCosts, hasDeliverable })`.
- **Provide automatic screenshots / project data on delivery:** `bridge.registerSnapshotProvider(...)` and `bridge.registerProjectDataProvider(...)`.
- **Open the delivery form directly:** `bridge.requestDelivery(draft)`.

## 4. Coding & Collaboration Guidelines for Lessons

1. **Preserve Himari's existing implementations.** Build incrementally on top of her working code instead of rewriting or replacing it without a clear, explained reason.
2. **Prefer clear, readable code over clever abstractions.** Choose descriptive names, straightforward state, and well-structured small components so Himari can read, understand, and modify the code with her teacher.
3. **Explain important architectural and programming decisions** in clear, beginner-friendly language after making changes (e.g., how coordinates scale to metres, why state is saved separately, how SVG/Canvas/3D rendering works).
4. **Verify before reporting completion.** Run `npm run typecheck`, `npm test`, and `npm run build` (and visually inspect changes in the running app) before telling Himari and her teacher that a new tool is ready.

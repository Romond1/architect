# First-generation editor verification

Verified on 21 November 2026, using isolated Chromium storage. The ordinary lesson browser was opened at http://127.0.0.1:5190/ without creating a room or submitting a commission.

## Automated checks

- `npm run typecheck`: application and Vite configuration passed.
- `npm test`: 8 files, 53 tests passed, including existing progression/persistence/lifecycle regressions and 14 model/editor tests.
- `npm run build`: production build passed.
- `git diff --check`: no whitespace errors.

## Real browser workflow

1. Fresh context: Commission 1, zero coins, no room. Created the neutral 3 × 3 m room and manually changed it to 4 × 5 m with 0.20 m walls. Verified area 20 m² and inside perimeter 18 m.
2. Zoomed, panned and fitted the plan. Visited Reward Shop, Portfolio and Achievements, returning to the unchanged project each time. Reload restored dimensions.
3. Downloaded a real 1600 × 1200 PNG and standalone SVG; inspected the generated plan visually. The light-paper image contains four walls, interior dimensions, area, grid and scale bar.
4. Selected Deliver this plan: the delivery preview received the generated PNG directly, with no uploaded substitute image. Entered a manual construction cost of 700. Submitted, then approved using teacher controls.
5. Verified 100-coin payment, earned `junior-architect` achievement, one portfolio entry with the actual 1600-pixel-wide image and captured version-1 room data. Accepted the next commission and verified Commission 2 active.
6. Reloaded and verified the portfolio image survived through real IndexedDB persistence. No browser page errors occurred.
7. Closed the isolated context. A fresh context still opened with Commission 1, zero coins and no room. No test progression was written to the user's browser profile.

## Visual and boundary checks

- Desktop and 390-pixel mobile layouts inspected. Mobile navigation now wraps without horizontal page overflow.
- Fullscreen inspected and lower editor controls confirmed reachable by scrolling.
- 1 × 30, 30 × 1, 1 × 1 and 30 × 30 m rooms checked at supported thickness extremes. Text bounds fit the plan, including a 32-character wide-glyph title. Long headings are constrained independently of camera zoom.
- No later architectural capability, hidden implementation or future-feature placeholder was added. The bridge interface, commission definitions, teacher approval, payments and shop behavior were preserved.

## Intentional limits

One rectangular room only; 1–30 m interior dimensions, 0.05–0.60 m uniform wall thickness. Measurement edits take effect when applied. Construction cost remains manually reported. Camera and unapplied fields are temporary. The scale bar conveys real-world proportions; export does not promise a physical print ratio. Browser saves are local to an origin/profile; moving existing progress to port 5190 requires a Teacher backup from the previous origin.

# First-generation room editor

Goal: one editable rectangular room in Neon's workspace, without introducing any later architectural capabilities.

Design: a version-1 JSON project stores an optional room in metres and a project title. Width/length are inside measurements; thickness grows outward. Start without a room and with neutral 3 × 3 m form values. Use SVG primitives for four solid walls, dimensions, a 0.5 m grid and a metre scale bar. Camera state is presentation-only. The same drawing component renders the editor and an always-fitted export SVG; native browser rasterization produces PNG delivery evidence. No construction cost calculation is introduced.

- [x] Write failing model and editor tests; replace only the superseded empty-workspace assertions in existing tests.
- [x] Implement model validation, area/perimeter calculations, view bounds and camera calculations independently of React.
- [x] Implement accessible creation/edit/reset controls, zoom/pan/fit, SVG drawing and PNG/SVG export in src/workspace/.
- [x] Integrate isolated workspace persistence, status and capture/data provider cleanup through the existing bridge. Preserve unreadable saved data until explicit recovery.
- [x] Run type checks, the existing and new unit/integration tests, and production build.
- [x] Verify creation, editing, zoom/pan/fit, navigation, reload, real PNG delivery, teacher approval, 100-coin payment, first achievement, portfolio and Commission 2 unlocking in an isolated real browser. Inspect desktop/mobile/fullscreen images; leave the ordinary profile untouched.
- [x] Document project semantics and extension points, review the diff, commit and push the completed work. Preserve the pre-editor Git snapshot.

Scope guard: no doors, windows, additional rooms, heights, materials, textures, furniture, lights or 3D code; no future-feature placeholders; teacher approval remains the only completion authority.

## Plan: Calendar Routine Desktop Redesign

Refresh the Weekly Routine section on the calendar page to match the portal’s current visual system and interaction quality, while keeping mobile behavior unchanged. The implementation will modernize desktop hierarchy, spacing, readability, interaction affordances, and utility UX (filters, legend clarity, empty/loading states) using existing design tokens and established page/component patterns.

**Steps**

1. Baseline audit and guardrails

- Confirm current desktop-only render path in /home/tokit/Orios-Portal/src/components/RoutineViewer/index.js (desktopView table) and the mobile path (mobileView cards).
- Define hard boundary: no functional or style changes under the existing mobile media behavior in /home/tokit/Orios-Portal/src/components/RoutineViewer/styles.module.css @media (max-width: 768px).
- Capture visual targets from /home/tokit/Orios-Portal/src/pages/assignments.module.css and /home/tokit/Orios-Portal/src/pages/calendar.module.css for consistent typography/card/spacing rhythm.

2. Desktop IA and component structure upgrades

- In /home/tokit/Orios-Portal/src/components/RoutineViewer/index.js, add desktop-only UX controls above the table:
- Day filter (All days + individual days) using pill control pattern.
- Optional compact/full density toggle for readability without changing data.
- Ensure desktop controls are not rendered in mobileView.
- Keep data model unchanged (days, timeSlots, schedule) and preserve today highlighting logic.

3. Desktop table redesign (visual + readability)

- Refactor desktop table semantics and wrappers in /home/tokit/Orios-Portal/src/components/RoutineViewer/index.js to support:
- Stronger section header row and sticky first column clarity.
- Better empty cell affordance (explicit free slot visual treatment instead of near-invisible blank cells).
- Slot metadata hierarchy: subject primary, room/teacher secondary.
- Update /home/tokit/Orios-Portal/src/components/RoutineViewer/styles.module.css desktop selectors only:
- Increase font sizes and paddings for desktop readability.
- Replace dated flat overlays with token-driven surfaces, borders, and shadows.
- Improve type differentiation (lecture/lab) with clearer badge/stripe system beyond subtle color wash.
- Introduce desktop animation polish matching existing transition tokens.

4. Calendar page section-level polish

- In /home/tokit/Orios-Portal/src/pages/calendar.js, upgrade Weekly Routine heading block and supporting context (desktop-focused):
- Add concise helper text and stronger visual grouping to match other sections.
- Move/standardize decorative elements (Orio image) so the section feels intentional and not floating.
- In /home/tokit/Orios-Portal/src/pages/calendar.module.css, tune routineSection spacing and desktop layout rhythm to align with Event and Assignment sections.

5. Desktop UX overhaul additions (without mobile changes)

- Add desktop-only empty state for missing routine data in /home/tokit/Orios-Portal/src/components/RoutineViewer/index.js (actionable message when days/timeSlots/schedule are absent).
- Add desktop-only “Today” quick-jump affordance tied to current day row/selection.
- Improve legend clarity and placement for quick scanning on large screens.
- Ensure keyboard accessibility for desktop controls (pill filter/toggles) and visible focus states via styles in /home/tokit/Orios-Portal/src/components/RoutineViewer/styles.module.css.

6. Consistency pass against design tokens

- Normalize colors, spacing, radii, shadows, and typography to tokens from /home/tokit/Orios-Portal/src/css/custom.css.
- Remove hardcoded desktop magic values where token equivalents exist.
- Validate both light/dark themes for contrast and parity.

7. Verification and regression checks

- Run lint/build checks to ensure no JSX/CSS regressions.
- Manual verification on desktop breakpoints (>=769px) for:
- Filter behavior and table rendering
- Sticky headers/columns behavior
- Today highlight and quick-jump
- Empty/loading states and legend clarity
- Confirm mobile UI remains unchanged at <=768px.

**Parallelism and dependencies**

1. Step 1 blocks all implementation.
2. Step 2 and Step 4 can run in parallel after Step 1.
3. Step 3 depends on Step 2 structure decisions.
4. Step 5 depends on Step 2 and Step 3.
5. Step 6 depends on Steps 3-5.
6. Step 7 runs last.

**Relevant files**

- /home/tokit/Orios-Portal/src/components/RoutineViewer/index.js — primary desktop routine structure and interaction logic; preserve mobile render path.
- /home/tokit/Orios-Portal/src/components/RoutineViewer/styles.module.css — desktop visual system refresh and accessibility focus styles; no mobile behavior change.
- /home/tokit/Orios-Portal/src/pages/calendar.js — routine section heading/context refinements and desktop UX framing.
- /home/tokit/Orios-Portal/src/pages/calendar.module.css — section-level desktop spacing, alignment, and rhythm tuning.
- /home/tokit/Orios-Portal/src/css/custom.css — design token source for consistency checks (read/reuse, likely minimal direct edits).
- /home/tokit/Orios-Portal/src/pages/assignments.module.css — reference for pills/cards/spacing rhythm to match modern sections.

**Verification**

1. Run project checks: npm run build (and npm run lint if available in scripts).
2. Desktop manual test at 1024px/1280px/1440px: verify layout balance, controls, and slot readability.
3. Desktop interaction test: day filter, density toggle (if included), today quick-jump, hover/focus states.
4. Theme test: light and dark mode contrast for slot types, table headers, legend, and helper text.
5. Mobile non-regression at 390px and 768px: confirm visual/behavior parity with current mobile routine UI.

**Decisions**

- Included scope: desktop-only routine redesign on calendar page, including substantial desktop UX improvements.
- Excluded scope: mobile routine redesign and backend/data model/API changes.
- Constraint honored: keep existing routine data structure and admin routine-manager compatibility.

# Conference Todos

## Overview

Roadmap of conference todos for future agents. Each item lists a short goal, a
status, the concrete files to touch, and acceptance notes. Work through items
top to bottom; pick the highest-priority `Open` item unless told otherwise.

Legend: P1 (critical) · P2 (important) · P3 (nice-to-have)
Status: Open · In Progress · Blocked · Done

> Important convention for all "disable" items: only DISABLE/HIDE the UI entry
> point (tab / section / checkbox). The business logic (services, stores, the
> simulation engine, graph builders) must stay intact so the feature can be
> re-enabled later. Prefer hiding the entry point over deleting files.

## Items

| # | Category | Description | Priority | Status |
|---|----------|-------------|----------|--------|
| C-001 | Repositories | Integrate upstream `woped/woped-next` into the fork | P1 | Done |
| C-002 | UI/Branding | Square transitions | P2 | Done |
| C-003 | UI/Branding | Square subprocess | P2 | Done |
| C-004 | UI/Branding | Add WoPeD logo (favicon/tab, toolbar, landing, help) | P2 | Done |
| C-005 | Analysis | Disable Soundness Check UI (keep logic) | P2 | Done |
| C-006 | Analysis | Disable Quantitative Simulation UI (keep logic) | P2 | Done |
| C-007 | Analysis | Rename "State Space Graphs" → "State Space Analysis" | P3 | Done |
| C-008 | Analysis | Disable Custom Metrics UI (keep logic) | P3 | Done |
| C-009 | Analysis | Coverability graph: multiset marking on hover/click | P2 | Done |
| C-010 | Analysis fix | Rename Workflow Check to Workflow Net Property | P2 | Done |
| C-011 | Analysis fix | Move Free Choice under Soundness | P2 | Done |

**Completed:** 2026-06-22 (commits `8b84b1e` … `79728da` on fork `main`), except C-010.

---

## 1. Repositories

### C-001 — Integrate upstream into the fork ✅

**Goal:** Bring upstream `github.com/woped/woped-next` changes into the fork
`github.com/TaminoFischer/woped-next`.

**Done (2026-06-22):** Upstream remote added; fork fast-forwarded (~61 commits).
Local operator-glyph WIP was stashed and reapplied without conflicts. Build and
tests passed before subsequent conference commits landed on `main`.

---

## 2. UI / Branding

### C-002 — Square transitions ✅

**Goal:** Render Petri net transitions as squares instead of 40×30 rectangles.

**Done (2026-06-22):** In **van der Aalst** notation, transitions use equal width
and height via `getTransitionSize()` in
[src/types/petri-net.ts](../../src/types/petri-net.ts). Modern notation keeps the
original 40×30 rectangle. Canvas:
[src/components/canvas/TransitionNode.vue](../../src/components/canvas/TransitionNode.vue).

### C-003 — Square subprocess ✅

**Goal:** Render subprocesses as squares instead of 80×50 rectangles.

**Done (2026-06-22):** Same notation-aware approach as C-002 via
`getSubProcessSize()` in [src/types/petri-net.ts](../../src/types/petri-net.ts).
Canvas: [src/components/canvas/SubProcessNode.vue](../../src/components/canvas/SubProcessNode.vue).

### C-004 — Add WoPeD logo ✅

**Goal:** Introduce the WoPeD logo across the app.

**Done (2026-06-22):**

1. **Favicon + tab** — [index.html](../../index.html), asset [public/woped-logo.svg](../../public/woped-logo.svg)
2. **Toolbar** — [src/components/editor/EditorToolbar.vue](../../src/components/editor/EditorToolbar.vue) (links to https://woped.dhbw-karlsruhe.de)
3. **Welcome splash** — [public/woped-splash.jpg](../../public/woped-splash.jpg), splash tour step in [src/help/tours.ts](../../src/help/tours.ts), [src/components/help/GuidedTour.vue](../../src/components/help/GuidedTour.vue)
4. **Help dialog** — [src/components/help/HelpDialog.vue](../../src/components/help/HelpDialog.vue)

See also [bugfixes-improvements.md](./bugfixes-improvements.md) B-006, B-008.

---

## 3. Analysis features

### C-005 — Disable Soundness Check UI (keep logic) ✅

**Done (2026-06-22):** Hidden via `SHOW_SOUNDNESS_CHECK = false` in
[src/components/analysis/AnalysisPanel.vue](../../src/components/analysis/AnalysisPanel.vue).
`soundnessAnalyzer.ts`, chat `analyze_model` tool, and i18n keys remain intact.

### C-006 — Disable Quantitative Simulation UI (keep logic) ✅

**Done (2026-06-22):** Hidden via `SHOW_SIMULATION = false` in
[src/components/editor/PetriNetEditor.vue](../../src/components/editor/PetriNetEditor.vue).
Simulation engine, store, and components under `src/components/simulation/` unchanged.

### C-007 — Rename "State Space Graphs" → "State Space Analysis" ✅

**Done (2026-06-22):** i18n updated in [src/i18n/locales/en.ts](../../src/i18n/locales/en.ts),
[src/i18n/locales/de.ts](../../src/i18n/locales/de.ts) (`Zustandsraumanalyse`), and help
locales. Section label in [src/components/analysis/AnalysisPanel.vue](../../src/components/analysis/AnalysisPanel.vue).

### C-008 — Disable Custom Metrics UI (keep logic) ✅

**Done (2026-06-22):** Hidden via `SHOW_CUSTOM_METRICS = false` in
[src/components/analysis/AnalysisPanel.vue](../../src/components/analysis/AnalysisPanel.vue).
[CustomMetricsBuilder.vue](../../src/components/analysis/CustomMetricsBuilder.vue) kept.

### C-009 — Coverability graph: multiset marking on hover/click ✅

**Done (2026-06-22):** Hover/click on coverability/reachability nodes shows multiset
marking in a tooltip. Implemented in
[src/components/analysis/CoverabilityGraphView.vue](../../src/components/analysis/CoverabilityGraphView.vue)
using existing `formatMarking()` and place-name resolution.

---

## 4. Analysis fixes

### C-010 — Rename Workflow Check label ✅

**Done (2026-06-22):** Renamed `analysis.workflowCheck` to **Workflow Net Property**
(EN) and **Workflow-Netz-Eigenschaft** (DE) in
[src/i18n/locales/en.ts](../../src/i18n/locales/en.ts),
[src/i18n/locales/de.ts](../../src/i18n/locales/de.ts), and matching help copy.

### C-011 — Move Free Choice under Soundness ✅

**Done (2026-06-22):** Free Choice removed from Workflow Check info issues in
[src/services/analysis/workflowAnalyzer.ts](../../src/services/analysis/workflowAnalyzer.ts).
Presentation moved under the Soundness section in
[src/components/analysis/AnalysisPanel.vue](../../src/components/analysis/AnalysisPanel.vue)
(coordinated with C-005 — subsection remains in codebase for when Soundness UI is
re-enabled).

---

## Related improvements (post-conference)

Documented in [bugfixes-improvements.md](./bugfixes-improvements.md):

| ID | Summary |
|----|---------|
| B-002 | van der Aalst glyphs in operator toolbar dropdown |
| B-003 | Quick Connect successor menu |
| B-004 | Marquee box selection (Shift + drag) |
| B-005 | Multi-selection delete button fix |
| B-006 | Logo links to official WoPeD website |
| B-007 | Canvas pan (middle mouse / Space+drag) |
| B-008 | Welcome splash + Discord CTA |
| B-009 | Default light theme |
| B-011 | Reduced wheel/trackpad zoom sensitivity |
| B-012 | Place circle size aligned with operator squares |

---

## Notes

- All UI texts must be translated (`$t('key')`, EN + DE).
- "Disable" items hide the UI only; keep services/stores/engine intact.
- Confirm git and label-wording decisions with the user before executing
  destructive or ambiguous steps.

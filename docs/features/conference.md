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
| C-001 | Repositories | Integrate upstream `woped/woped-next` into the fork | P1 | Open |
| C-002 | UI/Branding | Square transitions | P2 | Open |
| C-003 | UI/Branding | Square subprocess | P2 | Open |
| C-004 | UI/Branding | Add WoPeD logo (favicon/tab, toolbar, landing, help) | P2 | Open |
| C-005 | Analysis | Disable Soundness Check UI (keep logic) | P2 | Open |
| C-006 | Analysis | Disable Quantitative Simulation UI (keep logic) | P2 | Open |
| C-007 | Analysis | Rename "State Space Graphs" → "State Space Analysis" | P3 | Open |
| C-008 | Analysis | Disable Custom Metrics UI (keep logic) | P3 | Open |
| C-009 | Analysis | Coverability graph: multiset marking on hover/click | P2 | Open |
| C-010 | Analysis fix | Fix Workflow Check label | P2 | Open |
| C-011 | Analysis fix | Move Free Choice under Soundness | P2 | Open |

---

## 1. Repositories

### C-001 — Integrate upstream into the fork

**Goal:** Bring upstream `github.com/woped/woped-next` changes into the fork
`github.com/TaminoFischer/woped-next`.

**Context (kept high-level — confirm before executing):**

- The fork shares full git history with upstream and is roughly 61 commits
  behind. Last shared commit is `07d7895` (2026-05-18); upstream is a strict
  superset (no fork-only commits on `main`), so integration should be close to a
  clean fast-forward rather than a three-way merge.
- Upstream is **not** configured as a remote in the fork yet.
- There is uncommitted local WIP on the fork (the operator-glyph work). Preserve
  it (stash or commit) **before** integrating.
- Conflict-prone files to watch when reapplying the local WIP:
  [src/components/canvas/OperatorNode.vue](../../src/components/canvas/OperatorNode.vue),
  [src/components/canvas/SubProcessNode.vue](../../src/components/canvas/SubProcessNode.vue),
  [src/stores/config.ts](../../src/stores/config.ts),
  [src/types/config.ts](../../src/types/config.ts),
  [src/i18n/locales/en.ts](../../src/i18n/locales/en.ts),
  [src/i18n/locales/de.ts](../../src/i18n/locales/de.ts).

**Acceptance:** Fork builds and tests pass after integration; local operator-glyph
work is preserved; agent confirms strategy (remote name, fast-forward vs. rebase)
with the user before running any non-readonly git commands.

---

## 2. UI / Branding

### C-002 — Square transitions

**Goal:** Render Petri net transitions as squares instead of 40×30 rectangles.

**Files:**

- Dimensions live in `VISUAL.transition` in
  [src/types/petri-net.ts](../../src/types/petri-net.ts) (currently
  `width: 40, height: 30`). Set `width === height` (e.g. both 40).
- Rendering: [src/components/canvas/TransitionNode.vue](../../src/components/canvas/TransitionNode.vue)
  reads `VISUAL.transition` and needs no change if the constant is updated.

**Note:** Downstream consumers pick up the constant automatically — arc geometry
([src/utils/geometry.ts](../../src/utils/geometry.ts)), dagre layout
([src/utils/layout/hierarchical.ts](../../src/utils/layout/hierarchical.ts)),
minimap ([src/components/editor/OverviewPanel.vue](../../src/components/editor/OverviewPanel.vue)),
and image export ([src/services/file/imageExporter.ts](../../src/services/file/imageExporter.ts)).

**Acceptance:** Transitions render square; arcs still connect cleanly; layout,
minimap, and PNG/SVG export look correct.

### C-003 — Square subprocess

**Goal:** Render subprocesses as squares instead of 80×50 rectangles.

**Files:** `VISUAL.subprocess` in
[src/types/petri-net.ts](../../src/types/petri-net.ts) (currently
`width: 80, height: 50`, plus `innerOffset: 4`, `cornerRadius: 6`). Set
`width === height`. Rendering in
[src/components/canvas/SubProcessNode.vue](../../src/components/canvas/SubProcessNode.vue)
needs no change if the constant is updated.

**Acceptance:** Subprocess renders square with its double border; arcs/layout/
export still correct.

### C-004 — Add WoPeD logo

**Goal:** Introduce the WoPeD logo across the app. No WoPeD image assets exist yet
(the favicon is still the default Vite logo).

**Targets:**

1. **Favicon + browser tab title** —
   [index.html](../../index.html) (`<link rel="icon" href="/vite.svg">` and
   `<title>woped-next</title>`). Add the logo asset to `public/` and update both.
2. **Main UI / toolbar** —
   [src/components/editor/EditorToolbar.vue](../../src/components/editor/EditorToolbar.vue)
   (no branding today). Add the logo at the start of the toolbar.
3. **Landing / welcome screen** — first-visit welcome tour, text-only today; see
   [src/i18n/locales/help-en.ts](../../src/i18n/locales/help-en.ts) /
   [src/i18n/locales/help-de.ts](../../src/i18n/locales/help-de.ts) and the tour
   UI [src/components/help/GuidedTour.vue](../../src/components/help/GuidedTour.vue).
4. **Help dialog** —
   [src/components/help/HelpDialog.vue](../../src/components/help/HelpDialog.vue)
   (header uses `$t('help.title')`; add logo to the header).

**Note:** Existing `public/vite.svg` and `src/assets/vue.svg` are leftover Vite/Vue
boilerplate and can be replaced/removed.

**Acceptance:** WoPeD logo appears in the browser tab, toolbar, welcome screen, and
help dialog; light and dark themes both look right.

---

## 3. Analysis features

### C-005 — Disable Soundness Check UI (keep logic)

**Goal:** Hide the Soundness Check from the UI; keep the analysis logic.

**Files:**

- Hide the soundness `AnalysisResults` block in
  [src/components/analysis/AnalysisPanel.vue](../../src/components/analysis/AnalysisPanel.vue)
  (around the `$t('analysis.soundnessCheck')` block).

**Keep intact:** `src/services/analysis/soundnessAnalyzer.ts` (also provides
`buildCoverabilityGraph` / `buildReachabilityGraph` used by State Space), the
`analyze_model` chat tool ([src/services/tools/analysisTool.ts](../../src/services/tools/analysisTool.ts)),
and i18n keys.

**Acceptance:** Soundness Check is not visible in the Analysis panel; coverability/
reachability graph and chat analysis still work.

### C-006 — Disable Quantitative Simulation UI (keep logic)

**Goal:** Hide the quantitative simulation feature from the UI; keep the engine.

**Files:**

- Hide the simulation tab/button (and its `<SimulationPanel>` render) in
  [src/components/editor/PetriNetEditor.vue](../../src/components/editor/PetriNetEditor.vue)
  (the `rightPanelTab === 'simulation'` tab). Optionally hide the related help
  tours.

**Keep intact:** `src/components/simulation/*`,
[src/stores/simulation.ts](../../src/stores/simulation.ts), `SimulationEngine`
and exporters under `src/services/simulation/`.

**Caution:** The Settings dialog tab labeled "Simulation"
([src/components/settings/SettingsDialog.vue](../../src/components/settings/SettingsDialog.vue))
actually holds **Token Game** settings — do not touch it.

**Acceptance:** Quantitative simulation tab is gone from the editor; Token Game and
its settings still work.

### C-007 — Rename "State Space Graphs" → "State Space Analysis"

**Goal:** Relabel the section (label change only, no logic change).

**Files:**

- i18n key `analysis.stateSpaceGraphs` in
  [src/i18n/locales/en.ts](../../src/i18n/locales/en.ts) and
  [src/i18n/locales/de.ts](../../src/i18n/locales/de.ts) (suggested DE:
  `Zustandsraumanalyse`).
- Hardcoded help strings in
  [src/i18n/locales/help-en.ts](../../src/i18n/locales/help-en.ts) /
  [src/i18n/locales/help-de.ts](../../src/i18n/locales/help-de.ts).
- The section is rendered in
  [src/components/analysis/AnalysisPanel.vue](../../src/components/analysis/AnalysisPanel.vue).

**Acceptance:** UI and help consistently read "State Space Analysis" (EN) /
"Zustandsraumanalyse" (DE).

### C-008 — Disable Custom Metrics UI (keep logic)

**Goal:** Hide the Custom Metrics section; keep the component.

**Files:** Hide the Custom Metrics section in
[src/components/analysis/AnalysisPanel.vue](../../src/components/analysis/AnalysisPanel.vue).
Keep [src/components/analysis/CustomMetricsBuilder.vue](../../src/components/analysis/CustomMetricsBuilder.vue)
and the `analysis.customMetrics` i18n key.

**Acceptance:** Custom Metrics section no longer shows in the Analysis panel.

### C-009 — Coverability graph: multiset marking on hover/click

**Goal:** Show the marking of a coverability/reachability graph node as a multiset
(Multimengen-Darstellung) on hover or click.

**Files:** [src/components/analysis/CoverabilityGraphView.vue](../../src/components/analysis/CoverabilityGraphView.vue).
Each node already carries its marking on `node.marking`
(`Record<string, number | 'omega'>`, sparse — zero-token places omitted). A
`formatMarking()` helper exists. Add interaction (`@mouseenter` / `@click`) on the
node `<circle>` groups (currently `pointer-events: none` and no hover handlers) and
render the multiset in a tooltip/popover. Resolve place names via
`net.value.places`.

**Multiset notation to display:** if a net has places `{s1, s2, s3}` with 2 tokens
on `s1`, 1 on `s2`, and `s3` empty:

```
M = {s1, s1, s2}
M = 2·s1 + 1·s2 + 0·s3
```

**Acceptance:** Hovering/clicking a graph node shows its marking in multiset form;
omega (unbounded) markings render as `ω`.

---

## 4. Analysis fixes

### C-010 — Fix Workflow Check label

**Goal:** Correct the wrong "Workflow net property" label in the Workflow Check.

**Investigation pointer:** No literal string "Workflow net property" exists in the
source. The likely target is the section label `analysis.workflowCheck`
("Workflow Check" / "Workflow-Prüfung") in
[src/i18n/locales/en.ts](../../src/i18n/locales/en.ts) /
[src/i18n/locales/de.ts](../../src/i18n/locales/de.ts), used in
[src/components/analysis/AnalysisPanel.vue](../../src/components/analysis/AnalysisPanel.vue).
Confirm with the user which label is wrong and what it should read before editing.

**Acceptance:** The Workflow Check section/property is labeled correctly and
consistently (EN/DE).

### C-011 — Move Free Choice under Soundness

**Goal:** Free Choice should belong under Soundness, not under Workflow / Statistics.

**Context:** Free Choice is currently surfaced in two places, neither under
soundness:

1. The Statistics collapsible in
   [src/components/analysis/AnalysisPanel.vue](../../src/components/analysis/AnalysisPanel.vue)
   (`$t('analysis.freeChoice')`).
2. As a Workflow Check info issue (only when `freeChoice === true`) in
   [src/services/analysis/workflowAnalyzer.ts](../../src/services/analysis/workflowAnalyzer.ts).

Free Choice itself is computed by `checkFreeChoice` in
[src/services/analysis/statistics.ts](../../src/services/analysis/statistics.ts).

**Also note** the related todo "Start/end? kein free choice": the start/end
(source/sink place) checks live in
[src/services/analysis/workflowAnalyzer.ts](../../src/services/analysis/workflowAnalyzer.ts);
free choice should not be reported as part of the start/end workflow context.

**Acceptance:** Free Choice is presented under a Soundness subsection and removed
from the Workflow/Statistics context; behavior is consistent with the relabeling in
C-010. (Note: C-005 hides the Soundness UI — coordinate so this subsection is
either shown together with soundness or re-enabled as needed.)

---

## Notes

- All UI texts must be translated (`$t('key')`, EN + DE).
- "Disable" items hide the UI only; keep services/stores/engine intact.
- Confirm git and label-wording decisions with the user before executing
  destructive or ambiguous steps.

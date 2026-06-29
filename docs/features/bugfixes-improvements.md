# Bugfixes & Minor Improvements

## Overview

Collection of bugfixes, minor improvements, and adjustments that don't justify a dedicated feature document. Entries are documented chronologically and grouped by category.

## Open Items

| # | Category | Description | Priority | Status |
|---|----------|-------------|----------|--------|
| — | — | *No entries yet* | — | — |

Legend: 🐛 Bug | 🔧 Adjustment | 💅 UI/UX | ⚡ Performance | 🧹 Refactoring

## Completed Items

| # | Category | Description | Completed |
|---|----------|-------------|-----------|
| B-001 | 💅 UI/UX | van der Aalst operator notation (transition box with directional chevron) as a switchable rendering mode | 2026-06-15 |
| B-002 | 💅 UI/UX | van der Aalst chevron glyphs in the operator toolbar dropdown (matches canvas notation) | 2026-06-22 |
| B-003 | 💅 UI/UX | Quick Connect pad on right-click (Camunda-style successor menu) | 2026-06-22 |
| B-004 | 💅 UI/UX | Marquee box selection on empty canvas (left drag; Shift additive) | 2026-06-22 |
| B-005 | 🐛 Bug | Toolbar/properties Delete button works for multi-selection (not only keyboard Delete) | 2026-06-22 |
| B-006 | 💅 UI/UX | WoPeD logos in toolbar, help dialog, and welcome tour link to https://woped.dhbw-karlsruhe.de | 2026-06-22 |
| B-007 | 💅 UI/UX | Canvas pan via middle mouse or Space+drag (select tool uses left drag for marquee) | 2026-06-22 |
| B-010 | 💅 UI/UX | Remove element context menu; duplicate/open/delete via properties panel & shortcuts | 2026-06-22 |
| B-008 | 💅 UI/UX | Welcome splash screen with WoPeD image and Discord community CTA on first visit | 2026-06-22 |
| B-009 | 🔧 Adjustment | Default theme set to light instead of system | 2026-06-22 |
| B-011 | 🔧 Adjustment | Reduced wheel and trackpad zoom sensitivity on the editor canvas | 2026-06-22 |
| B-012 | 💅 UI/UX | Place circle diameter matches operator square edge length (40 px) | 2026-06-22 |

## Feature Details

### B-001 — van der Aalst Operator Notation

Workflow operators (AND/XOR split/join and the four combined variants) can now be
rendered in the authentic WoPeD / van der Aalst notation, matching the legacy Java
WoPeD editor.

**Behavior**

- **van der Aalst (default):** Each operator is drawn as a transition rectangle with
  an internal directional chevron, rendered monochrome in the inner-drawing colour
  (matching the legacy WoPeD editor — no green/orange). Following the legacy
  `OperatorTransitionModel`, the **side** of the chevron encodes split vs. join
  (split = flow-forward side, join = backward side) and the **arrow direction**
  encodes the logic type: **AND chevrons point inward, XOR chevrons point outward**
  (XOR also adds a divider line). All chevrons share the same monochrome outline +
  faint fill (no solid/hollow distinction). Combined operators show two chevrons (a
  primary glyph on the join side plus an opposite glyph with flipped direction on the
  split side). Subprocesses follow the same notation and are rendered as a transition
  refinement: a neutral, sharp-cornered transition box with a double border (no
  BPMN-style rounded blue box or `⊞` expand marker).
- **Modern (alternative):** The previous gateway-style glyphs — diamond for AND,
  circle-with-X for XOR — and the BPMN-style rounded subprocess box remain available.

The chevron orientation (N/E/S/W) is derived from the flow direction of the connected
arcs, with a horizontal left-to-right fallback (join = west, split = east).

**Configuration**

- New setting `editor.operatorNotation: 'vanDerAalst' | 'modern'` (default
  `'vanDerAalst'`), persisted in the config store.
- Selectable via Settings → Editor → Operator Notation.

**Implementation**

| Area | File |
|------|------|
| Config type & default | [src/types/config.ts](../../src/types/config.ts) |
| Store getter / setter | [src/stores/config.ts](../../src/stores/config.ts) |
| Glyph geometry & orientation helpers | [src/utils/operatorGlyph.ts](../../src/utils/operatorGlyph.ts) |
| Canvas rendering (operators) | [src/components/canvas/OperatorNode.vue](../../src/components/canvas/OperatorNode.vue) |
| Canvas rendering (subprocesses) | [src/components/canvas/SubProcessNode.vue](../../src/components/canvas/SubProcessNode.vue) |
| Settings UI | [src/components/settings/SettingsDialog.vue](../../src/components/settings/SettingsDialog.vue) |
| Translations (en/de) | [src/i18n/locales/en.ts](../../src/i18n/locales/en.ts), [src/i18n/locales/de.ts](../../src/i18n/locales/de.ts) |
| Tests | [src/__tests__/operatorGlyph.test.ts](../../src/__tests__/operatorGlyph.test.ts) |

The chevron geometry is ported from the legacy `PetriNetElementView.drawOperatorArrow2`.

**Out of scope:** PNML expansion into inner transitions (`{id}_op_{n}`) and center
places (`P_CENTER_{id}`) for byte-level compatibility with legacy WoPeD files. This is
a separate file-interoperability concern; operators are currently stored as a single
transition with `<toolspecific><operator>`.

### B-002 — Operator Menu-glyphs (van der Aalst)

The operator tool dropdown in the toolbar now uses notation-aware icons instead of
modern diamond/X symbols when van der Aalst notation is active.

| Area | File |
|------|------|
| SVG chevron icon component | [src/components/editor/OperatorAalstIcon.vue](../../src/components/editor/OperatorAalstIcon.vue) |
| Toolbar integration | [src/components/editor/EditorToolbar.vue](../../src/components/editor/EditorToolbar.vue) |

### B-003 — Quick Connect

Right-click a place, transition, operator, or subprocess in select mode to open a
floating pad with logical next elements. Choosing an option creates the element and
connects it with an arc automatically. When adding an operator from a place, a
submenu lets the user pick the operator type. Replaces the former right-click context
menu (2026-06-22).

| Area | File |
|------|------|
| Option logic & positioning | [src/utils/quickConnect.ts](../../src/utils/quickConnect.ts) |
| Store action | [src/stores/petriNet.ts](../../src/stores/petriNet.ts) (`quickConnectAdd`) |
| UI component | [src/components/editor/QuickConnectPad.vue](../../src/components/editor/QuickConnectPad.vue) |
| Canvas wiring | [src/components/editor/EditorCanvas.vue](../../src/components/editor/EditorCanvas.vue) |
| Tests | [src/__tests__/quickConnect.test.ts](../../src/__tests__/quickConnect.test.ts) |

### B-004 — Marquee Selection

With the select tool, left drag on empty canvas draws a selection rectangle and
selects all elements whose bounds intersect it. Hold Shift to add to the existing
selection. Middle mouse button drag pans the viewport instead. Hold Space and drag to pan as well (works on trackpads).

| Area | File |
|------|------|
| Bounds & hit testing | [src/utils/marqueeSelection.ts](../../src/utils/marqueeSelection.ts) |
| Canvas interaction | [src/components/editor/EditorCanvas.vue](../../src/components/editor/EditorCanvas.vue) |
| Multi-select store API | [src/stores/petriNet.ts](../../src/stores/petriNet.ts) (`selectMultiple`) |
| Tests | [src/__tests__/marqueeSelection.test.ts](../../src/__tests__/marqueeSelection.test.ts) |

### B-005 — Multi-delete Fix

The Delete tool in the toolbar and the delete button in the properties panel now
delete the current selection when `selectedIds.length > 0`, matching keyboard
Delete/Backspace behaviour.

| Area | File |
|------|------|
| Toolbar | [src/components/editor/EditorToolbar.vue](../../src/components/editor/EditorToolbar.vue) |
| Properties panel | [src/components/editor/PropertiesPanel.vue](../../src/components/editor/PropertiesPanel.vue) |

### B-006 — WoPeD Logo Links

WoPeD logos in the toolbar, help dialog header, and welcome tour link to the
official site in a new tab (`rel="noopener noreferrer"`). Tooltip/aria-label via
`common.visitWopedWebsite` (EN/DE).

| Area | File |
|------|------|
| Toolbar | [src/components/editor/EditorToolbar.vue](../../src/components/editor/EditorToolbar.vue) |
| Help dialog | [src/components/help/HelpDialog.vue](../../src/components/help/HelpDialog.vue) |
| Guided tour | [src/components/help/GuidedTour.vue](../../src/components/help/GuidedTour.vue) |
| i18n | [src/i18n/locales/en.ts](../../src/i18n/locales/en.ts), [src/i18n/locales/de.ts](../../src/i18n/locales/de.ts) |

### B-007 — Canvas Pan

Middle mouse button drag or Space + left drag pans the viewport (grab/grabbing cursor while
panning). With the select tool, left drag on empty canvas performs marquee selection (B-004).
Right-click an element opens Quick Connect (B-003). Other tools still pan on empty left drag.

| Area | File |
|------|------|
| Canvas interaction | [src/components/editor/EditorCanvas.vue](../../src/components/editor/EditorCanvas.vue) |
| Help copy | [src/i18n/locales/help-en.ts](../../src/i18n/locales/help-en.ts), [src/i18n/locales/help-de.ts](../../src/i18n/locales/help-de.ts) |

### B-008 — Welcome Splash Screen

First visit (or cleared `woped-help` localStorage) shows a centered splash step
before the guided UI tour: WoPeD splash image, welcome text, and Discord community
link/button.

| Area | File |
|------|------|
| Splash asset | [public/woped-splash.jpg](../../public/woped-splash.jpg) |
| Tour step definition | [src/help/tours.ts](../../src/help/tours.ts) (`variant: 'splash'`) |
| Tour UI | [src/components/help/GuidedTour.vue](../../src/components/help/GuidedTour.vue) |
| i18n | [src/i18n/locales/help-en.ts](../../src/i18n/locales/help-en.ts), [src/i18n/locales/help-de.ts](../../src/i18n/locales/help-de.ts) |

### B-009 — Light Theme Default

New sessions default to light theme (`general.theme: 'light'`) instead of following
the OS via `system`. Existing saved config in localStorage is unchanged.

| Area | File |
|------|------|
| Default config | [src/types/config.ts](../../src/types/config.ts) |
| Tests | [src/__tests__/config.store.test.ts](../../src/__tests__/config.store.test.ts) |

### B-010 — Context Menu Removed

The former right-click context menu on canvas elements was removed. Duplicate,
open subprocess, and delete remain available via the properties panel and keyboard
shortcuts. Quick Connect (B-003) now owns the right-click gesture in select mode.

| Area | File |
|------|------|
| Removed component | ~~`src/components/editor/ContextMenu.vue`~~ |
| Editor shell | [src/components/editor/PetriNetEditor.vue](../../src/components/editor/PetriNetEditor.vue) |

### B-011 — Wheel Zoom Sensitivity

Mouse wheel and trackpad zoom no longer apply a fixed 10% scale step per event.
Zoom delta is derived from the wheel pixel delta with exponential scaling, so
trackpad scrolling is smooth and a mouse wheel notch changes zoom by roughly 4–5%.
Each event is capped at ±6% to prevent large jumps from pinch gestures.

Toolbar +/- buttons are unchanged (20% per click).

| Area | File |
|------|------|
| Zoom math | [src/utils/wheelZoom.ts](../../src/utils/wheelZoom.ts) |
| Canvas wheel handler | [src/components/editor/EditorCanvas.vue](../../src/components/editor/EditorCanvas.vue) |
| Viewport composable | [src/composables/useViewport.ts](../../src/composables/useViewport.ts) |

### B-012 — Place Circle Size

Place circles are sized so their diameter equals the operator square edge length
(`VISUAL.operator.size`, 40 px). Token markings inside places were scaled
proportionally.

| Area | File |
|------|------|
| Visual constants | [src/types/petri-net.ts](../../src/types/petri-net.ts) |
| Canvas rendering | [src/components/canvas/PlaceNode.vue](../../src/components/canvas/PlaceNode.vue) |

## Template

New entries use the following format in the table:

| Field | Description |
|-------|-------------|
| **#** | Sequential number (B-001, B-002, ...) |
| **Category** | 🐛 Bug, 🔧 Adjustment, 💅 UI/UX, ⚡ Performance, 🧹 Refactoring |
| **Description** | Brief description of the issue or change |
| **Priority** | P1 (critical), P2 (important), P3 (nice-to-have) |
| **Status** | 🔜 Planned, 🚧 In Progress, ✅ Done |

When completed, entries are moved from "Open Items" to "Completed Items" with the date added.

### Example

**Open:**

| # | Category | Description | Priority | Status |
|---|----------|-------------|----------|--------|
| B-010 | 🐛 Bug | Arc weight not displayed correctly at negative zoom | P2 | 🔜 Planned |

**Completed:**

| # | Category | Description | Completed |
|---|----------|-------------|-----------|
| B-011 | 🔧 Adjustment | Changed default grid size from 20px to 25px | 2026-05-03 |

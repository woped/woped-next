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
| B-001 | 🐛 Bug | Arc weight not displayed correctly at negative zoom | P2 | 🔜 Planned |
| B-002 | 💅 UI/UX | Tooltip delay too long in dark mode | P3 | 🚧 In Progress |

**Completed:**

| # | Category | Description | Completed |
|---|----------|-------------|-----------|
| B-003 | 🔧 Adjustment | Changed default grid size from 20px to 25px | 2026-05-03 |

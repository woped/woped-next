# Bugfixes & Minor Improvements

## Overview

Collection of bugfixes, minor improvements, and adjustments that don't justify a dedicated feature document. Entries are documented chronologically and grouped by category.

## Open Items

| # | Category | Description | Priority | Status |
|---|----------|-------------|----------|--------|
| B-001 | 💅 UI/UX | Adopt van der Aalst notation in canvas: square transitions, square operator transitions (AND/XOR split/join), square double-framed subprocesses | P2 | 🔜 Planned |

Legend: 🐛 Bug | 🔧 Adjustment | 💅 UI/UX | ⚡ Performance | 🧹 Refactoring

### B-001 Concept - Van der Aalst Notation

- **Goal:** Align the editor's visual notation with the requested van der Aalst style for transition-like nodes.
- **Canvas rendering updates:**
  - `src/components/canvas/TransitionNode.vue`: render transitions as strict squares (same width/height), keep selection/token-game highlighting behavior.
  - `src/components/canvas/OperatorNode.vue`: replace diamond/circle operator shapes with square transition-style nodes and show AND/XOR + split/join semantics inside the node.
  - `src/components/canvas/SubProcessNode.vue`: keep double-frame semantics but use square corners (double-framed square, not rounded rectangle).
- **Shared visual model updates:**
  - `src/types/petri-net.ts`: adjust `VISUAL.transition`, `VISUAL.operator`, and `VISUAL.subprocess` dimensions/styling tokens so geometry, snapping, and arc anchor calculations remain consistent.
  - `src/types/petri-net.ts`: update `OPERATOR_INFO.symbol` values to the new notation used in toolbar/type indicators.
- **Editor UI consistency:**
  - `src/components/editor/EditorToolbar.vue`: update tool and operator dropdown icons so toolbar notation matches canvas notation.
  - `src/types/help.ts` and any help/tooltip text that still references old operator symbols should be updated to match the new notation.
- **Validation and test impact:**
  - Add or adapt component/store tests in `src/__tests__/` to verify operator type rendering metadata and updated symbols.
  - Run `npm run test:run` and `npm run build` to ensure no regressions in editor rendering and type usage.

## Completed Items

| # | Category | Description | Completed |
|---|----------|-------------|-----------|
| — | — | *No entries yet* | — |

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

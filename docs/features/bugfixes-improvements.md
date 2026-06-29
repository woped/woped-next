### B-003 — Quick Connect

Right-click a place, transition, operator, or subprocess in select mode to open a floating pad with logical next elements. Choosing an option creates the element and connects it automatically. The new floating pad UI component introduced is:

- UI component: [src/components/editor/QuickConnectPad.vue](../../src/components/editor/QuickConnectPad.vue)

### B-002 — Operator Menu-glyphs (van der Aalst)

The operator tool dropdown now uses notation-aware chevron icons instead of diamond/X symbols in van der Aalst notation.

- SVG chevron icon component: [src/components/editor/OperatorAalstIcon.vue](../../src/components/editor/OperatorAalstIcon.vue)

### Token Game - New Branch Choice Dialog

A new dialog component was introduced for XOR branch choice during token games.

- Dialog component: [src/components/token-game/BranchChoiceDialog.vue](../../src/components/token-game/BranchChoiceDialog.vue)

### Composables

- The `useViewport` composable was modified to support advanced viewport controls including zoom, pan, and fit-to-view logic.

- File: [src/composables/useViewport.ts](../../src/composables/useViewport.ts)

These additions add to the editor UI and token game experience, improving navigation, interaction, and notation fidelity.

(Other existing documented features remain unchanged.)

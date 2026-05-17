---
name: create-component
description: >-
  Create a new Vue component for WoPeD Next. Use when adding UI in src/components/
  (editor, canvas, analysis, simulation, token-game) or when the user asks for a
  new component. Covers script setup, i18n, theming, vue-konva canvas patterns, and tests.
---

# Create Component

## When to use

- User asks to add a new Vue component, panel, dialog, or canvas node
- Feature work needs a new file under `src/components/`

## Before you start

1. Read `.cursor/rules/project.mdc` and `.cursor/rules/vue-components.mdc`
2. For canvas/Petri net elements, also read `.cursor/rules/petri-net.mdc`
3. Find a **similar existing component** and mirror its structure

| Area | Folder | Examples |
|------|--------|----------|
| Canvas (Konva) | `src/components/canvas/` | `PlaceNode.vue`, `TransitionNode.vue`, `ArcEdge.vue` |
| Editor | `src/components/editor/` | `PropertiesPanel.vue`, `EditorToolbar.vue` |
| Analysis | `src/components/analysis/` | `AnalysisPanel.vue` |
| Simulation | `src/components/simulation/` | `SimulationPanel.vue` |
| Token game | `src/components/token-game/` | `TokenGameControls.vue` |

## Checklist

### 1. File and naming

- [ ] Create `ComponentName.vue` in the correct subfolder
- [ ] PascalCase filename; register only if needed (prefer local import)
- [ ] Use `<script setup>` (add `lang="ts"` when using `import type`)

### 2. Script setup structure

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
// stores, types, utils as needed

const props = defineProps<{ /* ... */ }>()
const emit = defineEmits<{ (e: 'click', id: string): void }>()
</script>
```

- [ ] Props via `defineProps` with types where practical
- [ ] Events via `defineEmits` with typed payloads
- [ ] Use `storeToRefs` for Pinia state; call **actions** on the store directly
- [ ] For nested config, prefer store getters or `$state` (see `.cursor/rules/pinia-stores.mdc`)

### 3. Internationalization (required for UI text)

- [ ] All visible strings use `$t('key.path')` or `t()` from `useI18n()`
- [ ] Add keys to **both** `src/i18n/locales/en.ts` and `de.ts`
- [ ] Use nested keys, e.g. `editor.toolbar.save`

### 4. Theming (required)

- [ ] Use CSS variables: `var(--color-bg)`, `var(--color-text)`, `var(--color-border)`, `var(--color-primary)`
- [ ] `<style scoped>` for component styles
- [ ] No hardcoded theme colors in layout CSS (canvas may use computed colors from `useConfigStore().isDarkMode`)

### 5. Canvas components (vue-konva) — only if under `src/components/canvas/`

Follow patterns from `PlaceNode.vue` and `ArcEdge.vue`:

- [ ] Pass Konva node config via **computed** objects, e.g. `:config="circleConfig"`
- [ ] Read sizes from `VISUAL` in `src/types/petri-net.ts` when applicable
- [ ] Theme-aware stroke/fill via `computed` + `useConfigStore()`
- [ ] Emit `click`, `dragend`, etc.; let parent/store handle model updates
- [ ] **Do not use `v-if` on vue-konva layers** — use Konva `visible: true/false` in config instead
- [ ] Geometry/routing: reuse `src/utils/geometry.ts` and `src/utils/routing.ts`

Example pattern:

```typescript
const circleConfig = computed(() => ({
  x: props.place.position.x,
  y: props.place.position.y,
  radius: VISUAL.place.radius,
  fill: colors.value.fill,
  stroke: props.isSelected ? colors.value.selectedStroke : colors.value.stroke,
  visible: props.visible,
}))
```

### 6. Store integration

- [ ] Canvas nodes: receive model objects as props (`place`, `arc`, …); avoid mutating props
- [ ] Editor panels: use `usePetriNetStore`, `useConfigStore`, etc. as needed
- [ ] New IDs for net elements: `nanoid()` in store actions, not in the component

### 7. Tests

- [ ] Add or extend tests in `src/__tests__/` (Vitest + `happy-dom`)
- [ ] Component tests: `@vue/test-utils` + `createPinia()` in `beforeEach` when stores are used
- [ ] Prefer testing behavior and store integration over snapshot-only tests

### 8. Verify

```bash
npm run test:run
npm run build
```

## Do not

- Hardcode German/English UI strings
- Hardcode colors in scoped CSS (use CSS variables)
- Put business logic in canvas components when it belongs in `src/services/` or stores
- Duplicate types — import from `src/types/`

## References

- Rules: `.cursor/rules/vue-components.mdc`, `.cursor/rules/petri-net.mdc`
- Canvas examples: `src/components/canvas/PlaceNode.vue`, `src/components/canvas/ArcEdge.vue`
- Architecture: `docs/dev/architecture.md`

<script setup>
/**
 * GraphBeautifier — standalone auto-layout component.
 * Wraps LayoutSettings with a one-click "beautify" action.
 */
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { usePetriNetStore } from '@/stores/petriNet'
import { useViewport } from '@/composables/useViewport'
import { autoLayout } from '@/utils/layout'

const { t } = useI18n()

const props = defineProps({
  canvasWidth: { type: Number, default: 800 },
  canvasHeight: { type: Number, default: 600 },
})

const store = usePetriNetStore()
const { net } = storeToRefs(store)
const { fitToView } = useViewport()

const applied = ref(false)

function beautify() {
  const result = autoLayout(net.value, {
    algorithm: 'hierarchical',
    direction: 'LR',
    nodeSpacing: 80,
    rankSpacing: 120,
  })
  if (result.success) {
    store.applyLayout(result.positions)
    setTimeout(() => fitToView(props.canvasWidth, props.canvasHeight), 50)
    applied.value = true
    setTimeout(() => { applied.value = false }, 2000)
  }
}
</script>

<template>
  <button class="beautifier-btn" :class="{ applied }" @click="beautify" :title="$t('layout.apply')">
    {{ applied ? '✓' : '✨' }} {{ $t('layout.beautify') }}
  </button>
</template>

<style scoped>
.beautifier-btn {
  padding: 6px 14px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  color: var(--color-text);
  transition: all 0.15s;
}

.beautifier-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-primary);
}

.beautifier-btn.applied {
  background: #dcfce7;
  border-color: #22c55e;
  color: #166534;
}
</style>

<script setup>
import { ref, computed } from 'vue'
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

const emit = defineEmits(['applied'])

const store = usePetriNetStore()
const { net } = storeToRefs(store)
const { fitToView } = useViewport()

const layoutAlgorithm = ref('hierarchical')
const layoutDirection = ref('LR')
const nodeSpacing = ref(80)
const rankSpacing = ref(120)

const algorithms = computed(() => [
  { id: 'hierarchical', label: t('layout.hierarchical') },
  { id: 'force', label: t('layout.forceDirected') },
  { id: 'grid', label: t('layout.grid') },
])

const directions = computed(() => [
  { id: 'LR', label: t('layout.leftToRight') },
  { id: 'TB', label: t('layout.topToBottom') },
  { id: 'RL', label: t('layout.rightToLeft') },
  { id: 'BT', label: t('layout.bottomToTop') },
])

function applyLayout() {
  const result = autoLayout(net.value, {
    algorithm: layoutAlgorithm.value,
    direction: layoutDirection.value,
    nodeSpacing: nodeSpacing.value,
    rankSpacing: rankSpacing.value,
  })

  if (result.success) {
    store.applyLayout(result.positions)
    setTimeout(() => {
      fitToView(props.canvasWidth, props.canvasHeight)
    }, 50)
  }

  emit('applied')
}
</script>

<template>
  <div class="layout-settings">
    <div class="ls-header">{{ $t('layout.settings') }}</div>

    <div class="ls-field">
      <label>{{ $t('layout.algorithm') }}</label>
      <select v-model="layoutAlgorithm">
        <option v-for="a in algorithms" :key="a.id" :value="a.id">{{ a.label }}</option>
      </select>
    </div>

    <div class="ls-field">
      <label>{{ $t('layout.direction') }}</label>
      <select v-model="layoutDirection">
        <option v-for="d in directions" :key="d.id" :value="d.id">{{ d.label }}</option>
      </select>
    </div>

    <div class="ls-field">
      <label>{{ $t('layout.nodeSpacing') }}</label>
      <input v-model.number="nodeSpacing" type="number" min="40" max="200" step="10" />
    </div>

    <div class="ls-field">
      <label>{{ $t('layout.rankSpacing') }}</label>
      <input v-model.number="rankSpacing" type="number" min="60" max="300" step="10" />
    </div>

    <button class="ls-apply" @click="applyLayout">{{ $t('layout.apply') }}</button>
  </div>
</template>

<style scoped>
.layout-settings {
  min-width: 220px;
}

.ls-header {
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}

.ls-field {
  padding: 10px 14px;
  border-bottom: 1px solid var(--color-border-light);
}

.ls-field:last-of-type {
  border-bottom: none;
}

.ls-field label {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-muted);
  margin-bottom: 6px;
}

.ls-field select,
.ls-field input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 13px;
  color: var(--color-text);
  background: var(--color-bg-secondary);
  box-sizing: border-box;
}

.ls-apply {
  width: calc(100% - 28px);
  margin: 10px 14px;
  padding: 8px 16px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.ls-apply:hover {
  opacity: 0.9;
}
</style>

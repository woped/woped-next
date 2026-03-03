<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useTokenGameStore } from '@/stores/tokenGame'

const { t } = useI18n()
const tokenGameStore = useTokenGameStore()
const {
  isRunning,
  currentStep,
  totalSteps,
  canStepBackward,
  canStepForward,
  history,
  historyIndex,
} = storeToRefs(tokenGameStore)

const historyEntries = computed(() =>
  history.value.map((marking, idx) => ({
    index: idx,
    isCurrent: idx === historyIndex.value,
    firedTransition: marking.firedTransition || (idx === 0 ? t('tokenGame.initial') : '?'),
    tokenCount: Object.values(marking.tokens).reduce((s, v) => s + v, 0),
  }))
)

const goToStep = (idx) => {
  while (tokenGameStore.historyIndex > idx && tokenGameStore.canStepBackward) {
    tokenGameStore.stepBackward()
  }
  while (tokenGameStore.historyIndex < idx && tokenGameStore.canStepForward) {
    tokenGameStore.stepForward()
  }
}
</script>

<template>
  <div v-if="isRunning" class="history-panel">
    <div class="hp-header">
      <span class="hp-title">{{ $t('tokenGame.history') || 'History' }}</span>
      <span class="hp-counter">{{ currentStep }} / {{ totalSteps }}</span>
    </div>
    <div class="hp-list">
      <div
        v-for="entry in historyEntries"
        :key="entry.index"
        :class="['hp-entry', { current: entry.isCurrent }]"
        @click="goToStep(entry.index)"
      >
        <span class="hp-step">{{ entry.index }}</span>
        <span class="hp-label">{{ entry.firedTransition }}</span>
        <span class="hp-tokens">{{ entry.tokenCount }}</span>
      </div>
    </div>
    <div class="hp-actions">
      <button :disabled="!canStepBackward" @click="tokenGameStore.goToStart()">⏮</button>
      <button :disabled="!canStepBackward" @click="tokenGameStore.stepBackward()">◀</button>
      <button :disabled="!canStepForward" @click="tokenGameStore.stepForward()">▶</button>
      <button :disabled="!canStepForward" @click="tokenGameStore.goToEnd()">⏭</button>
      <button @click="tokenGameStore.reset()">↺</button>
    </div>
  </div>
</template>

<style scoped>
.history-panel {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 12px;
  overflow: hidden;
}

.hp-header {
  display: flex;
  justify-content: space-between;
  padding: 8px 10px;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}

.hp-title {
  font-weight: 600;
  color: var(--color-text);
  font-size: 11px;
  text-transform: uppercase;
}

.hp-counter {
  color: var(--color-text-muted);
  font-size: 11px;
}

.hp-list {
  max-height: 160px;
  overflow-y: auto;
  padding: 4px;
}

.hp-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--color-text-secondary);
}

.hp-entry:hover {
  background: var(--color-bg-tertiary);
}

.hp-entry.current {
  background: var(--color-primary);
  color: #fff;
}

.hp-step {
  font-weight: 600;
  min-width: 18px;
  text-align: center;
  font-size: 10px;
}

.hp-label {
  flex: 1;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hp-tokens {
  font-size: 10px;
  opacity: 0.7;
}

.hp-actions {
  display: flex;
  gap: 4px;
  padding: 8px;
  border-top: 1px solid var(--color-border);
  justify-content: center;
}

.hp-actions button {
  padding: 4px 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-bg-secondary);
  color: var(--color-text);
  cursor: pointer;
  font-size: 11px;
}

.hp-actions button:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
}

.hp-actions button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useTokenGameStore } from '@/stores/tokenGame'
import { usePetriNetStore } from '@/stores/petriNet'

const { t } = useI18n()
const tokenGameStore = useTokenGameStore()
const petriNetStore = usePetriNetStore()

const { showConflictDialog, enabledTransitions, enabledSubprocesses } = storeToRefs(tokenGameStore)
const { net } = storeToRefs(petriNetStore)

// Get enabled items with names
const enabledItems = computed(() => {
  if (!net.value) return []
  const items = []
  
  for (const id of enabledTransitions.value) {
    const transition = (net.value.transitions || []).find(tr => tr.id === id) ||
                       (net.value.operators || []).find(o => o.id === id)
    items.push({
      id,
      type: 'transition',
      name: transition?.name || id,
      icon: '▶',
    })
  }
  
  for (const id of enabledSubprocesses.value) {
    const subprocess = (net.value.subProcesses || []).find(s => s.id === id)
    items.push({
      id,
      type: 'subprocess',
      name: subprocess?.name || id,
      icon: '⊞',
    })
  }
  
  return items
})

// Select an item
const selectItem = (item) => {
  if (item.type === 'transition') {
    tokenGameStore.fireTransition(item.id)
  } else {
    tokenGameStore.stepIntoSubprocess(item.id)
  }
  tokenGameStore.setShowConflictDialog(false)
}

// Close dialog
const close = () => {
  tokenGameStore.setShowConflictDialog(false)
}

// Highlight element on canvas
const highlightElement = (id) => {
  petriNetStore.clearSelection()
  petriNetStore.select(id, false)
}
</script>

<template>
  <div v-if="showConflictDialog" class="conflict-overlay" @click.self="close">
    <div class="conflict-dialog">
      <div class="dialog-header">
        <h3>{{ $t('tokenGame.conflictTitle') }}</h3>
        <button class="close-btn" @click="close">×</button>
      </div>
      
      <div class="dialog-body">
        <p class="description">{{ $t('tokenGame.conflictDescription') }}</p>
        
        <div class="options-list">
          <button
            v-for="item in enabledItems"
            :key="item.id"
            class="option-item"
            @click="selectItem(item)"
            @mouseenter="highlightElement(item.id)"
          >
            <span class="option-icon" :class="item.type">{{ item.icon }}</span>
            <span class="option-name">{{ item.name }}</span>
            <span class="option-type">{{ item.type === 'transition' ? $t('properties.transition') : $t('subprocess.title') }}</span>
          </button>
        </div>
      </div>
      
      <div class="dialog-footer">
        <button class="btn-cancel" @click="close">{{ $t('common.cancel') }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.conflict-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.conflict-dialog {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  width: 360px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
}

.dialog-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 20px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text);
}

.dialog-body {
  padding: 16px;
  overflow-y: auto;
  max-height: 400px;
}

.description {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg);
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.option-item:hover {
  border-color: var(--color-primary);
  background: var(--color-bg-tertiary);
}

.option-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.option-icon.transition {
  background: #dcfce7;
  color: #166534;
}

.option-icon.subprocess {
  background: #dbeafe;
  color: #1e40af;
}

:global(.dark) .option-icon.transition {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

:global(.dark) .option-icon.subprocess {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.option-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
}

.option-type {
  font-size: 11px;
  color: var(--color-text-muted);
}

.dialog-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
}

.btn-cancel {
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-size: 13px;
  cursor: pointer;
}

.btn-cancel:hover {
  background: var(--color-bg-tertiary);
}
</style>

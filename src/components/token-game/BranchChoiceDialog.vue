<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useTokenGameStore } from '@/stores/tokenGame'
import { usePetriNetStore } from '@/stores/petriNet'

const tokenGameStore = useTokenGameStore()
const petriNetStore = usePetriNetStore()

const { pendingBranchChoice } = storeToRefs(tokenGameStore)

const options = computed(() => pendingBranchChoice.value?.options ?? [])

const selectOption = (option) => {
  tokenGameStore.resolveBranchChoice(option.arcId)
}

const close = () => {
  tokenGameStore.cancelBranchChoice()
}

const highlightPlace = (placeId) => {
  petriNetStore.clearSelection()
  petriNetStore.select(placeId, false)
}
</script>

<template>
  <div v-if="pendingBranchChoice" class="branch-overlay" @click.self="close">
    <div class="branch-dialog">
      <div class="dialog-header">
        <h3>{{ $t('tokenGame.branchTitle') }}</h3>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="dialog-body">
        <p class="description">{{ $t('tokenGame.branchDescription') }}</p>

        <div class="options-list">
          <button
            v-for="option in options"
            :key="option.arcId"
            class="option-item"
            @click="selectOption(option)"
            @mouseenter="highlightPlace(option.placeId)"
          >
            <span class="option-icon">○</span>
            <span class="option-name">{{ option.placeName }}</span>
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
.branch-overlay {
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

.branch-dialog {
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
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  background: var(--color-bg-tertiary);
  color: var(--color-text);
}

.option-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
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

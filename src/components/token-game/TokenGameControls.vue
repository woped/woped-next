<script setup>
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useTokenGameStore } from '@/stores/tokenGame'

const tokenGameStore = useTokenGameStore()
const {
  status,
  isRunning,
  isPlaying,
  isPaused,
  canStepBackward,
  canStepForward,
  currentStep,
  totalSteps,
  isDeadlock,
  enabledTransitions,
  autoPlayDelay,
  conflictResolution,
  isAnimating,
} = storeToRefs(tokenGameStore)

// Local delay value for slider
const localDelay = ref(autoPlayDelay.value)

// Sync delay with store
watch(localDelay, (val) => {
  tokenGameStore.setAutoPlayDelay(val)
})

// Conflict resolution options
const conflictOptions = [
  { id: 'manual', label: 'Manual' },
  { id: 'random', label: 'Random' },
  { id: 'first', label: 'First' },
]

// Button handlers
const handleStart = () => {
  tokenGameStore.start()
}

const handleStop = () => {
  tokenGameStore.stop()
}

const handlePlay = () => {
  tokenGameStore.resume()
}

const handlePause = () => {
  tokenGameStore.pause()
}

const handleStepBackward = () => {
  tokenGameStore.stepBackward()
}

const handleStepForward = () => {
  if (enabledTransitions.value.length === 1) {
    tokenGameStore.fireTransition(enabledTransitions.value[0])
  } else if (enabledTransitions.value.length > 1 && conflictResolution.value !== 'manual') {
    // Auto-select based on resolution mode
    const selected = tokenGameStore.selectTransition()
    if (selected) {
      tokenGameStore.fireTransition(selected)
    }
  }
}

const handleGoToStart = () => {
  tokenGameStore.goToStart()
}

const handleGoToEnd = () => {
  tokenGameStore.goToEnd()
}

const handleReset = () => {
  tokenGameStore.reset()
}

const setConflictResolution = (mode) => {
  tokenGameStore.setConflictResolution(mode)
}

// Status display
const statusText = computed(() => {
  if (isDeadlock.value) return 'Deadlock!'
  if (isPlaying.value) return 'Playing...'
  if (isPaused.value) return 'Paused'
  return 'Stopped'
})

const statusClass = computed(() => {
  if (isDeadlock.value) return 'status-deadlock'
  if (isPlaying.value) return 'status-playing'
  if (isPaused.value) return 'status-paused'
  return 'status-stopped'
})
</script>

<template>
  <div class="token-game-controls">
    <div class="controls-header">
      <span class="title">Token Game</span>
      <span :class="['status', statusClass]">{{ statusText }}</span>
    </div>

    <!-- Main Controls -->
    <div class="main-controls">
      <!-- Start/Stop -->
      <button
        v-if="!isRunning"
        class="control-btn primary"
        @click="handleStart"
        title="Start Token Game"
      >
        ▶ Start
      </button>
      <button
        v-else
        class="control-btn danger"
        @click="handleStop"
        title="Stop Token Game"
      >
        ■ Stop
      </button>

      <!-- Play/Pause Controls (only when running) -->
      <template v-if="isRunning">
        <div class="transport-controls">
          <button
            class="control-btn small"
            :disabled="!canStepBackward"
            @click="handleGoToStart"
            title="Go to Start"
          >
            ⏮
          </button>
          <button
            class="control-btn small"
            :disabled="!canStepBackward"
            @click="handleStepBackward"
            title="Step Backward"
          >
            ◀
          </button>
          <button
            v-if="!isPlaying"
            class="control-btn"
            :disabled="enabledTransitions.length === 0 || isAnimating"
            @click="handlePlay"
            title="Auto Play"
          >
            ▶
          </button>
          <button
            v-else
            class="control-btn"
            @click="handlePause"
            title="Pause"
          >
            ⏸
          </button>
          <button
            class="control-btn small"
            :disabled="enabledTransitions.length === 0 || isAnimating"
            @click="handleStepForward"
            title="Fire Next Transition"
          >
            ▶
          </button>
          <button
            class="control-btn small"
            :disabled="!canStepForward"
            @click="handleGoToEnd"
            title="Go to End"
          >
            ⏭
          </button>
        </div>
      </template>
    </div>

    <!-- History Display -->
    <div v-if="isRunning" class="history-info">
      <span>Step {{ currentStep }} / {{ totalSteps }}</span>
      <button
        class="control-btn text"
        @click="handleReset"
        title="Reset to Initial Marking"
      >
        ↺ Reset
      </button>
    </div>

    <!-- Enabled Transitions -->
    <div v-if="isRunning && enabledTransitions.length > 0" class="enabled-info">
      <div class="label">Enabled ({{ enabledTransitions.length }}):</div>
      <div class="enabled-list">
        <span
          v-for="id in enabledTransitions"
          :key="id"
          class="enabled-badge"
        >
          {{ id.substring(0, 8) }}...
        </span>
      </div>
    </div>

    <!-- Settings -->
    <div v-if="isRunning" class="settings">
      <div class="setting-row">
        <label>Speed:</label>
        <input
          type="range"
          v-model.number="localDelay"
          min="100"
          max="3000"
          step="100"
          class="speed-slider"
        />
        <span class="speed-value">{{ (localDelay / 1000).toFixed(1) }}s</span>
      </div>

      <div class="setting-row">
        <label>Conflicts:</label>
        <div class="btn-group">
          <button
            v-for="option in conflictOptions"
            :key="option.id"
            :class="['option-btn', { active: conflictResolution === option.id }]"
            @click="setConflictResolution(option.id)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Deadlock Warning -->
    <div v-if="isDeadlock" class="deadlock-warning">
      <span class="warning-icon">⚠</span>
      <span>No transitions enabled - the net is in a deadlock state.</span>
    </div>
  </div>
</template>

<style scoped>
.token-game-controls {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
  min-width: 280px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.controls-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.title {
  font-weight: 600;
  color: #111827;
}

.status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.status-stopped {
  background: #f3f4f6;
  color: #6b7280;
}

.status-paused {
  background: #fef3c7;
  color: #92400e;
}

.status-playing {
  background: #dcfce7;
  color: #166534;
}

.status-deadlock {
  background: #fee2e2;
  color: #991b1b;
}

.main-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.transport-controls {
  display: flex;
  gap: 4px;
}

.control-btn {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.15s ease;
}

.control-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-btn.primary {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.control-btn.primary:hover {
  background: #2563eb;
}

.control-btn.danger {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

.control-btn.danger:hover {
  background: #dc2626;
}

.control-btn.small {
  padding: 6px 8px;
  min-width: 32px;
}

.control-btn.text {
  border: none;
  background: none;
  color: #3b82f6;
  padding: 4px 8px;
}

.control-btn.text:hover {
  background: #eff6ff;
}

.history-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #f9fafb;
  border-radius: 6px;
  margin-bottom: 10px;
  font-size: 12px;
  color: #4b5563;
}

.enabled-info {
  margin-bottom: 10px;
}

.enabled-info .label {
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 4px;
}

.enabled-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.enabled-badge {
  background: #dcfce7;
  color: #166534;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-family: monospace;
}

.settings {
  border-top: 1px solid #e5e7eb;
  padding-top: 10px;
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.setting-row label {
  font-size: 11px;
  color: #6b7280;
  min-width: 60px;
}

.speed-slider {
  flex: 1;
  height: 4px;
}

.speed-value {
  font-size: 11px;
  color: #374151;
  min-width: 35px;
  text-align: right;
}

.btn-group {
  display: flex;
  gap: 2px;
}

.option-btn {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  background: white;
  font-size: 10px;
  cursor: pointer;
}

.option-btn:first-child {
  border-radius: 4px 0 0 4px;
}

.option-btn:last-child {
  border-radius: 0 4px 4px 0;
}

.option-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.deadlock-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #991b1b;
  font-size: 12px;
  margin-top: 10px;
}

.warning-icon {
  font-size: 16px;
}
</style>

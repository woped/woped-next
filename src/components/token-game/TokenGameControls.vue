<script setup>
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useTokenGameStore } from '@/stores/tokenGame'
import { usePetriNetStore } from '@/stores/petriNet'
import TokenGameStats from './TokenGameStats.vue'
import ConflictDialog from './ConflictDialog.vue'
import HistoryPanel from './HistoryPanel.vue'

const { t } = useI18n()
const tokenGameStore = useTokenGameStore()
const petriNetStore = usePetriNetStore()
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
  enabledSubprocesses,
  autoPlayDelay,
  conflictResolution,
  isAnimating,
  isInSubprocess,
  subprocessDepth,
  hasConflict,
  showConflictDialog,
} = storeToRefs(tokenGameStore)

// Local delay value for slider
const localDelay = ref(autoPlayDelay.value)

// Sync delay: local -> store
watch(localDelay, (val) => {
  tokenGameStore.setAutoPlayDelay(val)
})

// Sync delay: store -> local (when game starts or settings change)
watch(autoPlayDelay, (val) => {
  localDelay.value = val
})

// Conflict resolution options
const conflictOptions = computed(() => [
  { id: 'manual', label: t('tokenGame.manual') },
  { id: 'random', label: t('tokenGame.random') },
  { id: 'priority', label: t('tokenGame.priority') },
])

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
  // If only one transition/subprocess is enabled, fire it
  if (totalEnabled.value === 1) {
    if (enabledTransitions.value.length === 1) {
      tokenGameStore.fireTransition(enabledTransitions.value[0])
    } else if (enabledSubprocesses.value.length === 1) {
      tokenGameStore.stepIntoSubprocess(enabledSubprocesses.value[0])
    }
  } else if (totalEnabled.value > 1) {
    if (conflictResolution.value === 'manual') {
      // Show conflict dialog for manual selection
      tokenGameStore.setShowConflictDialog(true)
    } else {
      // Auto-select based on resolution mode (includes subprocesses)
      const selection = tokenGameStore.selectNextAction()
      if (selection) {
        if (selection.type === 'transition') {
          tokenGameStore.fireTransition(selection.id)
        } else {
          tokenGameStore.stepIntoSubprocess(selection.id)
        }
      }
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

const handleStepOut = () => {
  tokenGameStore.stepOutOfSubprocess()
}

const setConflictResolution = (mode) => {
  tokenGameStore.setConflictResolution(mode)
}

// Check if step out is possible
const canStepOutComputed = computed(() => tokenGameStore.canStepOut)

// Total enabled (transitions + subprocesses)
const totalEnabled = computed(() => 
  enabledTransitions.value.length + enabledSubprocesses.value.length
)

// Current net name for subprocess indicator
const currentNetName = computed(() => petriNetStore.net?.name || '')

// Status display
const statusText = computed(() => {
  if (isDeadlock.value) return t('tokenGame.deadlock')
  if (isPlaying.value) return t('tokenGame.playing')
  if (isPaused.value) return t('tokenGame.paused')
  return t('tokenGame.stopped')
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
      <span class="title">{{ $t('tokenGame.title') }}</span>
      <span :class="['status', statusClass]">{{ statusText }}</span>
    </div>

    <!-- Main Controls -->
    <div class="main-controls">
      <!-- Start/Stop -->
      <button
        v-if="!isRunning"
        class="control-btn primary"
        @click="handleStart"
        :title="$t('tokenGame.start')"
      >
        ▶ {{ $t('tokenGame.start') }}
      </button>
      <button
        v-else
        class="control-btn danger"
        @click="handleStop"
        :title="$t('tokenGame.stop')"
      >
        ■ {{ $t('tokenGame.stop') }}
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
            class="control-btn play"
            :disabled="totalEnabled === 0 || isAnimating"
            @click="handlePlay"
            :title="$t('tokenGame.play')"
          >
            ▶
          </button>
          <button
            v-else
            class="control-btn"
            @click="handlePause"
            :title="$t('tokenGame.pause')"
          >
            ⏸
          </button>
          <button
            class="control-btn small"
            :disabled="totalEnabled === 0 || isAnimating"
            @click="handleStepForward"
            :title="$t('tokenGame.step')"
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

    <!-- Subprocess Indicator -->
    <div v-if="isRunning && isInSubprocess" class="subprocess-info">
      <div class="subprocess-badge">
        <span class="subprocess-icon">📂</span>
        <span class="subprocess-depth">{{ $t('subprocess.title') }} ({{ subprocessDepth }})</span>
        <span class="subprocess-name">{{ currentNetName }}</span>
      </div>
      <button
        class="control-btn step-out"
        :disabled="!canStepOutComputed || isAnimating"
        @click="handleStepOut"
        :title="$t('subprocess.goBack')"
      >
        ↩ {{ $t('subprocess.goBack') }}
      </button>
    </div>

    <!-- History Display -->
    <div v-if="isRunning" class="history-info">
      <span>{{ $t('tokenGame.step') }} {{ currentStep }} / {{ totalSteps }}</span>
      <button
        class="control-btn text"
        @click="handleReset"
        :title="$t('tokenGame.reset')"
      >
        ↺ {{ $t('tokenGame.reset') }}
      </button>
    </div>

    <!-- Enabled Transitions & Subprocesses -->
    <div v-if="isRunning && totalEnabled > 0" class="enabled-info">
      <div class="label">{{ $t('tokenGame.enabled') }} ({{ totalEnabled }}):</div>
      <div class="enabled-list">
        <span
          v-for="id in enabledTransitions"
          :key="id"
          class="enabled-badge transition"
        >
          {{ id.substring(0, 8) }}...
        </span>
        <span
          v-for="id in enabledSubprocesses"
          :key="id"
          class="enabled-badge subprocess"
        >
          ⊞ {{ id.substring(0, 6) }}...
        </span>
      </div>
    </div>

    <!-- Settings -->
    <div v-if="isRunning" class="settings">
      <div class="setting-row">
        <label>{{ $t('tokenGame.speed') }}:</label>
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
        <label>{{ $t('tokenGame.conflicts') }}:</label>
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
    <div v-if="isDeadlock && !isInSubprocess" class="deadlock-warning">
      <span class="warning-icon">⚠</span>
      <span>{{ $t('tokenGame.deadlockMessage') }}</span>
    </div>

    <!-- Subprocess Empty/Complete Hint -->
    <div v-if="isDeadlock && isInSubprocess" class="subprocess-hint">
      <span class="hint-icon">💡</span>
      <span v-if="canStepOutComputed">{{ $t('subprocess.canStepOut') }}</span>
      <span v-else>{{ $t('subprocess.noProgress') }}</span>
    </div>

    <!-- History Panel -->
    <HistoryPanel />

    <!-- Token Game Statistics -->
    <TokenGameStats v-if="isRunning" />
    
    <!-- Conflict Dialog -->
    <ConflictDialog />
  </div>
</template>

<style scoped>
.token-game-controls {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
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
  border-bottom: 1px solid var(--color-border);
}

.title {
  font-weight: 600;
  color: var(--color-text);
}

.status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.status-stopped {
  background: var(--color-bg-tertiary);
  color: var(--color-text-muted);
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
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg-secondary);
  color: var(--color-text);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.15s ease;
}

.control-btn:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
  border-color: var(--color-border-light);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-btn.primary {
  background: #22c55e;
  color: white;
  border-color: #22c55e;
}

.control-btn.primary:hover {
  background: #16a34a;
}

.control-btn.play {
  background: #22c55e;
  color: white;
  border-color: #22c55e;
}

.control-btn.play:hover:not(:disabled) {
  background: #16a34a;
}

.control-btn.play:disabled {
  background: #86efac;
  border-color: #86efac;
}

.control-btn.danger {
  background: var(--color-error);
  color: white;
  border-color: var(--color-error);
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
  color: var(--color-primary);
  padding: 4px 8px;
}

.control-btn.text:hover {
  background: var(--color-bg-tertiary);
}

.history-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: var(--color-bg);
  border-radius: 6px;
  margin-bottom: 10px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.enabled-info {
  margin-bottom: 10px;
}

.enabled-info .label {
  font-size: 11px;
  color: var(--color-text-muted);
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
  border-top: 1px solid var(--color-border);
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
  color: var(--color-text-muted);
  min-width: 60px;
}

.speed-slider {
  flex: 1;
  height: 4px;
}

.speed-value {
  font-size: 11px;
  color: var(--color-text-secondary);
  min-width: 35px;
  text-align: right;
}

.btn-group {
  display: flex;
  gap: 2px;
}

.option-btn {
  padding: 4px 8px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  color: var(--color-text);
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
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
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

/* Subprocess Complete/Empty Hint */
.subprocess-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  color: #1e40af;
  font-size: 12px;
  margin-top: 10px;
}

:global(.dark) .subprocess-hint {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.3);
  color: #93c5fd;
}

.hint-icon {
  font-size: 16px;
}

/* Subprocess Indicator */
.subprocess-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  margin-bottom: 10px;
}

:global(.dark) .subprocess-info {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.3);
}

.subprocess-badge {
  display: flex;
  align-items: center;
  gap: 6px;
}

.subprocess-icon {
  font-size: 14px;
}

.subprocess-depth {
  font-size: 11px;
  font-weight: 600;
  color: #1e40af;
}

:global(.dark) .subprocess-depth {
  color: #93c5fd;
}

.subprocess-name {
  font-size: 11px;
  color: #3b82f6;
  font-style: italic;
}

:global(.dark) .subprocess-name {
  color: #60a5fa;
}

.control-btn.step-out {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
  font-size: 11px;
  padding: 4px 10px;
}

.control-btn.step-out:hover:not(:disabled) {
  background: #2563eb;
}

.control-btn.step-out:disabled {
  background: #93c5fd;
  border-color: #93c5fd;
}

/* Enabled badges variants */
.enabled-badge.transition {
  background: #dcfce7;
  color: #166534;
}

.enabled-badge.subprocess {
  background: #dbeafe;
  color: #1e40af;
}

:global(.dark) .enabled-badge.transition {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

:global(.dark) .enabled-badge.subprocess {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}
</style>

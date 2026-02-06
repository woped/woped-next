<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useTokenGameStore } from '@/stores/tokenGame'

const { t } = useI18n()
const tokenGameStore = useTokenGameStore()
const { statistics, isRunning } = storeToRefs(tokenGameStore)

// Format elapsed time
const formattedElapsedTime = computed(() => {
  if (!statistics.value.startTime) return '0:00'
  const elapsed = Date.now() - statistics.value.startTime
  const seconds = Math.floor(elapsed / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
})

// Get top fired transitions
const topTransitions = computed(() => {
  const stats = Object.values(statistics.value.transitionStats)
  return stats.sort((a, b) => b.fireCount - a.fireCount).slice(0, 5)
})

// Has any statistics
const hasStats = computed(() => statistics.value.totalSteps > 0)
</script>

<template>
  <div v-if="isRunning && hasStats" class="token-game-stats">
    <div class="stats-header">
      <span class="label">{{ $t('tokenGame.statistics') }}</span>
      <span class="time">{{ formattedElapsedTime }}</span>
    </div>

    <div class="stats-grid">
      <div class="stat">
        <span class="stat-value">{{ statistics.totalSteps }}</span>
        <span class="stat-label">{{ $t('tokenGame.step') }}</span>
      </div>
      <div class="stat">
        <span class="stat-value">{{ statistics.transitionsFired }}</span>
        <span class="stat-label">{{ $t('tokenGame.transitionsFired') }}</span>
      </div>
      <div class="stat">
        <span class="stat-value">{{ statistics.conflictsEncountered }}</span>
        <span class="stat-label">{{ $t('tokenGame.conflictsEncountered') }}</span>
      </div>
      <div class="stat">
        <span class="stat-value">{{ statistics.deadlocksEncountered }}</span>
        <span class="stat-label">{{ $t('tokenGame.deadlocksEncountered') }}</span>
      </div>
    </div>

    <!-- Top Transitions -->
    <div v-if="topTransitions.length > 0" class="top-transitions">
      <div class="label">{{ $t('tokenGame.topTransitions') }}:</div>
      <div class="transitions-list">
        <div
          v-for="trans in topTransitions"
          :key="trans.transitionId"
          class="transition-stat"
        >
          <span class="trans-name">{{ trans.transitionName }}</span>
          <span class="trans-count">{{ trans.fireCount }}×</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.token-game-stats {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--color-border);
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.stats-header .label {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.stats-header .time {
  font-size: 12px;
  font-family: monospace;
  color: var(--color-text-secondary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-bottom: 8px;
}

.stat {
  text-align: center;
  padding: 6px 4px;
  background: var(--color-bg);
  border-radius: 4px;
  border: 1px solid var(--color-border);
}

.stat-value {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.stat-label {
  display: block;
  font-size: 9px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.top-transitions {
  margin-top: 8px;
}

.top-transitions .label {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}

.transitions-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.transition-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 6px;
  background: var(--color-bg);
  border-radius: 3px;
  font-size: 11px;
}

.trans-name {
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}

.trans-count {
  color: var(--color-primary);
  font-weight: 600;
  font-family: monospace;
}
</style>

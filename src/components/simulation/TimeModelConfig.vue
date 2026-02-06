<script setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useSimulationStore } from '@/stores/simulation'
import { usePetriNetStore } from '@/stores/petriNet'

const { t } = useI18n()
const simulationStore = useSimulationStore()
const petriNetStore = usePetriNetStore()

const { timeModel, config } = storeToRefs(simulationStore)
const { transitions, operators } = storeToRefs(petriNetStore)

// All transitions (regular + operators)
const allTransitions = computed(() => [
  ...transitions.value,
  ...operators.value,
])

// Distribution types
const distributionTypes = [
  { value: 'constant', label: t('simulation.constant') },
  { value: 'exponential', label: t('simulation.exponential') },
  { value: 'normal', label: t('simulation.normal') },
  { value: 'uniform', label: t('simulation.uniform') },
  { value: 'triangular', label: t('simulation.triangular') },
]

// Get distribution for a transition
const getDistribution = (transitionId) => {
  return timeModel.value.transitionTimes[transitionId] || null
}

// Check if transition has custom time
const hasCustomTime = (transitionId) => {
  return transitionId in timeModel.value.transitionTimes
}

// Editing state
const editingId = ref(null)
const editType = ref('exponential')
const editParams = ref([5])

// Start editing a transition
const startEdit = (transitionId) => {
  const existing = getDistribution(transitionId)
  if (existing) {
    editType.value = existing.type
    editParams.value = [...existing.params]
  } else {
    editType.value = timeModel.value.defaultTime.type
    editParams.value = [...timeModel.value.defaultTime.params]
  }
  editingId.value = transitionId
}

// Save edit
const saveEdit = () => {
  if (!editingId.value) return
  simulationStore.setTransitionTime(editingId.value, {
    type: editType.value,
    params: editParams.value,
  })
  editingId.value = null
}

// Cancel edit
const cancelEdit = () => {
  editingId.value = null
}

// Remove custom time
const removeCustomTime = (transitionId) => {
  simulationStore.removeTransitionTime(transitionId)
}

// Update default distribution
const updateDefaultType = (e) => {
  const type = e.target.value
  let params = [5]
  if (type === 'normal') params = [5, 1]
  if (type === 'uniform') params = [1, 10]
  if (type === 'triangular') params = [1, 5, 10]
  simulationStore.setDefaultTime({ type, params })
}

const updateDefaultParam = (index, value) => {
  const params = [...timeModel.value.defaultTime.params]
  params[index] = parseFloat(value) || 0
  simulationStore.setDefaultTime({ ...timeModel.value.defaultTime, params })
}

// Update edit params based on type
const updateEditType = (e) => {
  editType.value = e.target.value
  if (editType.value === 'constant') editParams.value = [5]
  else if (editType.value === 'exponential') editParams.value = [5]
  else if (editType.value === 'normal') editParams.value = [5, 1]
  else if (editType.value === 'uniform') editParams.value = [1, 10]
  else if (editType.value === 'triangular') editParams.value = [1, 5, 10]
}

// Format distribution for display
const formatDistribution = (dist) => {
  if (!dist) return '-'
  switch (dist.type) {
    case 'constant': return `${dist.params[0]}`
    case 'exponential': return `Exp(μ=${dist.params[0]})`
    case 'normal': return `N(μ=${dist.params[0]}, σ=${dist.params[1]})`
    case 'uniform': return `U(${dist.params[0]}, ${dist.params[1]})`
    case 'triangular': return `Tri(${dist.params[0]}, ${dist.params[1]}, ${dist.params[2]})`
    default: return dist.type
  }
}
</script>

<template>
  <div class="time-model-config">
    <!-- Default Distribution -->
    <div class="config-section">
      <h4>{{ $t('simulation.defaultTime') }}</h4>
      <p class="hint">{{ $t('simulation.defaultTimeHint') }}</p>
      
      <div class="default-config">
        <div class="config-row">
          <label>{{ $t('simulation.distribution') }}</label>
          <select :value="timeModel.defaultTime.type" @change="updateDefaultType">
            <option v-for="dt in distributionTypes" :key="dt.value" :value="dt.value">
              {{ dt.label }}
            </option>
          </select>
        </div>

        <div class="params-row">
          <template v-if="timeModel.defaultTime.type === 'constant'">
            <div class="param">
              <label>{{ $t('simulation.value') }}</label>
              <input
                type="number"
                :value="timeModel.defaultTime.params[0]"
                min="0"
                step="0.1"
                @change="e => updateDefaultParam(0, e.target.value)"
              />
            </div>
          </template>

          <template v-else-if="timeModel.defaultTime.type === 'exponential'">
            <div class="param">
              <label>{{ $t('simulation.mean') }}</label>
              <input
                type="number"
                :value="timeModel.defaultTime.params[0]"
                min="0.1"
                step="0.1"
                @change="e => updateDefaultParam(0, e.target.value)"
              />
            </div>
          </template>

          <template v-else-if="timeModel.defaultTime.type === 'normal'">
            <div class="param">
              <label>{{ $t('simulation.mean') }}</label>
              <input
                type="number"
                :value="timeModel.defaultTime.params[0]"
                step="0.1"
                @change="e => updateDefaultParam(0, e.target.value)"
              />
            </div>
            <div class="param">
              <label>{{ $t('simulation.stdDev') }}</label>
              <input
                type="number"
                :value="timeModel.defaultTime.params[1]"
                min="0"
                step="0.1"
                @change="e => updateDefaultParam(1, e.target.value)"
              />
            </div>
          </template>

          <template v-else-if="timeModel.defaultTime.type === 'uniform'">
            <div class="param">
              <label>{{ $t('simulation.min') }}</label>
              <input
                type="number"
                :value="timeModel.defaultTime.params[0]"
                min="0"
                step="0.1"
                @change="e => updateDefaultParam(0, e.target.value)"
              />
            </div>
            <div class="param">
              <label>{{ $t('simulation.max') }}</label>
              <input
                type="number"
                :value="timeModel.defaultTime.params[1]"
                min="0"
                step="0.1"
                @change="e => updateDefaultParam(1, e.target.value)"
              />
            </div>
          </template>

          <template v-else-if="timeModel.defaultTime.type === 'triangular'">
            <div class="param">
              <label>{{ $t('simulation.min') }}</label>
              <input
                type="number"
                :value="timeModel.defaultTime.params[0]"
                min="0"
                step="0.1"
                @change="e => updateDefaultParam(0, e.target.value)"
              />
            </div>
            <div class="param">
              <label>{{ $t('simulation.mode') }}</label>
              <input
                type="number"
                :value="timeModel.defaultTime.params[1]"
                min="0"
                step="0.1"
                @change="e => updateDefaultParam(1, e.target.value)"
              />
            </div>
            <div class="param">
              <label>{{ $t('simulation.max') }}</label>
              <input
                type="number"
                :value="timeModel.defaultTime.params[2]"
                min="0"
                step="0.1"
                @change="e => updateDefaultParam(2, e.target.value)"
              />
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Transition Times -->
    <div class="config-section">
      <h4>{{ $t('simulation.transitionTimes') }}</h4>
      
      <div v-if="allTransitions.length === 0" class="empty-hint">
        {{ $t('simulation.noTransitions') }}
      </div>

      <div v-else class="transitions-list">
        <div
          v-for="transition in allTransitions"
          :key="transition.id"
          class="transition-item"
        >
          <div class="transition-info">
            <span class="transition-name">{{ transition.name || transition.id.substring(0, 8) }}</span>
            <span class="transition-time">
              {{ hasCustomTime(transition.id) 
                ? formatDistribution(getDistribution(transition.id))
                : `(${$t('simulation.default')})` 
              }}
            </span>
          </div>
          <div class="transition-actions">
            <button
              v-if="editingId !== transition.id"
              class="edit-btn"
              @click="startEdit(transition.id)"
            >
              ✎
            </button>
            <button
              v-if="hasCustomTime(transition.id) && editingId !== transition.id"
              class="remove-btn"
              @click="removeCustomTime(transition.id)"
            >
              ✕
            </button>
          </div>

          <!-- Edit form -->
          <div v-if="editingId === transition.id" class="edit-form">
            <div class="edit-row">
              <select v-model="editType" @change="updateEditType">
                <option v-for="dt in distributionTypes" :key="dt.value" :value="dt.value">
                  {{ dt.label }}
                </option>
              </select>
            </div>
            <div class="edit-params">
              <input
                v-for="(param, idx) in editParams"
                :key="idx"
                type="number"
                v-model.number="editParams[idx]"
                min="0"
                step="0.1"
              />
            </div>
            <div class="edit-actions">
              <button class="save-btn" @click="saveEdit">✓</button>
              <button class="cancel-btn" @click="cancelEdit">✕</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.time-model-config {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.config-section h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.hint {
  margin: 0 0 12px 0;
  font-size: 11px;
  color: var(--color-text-muted);
}

.config-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.config-row label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.config-row select,
.config-row input {
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 13px;
}

.params-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.param {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 80px;
}

.param label {
  font-size: 11px;
  color: var(--color-text-muted);
}

.param input {
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 12px;
}

.empty-hint {
  padding: 20px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 12px;
}

.transitions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.transition-item {
  padding: 10px 12px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.transition-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.transition-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.transition-time {
  font-size: 11px;
  color: var(--color-text-muted);
  font-family: monospace;
}

.transition-actions {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.edit-btn,
.remove-btn,
.save-btn,
.cancel-btn {
  padding: 4px 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-size: 12px;
  cursor: pointer;
}

.edit-btn:hover {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.remove-btn:hover {
  background: var(--color-error);
  color: white;
  border-color: var(--color-error);
}

.save-btn {
  background: #22c55e;
  color: white;
  border-color: #22c55e;
}

.cancel-btn:hover {
  background: var(--color-bg-hover);
}

.edit-form {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}

.edit-row {
  margin-bottom: 8px;
}

.edit-row select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 12px;
}

.edit-params {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.edit-params input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 12px;
}

.edit-actions {
  display: flex;
  gap: 4px;
}
</style>

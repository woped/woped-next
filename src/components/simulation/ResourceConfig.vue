<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useSimulationStore } from '@/stores/simulation'
import { usePetriNetStore } from '@/stores/petriNet'
import { useResourceStore } from '@/stores/resources'
import HelpTooltip from '@/components/help/HelpTooltip.vue'

const { t } = useI18n()
const simulationStore = useSimulationStore()
const petriNetStore = usePetriNetStore()
const resourceStore = useResourceStore()
const { resourceModel } = storeToRefs(simulationStore)
const { net } = storeToRefs(petriNetStore)

// New resource form
const newResourceName = ref('')
const newResourceCapacity = ref(1)

// Selected transition for assignment
const selectedTransitionId = ref('')
const selectedResourceId = ref('')
const requiredUnits = ref(1)

// Expanded sections
const showAddResource = ref(false)
const showAssignment = ref(false)

// Get all transitions
const transitions = computed(() => [
  ...net.value.transitions,
  ...net.value.operators,
])

const addResource = () => {
  if (!newResourceName.value.trim()) return

  const resource = resourceStore.addResource({
    name: newResourceName.value.trim(),
    type: 'human',
    capacity: Math.max(1, newResourceCapacity.value),
  })

  simulationStore.addResource({
    id: resource.id,
    name: resource.name,
    capacity: resource.capacity,
  })

  newResourceName.value = ''
  newResourceCapacity.value = 1
  showAddResource.value = false
}

const removeResource = (resourceId) => {
  resourceStore.removeResource(resourceId)
  simulationStore.removeResource(resourceId)
}

const updateCapacity = (resourceId, capacity) => {
  const cap = Math.max(1, parseInt(capacity) || 1)
  resourceStore.updateResource(resourceId, { capacity: cap })
  simulationStore.updateResource(resourceId, { capacity: cap })
}

// Assign resource to transition
const assignResource = () => {
  if (!selectedTransitionId.value || !selectedResourceId.value) return
  
  simulationStore.addTransitionResource(selectedTransitionId.value, {
    resourceId: selectedResourceId.value,
    units: Math.max(1, requiredUnits.value),
  })
  
  selectedResourceId.value = ''
  requiredUnits.value = 1
}

// Remove resource from transition
const removeTransitionResource = (transitionId, resourceId) => {
  simulationStore.removeTransitionResource(transitionId, resourceId)
}

// Get resource name by ID
const getResourceName = (resourceId) => {
  const resource = resourceModel.value.resources.find(r => r.id === resourceId)
  return resource?.name || resourceId
}

// Get transition name by ID
const getTransitionName = (transitionId) => {
  const transition = transitions.value.find(t => t.id === transitionId)
  return transition?.name || transitionId
}

// Get resources not yet assigned to selected transition
const availableResources = computed(() => {
  if (!selectedTransitionId.value) return resourceModel.value.resources
  
  const assigned = resourceModel.value.transitionResources[selectedTransitionId.value] || []
  const assignedIds = new Set(assigned.map(r => r.resourceId))
  
  return resourceModel.value.resources.filter(r => !assignedIds.has(r.id))
})

// Get utilization for a resource from last simulation result
const getUtilization = (resourceId) => {
  const result = simulationStore.result
  if (!result?.statistics?.resourceStats) return null
  const stats = result.statistics.resourceStats.find(r => r.resourceId === resourceId)
  return stats ? stats.utilization : null
}

// Count total assignments
const totalAssignments = computed(() => {
  return Object.values(resourceModel.value.transitionResources)
    .reduce((sum, reqs) => sum + reqs.length, 0)
})
</script>

<template>
  <div class="resource-config">
    <!-- Resources List -->
    <div class="section">
      <div class="section-header">
        <h4>{{ $t('simulation.resources') }}
          <HelpTooltip
            title-key="help.tooltips.resources.title"
            content-key="help.tooltips.resources.content"
            article-id="simulation-resources"
          />
        </h4>
        <button
          class="add-btn"
          @click="showAddResource = !showAddResource"
        >
          {{ showAddResource ? '−' : '+' }}
        </button>
      </div>

      <!-- Add Resource Form -->
      <div v-if="showAddResource" class="add-form">
        <div class="form-row">
          <input
            v-model="newResourceName"
            type="text"
            :placeholder="$t('simulation.resourceName')"
            class="form-input"
          />
          <input
            v-model.number="newResourceCapacity"
            type="number"
            min="1"
            class="form-input capacity-input"
          />
          <button
            class="confirm-btn"
            :disabled="!newResourceName.trim()"
            @click="addResource"
          >
            ✓
          </button>
        </div>
      </div>

      <!-- Resources -->
      <div v-if="resourceModel.resources.length === 0" class="empty-state">
        {{ $t('simulation.noResources') }}
      </div>
      <div v-else class="resources-list">
        <div
          v-for="resource in resourceModel.resources"
          :key="resource.id"
          class="resource-item"
        >
          <div class="resource-row">
            <span class="resource-name">{{ resource.name }}</span>
            <div class="resource-controls">
              <label>{{ $t('simulation.capacity') }}:</label>
              <input
                type="number"
                min="1"
                :value="resource.capacity"
                class="capacity-input"
                @change="updateCapacity(resource.id, $event.target.value)"
              />
              <button
                class="remove-btn"
                @click="removeResource(resource.id)"
                :title="$t('common.delete')"
              >
                ×
              </button>
            </div>
          </div>
          <div v-if="getUtilization(resource.id) !== null" class="resource-utilization">
            <div class="util-bar-bg">
              <div class="util-bar-fill" :style="{ width: Math.round(getUtilization(resource.id) * 100) + '%' }" />
            </div>
            <span class="util-label">{{ Math.round(getUtilization(resource.id) * 100) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Resource Assignments -->
    <div class="section" v-if="resourceModel.resources.length > 0">
      <div class="section-header">
        <h4>{{ $t('simulation.resourceAssignments') }}</h4>
        <span class="count-badge">{{ totalAssignments }}</span>
      </div>

      <!-- Assignment Form -->
      <div class="assignment-form">
        <div class="form-row">
          <select v-model="selectedTransitionId" class="form-select">
            <option value="">{{ $t('simulation.selectTransition') }}</option>
            <option
              v-for="trans in transitions"
              :key="trans.id"
              :value="trans.id"
            >
              {{ trans.name || trans.id.substring(0, 8) }}
            </option>
          </select>
        </div>
        
        <div v-if="selectedTransitionId" class="form-row">
          <select v-model="selectedResourceId" class="form-select">
            <option value="">{{ $t('simulation.selectResource') }}</option>
            <option
              v-for="resource in availableResources"
              :key="resource.id"
              :value="resource.id"
            >
              {{ resource.name }}
            </option>
          </select>
          <input
            v-model.number="requiredUnits"
            type="number"
            min="1"
            class="units-input"
            :title="$t('simulation.requiredUnits')"
          />
          <button
            class="assign-btn"
            :disabled="!selectedResourceId"
            @click="assignResource"
          >
            +
          </button>
        </div>

        <!-- Current assignments for selected transition -->
        <div
          v-if="selectedTransitionId && resourceModel.transitionResources[selectedTransitionId]?.length"
          class="current-assignments"
        >
          <div
            v-for="req in resourceModel.transitionResources[selectedTransitionId]"
            :key="req.resourceId"
            class="assignment-item"
          >
            <span>{{ getResourceName(req.resourceId) }} × {{ req.units }}</span>
            <button
              class="remove-btn small"
              @click="removeTransitionResource(selectedTransitionId, req.resourceId)"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      <!-- All Assignments Overview -->
      <div v-if="totalAssignments > 0" class="assignments-overview">
        <div class="overview-header">{{ $t('simulation.allAssignments') }}</div>
        <div
          v-for="(reqs, transId) in resourceModel.transitionResources"
          :key="transId"
          class="assignment-group"
        >
          <span class="trans-label">{{ getTransitionName(transId) }}:</span>
          <span class="resource-badges">
            <span
              v-for="req in reqs"
              :key="req.resourceId"
              class="resource-badge"
            >
              {{ getResourceName(req.resourceId) }}
              <span v-if="req.units > 1">({{ req.units }})</span>
            </span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.resource-config {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h4 {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
}

.add-btn {
  width: 24px;
  height: 24px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-bg-secondary);
  color: var(--color-text);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}

.add-btn:hover {
  background: var(--color-bg-tertiary);
}

.count-badge {
  background: var(--color-primary);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
}

.add-form,
.assignment-form {
  margin-bottom: 12px;
}

.form-row {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}

.form-input,
.form-select {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-size: 12px;
}

.capacity-input,
.units-input {
  width: 60px;
  flex: none;
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-size: 12px;
  text-align: center;
}

.confirm-btn,
.assign-btn {
  width: 32px;
  flex: none;
  padding: 6px;
  border: 1px solid var(--color-primary);
  border-radius: 4px;
  background: var(--color-primary);
  color: white;
  cursor: pointer;
  font-size: 12px;
}

.confirm-btn:disabled,
.assign-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-state {
  padding: 16px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 12px;
}

.resources-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.resource-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: var(--color-bg-secondary);
  border-radius: 4px;
}

.resource-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.resource-utilization {
  display: flex;
  align-items: center;
  gap: 6px;
}

.util-bar-bg {
  flex: 1;
  height: 6px;
  background: var(--color-bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.util-bar-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.util-label {
  font-size: 10px;
  color: var(--color-text-muted);
  min-width: 30px;
  text-align: right;
}

.resource-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text);
}

.resource-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.resource-controls label {
  font-size: 11px;
  color: var(--color-text-muted);
}

.remove-btn {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}

.remove-btn:hover {
  background: var(--color-error);
  color: white;
}

.remove-btn.small {
  width: 16px;
  height: 16px;
  font-size: 12px;
}

.current-assignments {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--color-border);
}

.assignment-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: var(--color-bg-tertiary);
  border-radius: 4px;
  font-size: 11px;
  color: var(--color-text);
}

.assignments-overview {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}

.overview-header {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}

.assignment-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  font-size: 11px;
}

.trans-label {
  color: var(--color-text);
  font-weight: 500;
}

.resource-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.resource-badge {
  padding: 2px 6px;
  background: var(--color-primary);
  color: white;
  border-radius: 3px;
  font-size: 10px;
}
</style>

<script setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { usePetriNetStore } from '@/stores/petriNet'
import { OperatorType, OPERATOR_INFO } from '@/types/petri-net'
import SubprocessPreview from './SubprocessPreview.vue'
import TriggerEditor from '../triggers/TriggerEditor.vue'
import HelpTooltip from '@/components/help/HelpTooltip.vue'

const { t } = useI18n()
const store = usePetriNetStore()
const { selectedIds, net } = storeToRefs(store)

// Operator types for dropdown
const operatorTypes = Object.values(OperatorType)

// Routing modes for arc dropdown
const routingModes = computed(() => [
  { id: 'direct', label: t('properties.direct') },
  { id: 'orthogonal', label: t('properties.orthogonal') },
  { id: 'bezier', label: t('properties.curved') },
  { id: 'manual', label: t('properties.manual') },
])

// Get the selected element (only show properties for single selection)
const selectedElement = computed(() => {
  if (selectedIds.value.length !== 1) return null
  return store.getElementById(selectedIds.value[0])
})

// Get element type
const elementType = computed(() => {
  if (!selectedElement.value) return null
  return store.getElementType(selectedIds.value[0])
})

// Local form state
const localName = ref('')
const localTokens = ref(0)
const localCapacity = ref(-1)
const localWeight = ref(1)
const localLabel = ref('')
const localOperatorType = ref(OperatorType.AND_SPLIT)
const localRoutingMode = ref('direct')

// Sync local state with selected element
watch(
  selectedElement,
  (element) => {
    if (!element) return

    localName.value = element.name || ''

    if ('tokens' in element) {
      localTokens.value = element.tokens
      localCapacity.value = element.capacity
    }

    if ('weight' in element) {
      localWeight.value = element.weight
    }

    if ('label' in element) {
      localLabel.value = element.label || ''
    }

    if ('operatorType' in element) {
      localOperatorType.value = element.operatorType
    }

    if ('routingMode' in element) {
      localRoutingMode.value = element.routingMode || 'direct'
    }
  },
  { immediate: true }
)

// Update handlers
const updateName = () => {
  if (!selectedElement.value) return
  const id = selectedIds.value[0]
  const type = elementType.value

  if (type === 'place') {
    store.updatePlace(id, { name: localName.value })
  } else if (type === 'transition') {
    store.updateTransition(id, { name: localName.value })
  } else if (type === 'operator') {
    store.updateOperator(id, { name: localName.value })
  } else if (type === 'subprocess') {
    store.updateSubProcess(id, { name: localName.value })
  }
}

const updateOperatorType = () => {
  if (!selectedElement.value || elementType.value !== 'operator') return
  store.updateOperator(selectedIds.value[0], { operatorType: localOperatorType.value })
}

const updateTokens = () => {
  if (!selectedElement.value || elementType.value !== 'place') return
  const tokens = Math.max(0, parseInt(String(localTokens.value)) || 0)
  localTokens.value = tokens
  store.updatePlace(selectedIds.value[0], { tokens })
}

const updateCapacity = () => {
  if (!selectedElement.value || elementType.value !== 'place') return
  const capacity = parseInt(String(localCapacity.value)) || -1
  localCapacity.value = capacity
  store.updatePlace(selectedIds.value[0], { capacity })
}

const updateWeight = () => {
  if (!selectedElement.value || elementType.value !== 'arc') return
  const weight = Math.max(1, parseInt(String(localWeight.value)) || 1)
  localWeight.value = weight
  store.updateArc(selectedIds.value[0], { weight })
}

const updateRoutingMode = () => {
  if (!selectedElement.value || elementType.value !== 'arc') return
  store.updateArc(selectedIds.value[0], { routingMode: localRoutingMode.value })
}

const updateLabel = () => {
  if (!selectedElement.value || elementType.value !== 'transition') return
  store.updateTransition(selectedIds.value[0], { label: localLabel.value })
}

// Get triggers from selected transition
const currentTriggers = computed(() => {
  if (!selectedElement.value || elementType.value !== 'transition') return []
  return selectedElement.value.triggers || []
})

// Update triggers
const updateTriggers = (newTriggers) => {
  if (!selectedElement.value || elementType.value !== 'transition') return
  store.updateTransition(selectedIds.value[0], { triggers: newTriggers })
}

// Net name update
const localNetName = ref('')

watch(
  () => net.value.name,
  (name) => {
    localNetName.value = name
  },
  { immediate: true }
)

const updateNetName = () => {
  net.value.name = localNetName.value
}

// Statistics
const stats = computed(() => ({
  places: net.value.places.length,
  transitions: net.value.transitions.length,
  operators: net.value.operators.length,
  subprocesses: (net.value.subProcesses || []).length,
  arcs: net.value.arcs.length,
}))

// Get operator info for display
const getOperatorLabel = (type) => OPERATOR_INFO[type]?.label || type
</script>

<template>
  <div class="properties-panel">
    <div class="panel-header">
      <h3>{{ $t('properties.title') }}
        <HelpTooltip
          title-key="help.tooltips.properties.title"
          content-key="help.tooltips.properties.content"
          article-id="editor-tools"
        />
      </h3>
    </div>

    <div class="panel-content">
      <!-- No selection: Show net properties -->
      <div v-if="!selectedElement" class="property-section">
        <h4>{{ $t('properties.petriNet') }}</h4>
        
        <div class="property-row">
          <label>{{ $t('properties.name') }}</label>
          <input
            v-model="localNetName"
            type="text"
            @change="updateNetName"
            @blur="updateNetName"
          />
        </div>

        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-value">{{ stats.places }}</span>
            <span class="stat-label">{{ $t('properties.places') }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ stats.transitions }}</span>
            <span class="stat-label">{{ $t('properties.transitions') }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ stats.operators }}</span>
            <span class="stat-label">{{ $t('properties.operators') }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ stats.subprocesses }}</span>
            <span class="stat-label">{{ $t('properties.subprocesses') }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ stats.arcs }}</span>
            <span class="stat-label">{{ $t('properties.arcs') }}</span>
          </div>
        </div>
      </div>

      <!-- Place selected -->
      <div v-else-if="elementType === 'place'" class="property-section">
        <h4>{{ $t('properties.place') }}</h4>

        <div class="property-row">
          <label>{{ $t('properties.name') }}</label>
          <input
            v-model="localName"
            type="text"
            @change="updateName"
            @blur="updateName"
          />
        </div>

        <div class="property-row">
          <label>{{ $t('properties.tokens') }}</label>
          <input
            v-model.number="localTokens"
            type="number"
            min="0"
            @change="updateTokens"
            @blur="updateTokens"
          />
        </div>

        <div class="property-row">
          <label>{{ $t('properties.capacity') }}</label>
          <input
            v-model.number="localCapacity"
            type="number"
            min="-1"
            :placeholder="$t('properties.unlimited')"
            @change="updateCapacity"
            @blur="updateCapacity"
          />
          <span class="hint">{{ $t('properties.unlimitedHint') }}</span>
        </div>
      </div>

      <!-- Transition selected -->
      <div v-else-if="elementType === 'transition'" class="property-section">
        <h4>{{ $t('properties.transition') }}</h4>

        <div class="property-row">
          <label>{{ $t('properties.name') }}</label>
          <input
            v-model="localName"
            type="text"
            @change="updateName"
            @blur="updateName"
          />
        </div>

        <div class="property-row">
          <label>{{ $t('properties.label') }}</label>
          <input
            v-model="localLabel"
            type="text"
            :placeholder="$t('properties.optionalLabel')"
            @change="updateLabel"
            @blur="updateLabel"
          />
        </div>

        <!-- Triggers -->
        <div class="property-row triggers-section">
          <label>{{ $t('triggers.title') }}</label>
          <TriggerEditor
            :triggers="currentTriggers"
            @update:triggers="updateTriggers"
          />
        </div>
      </div>

      <!-- Arc selected -->
      <div v-else-if="elementType === 'arc'" class="property-section">
        <h4>{{ $t('properties.arc') }}</h4>

        <div class="property-row">
          <label>{{ $t('properties.weight') }}</label>
          <input
            v-model.number="localWeight"
            type="number"
            min="1"
            @change="updateWeight"
            @blur="updateWeight"
          />
        </div>

        <div class="property-row">
          <label>{{ $t('properties.routing') }}
            <HelpTooltip
              title-key="help.tooltips.arcRouting.title"
              content-key="help.tooltips.arcRouting.content"
              article-id="arcs-routing"
              placement="left"
            />
          </label>
          <select
            v-model="localRoutingMode"
            @change="updateRoutingMode"
          >
            <option
              v-for="mode in routingModes"
              :key="mode.id"
              :value="mode.id"
            >
              {{ mode.label }}
            </option>
          </select>
          <span v-if="localRoutingMode === 'manual'" class="hint">{{ $t('properties.manualHint') }}</span>
        </div>
      </div>

      <!-- Operator selected -->
      <div v-else-if="elementType === 'operator'" class="property-section">
        <h4>{{ $t('operators.title') }}</h4>

        <div class="property-row">
          <label>{{ $t('properties.name') }}</label>
          <input
            v-model="localName"
            type="text"
            @change="updateName"
            @blur="updateName"
          />
        </div>

        <div class="property-row">
          <label>{{ $t('operators.type') }}</label>
          <select
            v-model="localOperatorType"
            @change="updateOperatorType"
          >
            <option
              v-for="opType in operatorTypes"
              :key="opType"
              :value="opType"
            >
              {{ getOperatorLabel(opType) }}
            </option>
          </select>
        </div>
      </div>

      <!-- Subprocess selected -->
      <div v-else-if="elementType === 'subprocess'" class="property-section">
        <h4>{{ $t('properties.subprocess') }}</h4>

        <div class="property-row">
          <label>{{ $t('properties.name') }}</label>
          <input
            v-model="localName"
            type="text"
            @change="updateName"
            @blur="updateName"
          />
        </div>

        <!-- Subprocess Preview -->
        <div class="property-row preview-row">
          <SubprocessPreview
            :subprocess-id="selectedElement?.subNetId"
            :width="220"
            :height="130"
          />
        </div>

        <div class="property-row">
          <button
            class="open-subprocess-btn"
            @click="store.openSubProcess(selectedIds[0])"
          >
            {{ $t('subprocess.open') }}
          </button>
        </div>
      </div>

      <!-- Multiple selection -->
      <div v-else class="property-section">
        <p class="multi-hint">{{ $t('properties.elementsSelected', { count: selectedIds.length }) }}</p>
      </div>
    </div>

    <!-- Actions -->
    <div v-if="selectedElement" class="panel-actions">
      <button
        class="delete-btn"
        @click="store.deleteSelected()"
      >
        {{ $t('toolbar.delete') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.properties-panel {
  width: 280px;
  background-color: var(--color-bg-secondary);
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.panel-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.property-section h4 {
  margin: 0 0 16px 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.property-row {
  margin-bottom: 16px;
}

.property-row label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.property-row input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  color: var(--color-text);
  background-color: var(--color-bg-secondary);
  box-sizing: border-box;
}

.property-row input:focus,
.property-row select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.property-row select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  color: var(--color-text);
  background-color: var(--color-bg-secondary);
  box-sizing: border-box;
  cursor: pointer;
}

.property-row .hint {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: var(--color-text-muted);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 16px;
}

.stat-item {
  text-align: center;
  padding: 12px 8px;
  background-color: var(--color-bg);
  border-radius: 8px;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
}

.stat-label {
  display: block;
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 4px;
}

.multi-hint {
  color: var(--color-text-muted);
  font-size: 13px;
  text-align: center;
  padding: 20px 0;
}

.panel-actions {
  padding: 16px;
  border-top: 1px solid var(--color-border);
}

.delete-btn {
  width: 100%;
  padding: 10px 16px;
  background-color: var(--color-error);
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.delete-btn:hover {
  background-color: #dc2626;
}

.open-subprocess-btn {
  width: 100%;
  padding: 10px 16px;
  background-color: var(--color-primary);
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.open-subprocess-btn:hover {
  background-color: #2563eb;
}

.preview-row {
  display: flex;
  justify-content: center;
}

.triggers-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}
</style>

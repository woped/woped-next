<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { nanoid } from 'nanoid'
import type { Trigger, TimeTrigger, ResourceTrigger, MessageTrigger } from '@/types/triggers'
import { TRIGGER_ICONS, TRIGGER_COLORS } from '@/types/triggers'

const props = defineProps({
  triggers: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:triggers'])

const { t } = useI18n()

// Active tab
const activeType = ref('time')

// Form state
const timeTrigger = ref({
  delay: 5,
  timeUnit: 'minutes',
})

const resourceTrigger = ref({
  resourceId: '',
  quantity: 1,
})

const messageTrigger = ref({
  messageType: '',
  source: '',
})

// Time units
const timeUnits = [
  { value: 'seconds', label: 'Seconds' },
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
]

// Add trigger
const addTrigger = () => {
  let newTrigger

  if (activeType.value === 'time') {
    newTrigger = {
      id: nanoid(),
      type: 'time',
      delay: timeTrigger.value.delay,
      timeUnit: timeTrigger.value.timeUnit,
    }
  } else if (activeType.value === 'resource') {
    if (!resourceTrigger.value.resourceId) return
    newTrigger = {
      id: nanoid(),
      type: 'resource',
      resourceId: resourceTrigger.value.resourceId,
      quantity: resourceTrigger.value.quantity,
    }
  } else {
    if (!messageTrigger.value.messageType) return
    newTrigger = {
      id: nanoid(),
      type: 'message',
      messageType: messageTrigger.value.messageType,
      source: messageTrigger.value.source,
    }
  }

  const newTriggers = [...props.triggers, newTrigger]
  emit('update:triggers', newTriggers)
}

// Remove trigger
const removeTrigger = (triggerId) => {
  const newTriggers = props.triggers.filter(t => t.id !== triggerId)
  emit('update:triggers', newTriggers)
}

// Format trigger for display
const formatTrigger = (trigger) => {
  if (trigger.type === 'time') {
    return `${trigger.delay} ${trigger.timeUnit}`
  } else if (trigger.type === 'resource') {
    return `×${trigger.quantity}`
  } else {
    return trigger.messageType
  }
}
</script>

<template>
  <div class="trigger-editor">
    <!-- Existing Triggers -->
    <div v-if="triggers.length > 0" class="triggers-list">
      <div
        v-for="trigger in triggers"
        :key="trigger.id"
        class="trigger-item"
      >
        <span class="trigger-icon" :style="{ background: TRIGGER_COLORS[trigger.type] }">
          {{ TRIGGER_ICONS[trigger.type] }}
        </span>
        <span class="trigger-info">
          <span class="trigger-type">{{ $t(`triggers.${trigger.type}`) }}</span>
          <span class="trigger-value">{{ formatTrigger(trigger) }}</span>
        </span>
        <button class="remove-btn" @click="removeTrigger(trigger.id)">×</button>
      </div>
    </div>

    <!-- Add Trigger Form -->
    <div class="add-trigger">
      <div class="trigger-tabs">
        <button
          :class="['tab-btn', { active: activeType === 'time' }]"
          @click="activeType = 'time'"
        >
          {{ TRIGGER_ICONS.time }} {{ $t('triggers.time') }}
        </button>
        <button
          :class="['tab-btn', { active: activeType === 'resource' }]"
          @click="activeType = 'resource'"
        >
          {{ TRIGGER_ICONS.resource }} {{ $t('triggers.resource') }}
        </button>
        <button
          :class="['tab-btn', { active: activeType === 'message' }]"
          @click="activeType = 'message'"
        >
          {{ TRIGGER_ICONS.message }} {{ $t('triggers.message') }}
        </button>
      </div>

      <!-- Time Trigger Form -->
      <div v-if="activeType === 'time'" class="trigger-form">
        <div class="form-row">
          <input
            v-model.number="timeTrigger.delay"
            type="number"
            min="0"
            class="delay-input"
          />
          <select v-model="timeTrigger.timeUnit" class="unit-select">
            <option v-for="unit in timeUnits" :key="unit.value" :value="unit.value">
              {{ unit.label }}
            </option>
          </select>
          <button class="add-btn" @click="addTrigger">+</button>
        </div>
      </div>

      <!-- Resource Trigger Form -->
      <div v-if="activeType === 'resource'" class="trigger-form">
        <div class="form-row">
          <input
            v-model="resourceTrigger.resourceId"
            type="text"
            :placeholder="$t('triggers.resourceName')"
            class="resource-input"
          />
          <input
            v-model.number="resourceTrigger.quantity"
            type="number"
            min="1"
            class="quantity-input"
          />
          <button
            class="add-btn"
            :disabled="!resourceTrigger.resourceId"
            @click="addTrigger"
          >
            +
          </button>
        </div>
      </div>

      <!-- Message Trigger Form -->
      <div v-if="activeType === 'message'" class="trigger-form">
        <div class="form-row">
          <input
            v-model="messageTrigger.messageType"
            type="text"
            :placeholder="$t('triggers.messageType')"
            class="message-input"
          />
          <button
            class="add-btn"
            :disabled="!messageTrigger.messageType"
            @click="addTrigger"
          >
            +
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.trigger-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.triggers-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.trigger-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.trigger-icon {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}

.trigger-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.trigger-type {
  font-size: 10px;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.trigger-value {
  font-size: 12px;
  color: var(--color-text);
  font-weight: 500;
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
}

.remove-btn:hover {
  background: var(--color-error);
  color: white;
}

.add-trigger {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  overflow: hidden;
}

.trigger-tabs {
  display: flex;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
}

.tab-btn {
  flex: 1;
  padding: 8px;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}

.tab-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text);
}

.tab-btn.active {
  background: var(--color-bg);
  color: var(--color-text);
  font-weight: 500;
}

.trigger-form {
  padding: 12px;
}

.form-row {
  display: flex;
  gap: 6px;
}

.delay-input,
.quantity-input {
  width: 60px;
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-size: 12px;
  text-align: center;
}

.unit-select,
.resource-input,
.message-input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-size: 12px;
}

.add-btn {
  width: 32px;
  padding: 6px;
  border: 1px solid var(--color-primary);
  border-radius: 4px;
  background: var(--color-primary);
  color: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
}

.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

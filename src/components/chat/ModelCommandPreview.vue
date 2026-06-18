<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  commands: { type: Array, required: true },
})

const emit = defineEmits(['execute'])

const SKIPPED_ERRORS = new Set([
  'chat.commandErrors.skippedForImport',
  'chat.commandErrors.duplicateImportSkipped',
])

function isSkipped(cmd) {
  return cmd.error && SKIPPED_ERRORS.has(cmd.error)
}

function isFailed(cmd) {
  return cmd.error && !SKIPPED_ERRORS.has(cmd.error)
}

const commandDescriptions = computed(() => {
  return props.commands.map((cmd) => {
    const params = cmd.params || {}
    switch (cmd.type) {
      case 'add_place':
        return { icon: '⬤', text: t('chat.commands.addPlace', { name: params.name || '?' }) }
      case 'add_transition':
        return { icon: '▬', text: t('chat.commands.addTransition', { name: params.name || '?' }) }
      case 'add_arc':
        return { icon: '→', text: t('chat.commands.addArc') }
      case 'remove_element':
        return { icon: '✕', text: t('chat.commands.removeElement', { id: params.element_id || '?' }) }
      case 'rename_element':
        return { icon: '✎', text: t('chat.commands.renameElement', { name: params.name || '?' }) }
      case 'set_tokens':
        return { icon: '●', text: t('chat.commands.setTokens', { tokens: params.tokens ?? 0 }) }
      case 'import_net':
        return { icon: '📥', text: t('chat.commands.importNet') }
      default:
        return { icon: '?', text: cmd.type }
    }
  })
})

const hasPending = computed(() => props.commands.some((cmd) => !cmd.executed && !isSkipped(cmd)))

const hasFailures = computed(() => props.commands.some((cmd) => isFailed(cmd)))

const applyComplete = computed(() =>
  props.commands.every((cmd) => cmd.executed || isSkipped(cmd)),
)
</script>

<template>
  <div class="command-preview">
    <div class="command-header">
      <span class="command-title">{{ t('chat.modelChanges') }}</span>
    </div>
    <ul class="command-list">
      <li
        v-for="(desc, i) in commandDescriptions"
        :key="i"
        :class="[
          'command-item',
          {
            executed: commands[i].executed,
            failed: isFailed(commands[i]),
            skipped: isSkipped(commands[i]),
          },
        ]"
      >
        <span class="command-icon">{{ desc.icon }}</span>
        <span class="command-text">
          {{ desc.text }}
          <span v-if="commands[i].error" class="command-error">
            — {{ t(commands[i].error) }}
          </span>
        </span>
        <span v-if="commands[i].executed" class="command-done">✓</span>
        <span v-else-if="isFailed(commands[i])" class="command-failed">✕</span>
      </li>
    </ul>
    <button
      v-if="hasPending"
      class="execute-btn"
      @click="emit('execute', commands)"
    >
      {{ t('chat.applyChanges') }}
    </button>
    <span v-else-if="applyComplete && !hasFailures" class="applied-badge">
      {{ t('chat.changesApplied') }}
    </span>
    <span v-else-if="hasFailures" class="failed-badge">
      {{ t('chat.changesPartiallyFailed') }}
    </span>
  </div>
</template>

<style scoped>
.command-preview {
  margin: 6px 0;
  padding: 8px 12px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--color-primary) 6%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
}

.command-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.command-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.command-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.command-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-secondary);
  padding: 3px 0;
}

.command-item.executed {
  opacity: 0.6;
  text-decoration: line-through;
}

.command-item.skipped {
  opacity: 0.55;
  font-style: italic;
}

.command-item.failed {
  color: var(--color-error);
}

.command-icon {
  flex-shrink: 0;
  width: 16px;
  text-align: center;
  font-size: 11px;
}

.command-text {
  flex: 1;
}

.command-error {
  display: block;
  font-size: 11px;
  margin-top: 2px;
  text-decoration: none;
}

.command-done {
  color: var(--color-success);
  font-weight: 600;
}

.command-failed {
  color: var(--color-error);
  font-weight: 600;
}

.execute-btn {
  margin-top: 8px;
  width: 100%;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: var(--color-primary);
  color: white;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.execute-btn:hover {
  background: var(--color-primary-hover);
}

.applied-badge {
  display: block;
  margin-top: 6px;
  font-size: 11px;
  color: var(--color-success);
  font-weight: 500;
}

.failed-badge {
  display: block;
  margin-top: 6px;
  font-size: 11px;
  color: var(--color-error);
  font-weight: 500;
}
</style>

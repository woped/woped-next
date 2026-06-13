<script setup>
import { ref, onMounted } from 'vue'
import { watchDebounced } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { useChatStore } from '@/stores/chat'
import { LLMClient } from '@/services/llmClient'
import { discoverModels, FALLBACK_MODELS } from '@/services/modelDiscovery'

const { t } = useI18n()
const chatStore = useChatStore()

const apiKey = ref('')
const selectedModel = ref('gpt-4o')
const isValidating = ref(false)
const validationError = ref('')

const availableModels = ref([...FALLBACK_MODELS])
const isDiscovering = ref(false)
const usedFallback = ref(false)
// Monotonic token so only the latest discovery result is applied.
let discoveryToken = 0

async function discover(key) {
  const trimmed = key.trim()
  if (!trimmed) {
    availableModels.value = [...FALLBACK_MODELS]
    usedFallback.value = false
    isDiscovering.value = false
    return
  }

  const token = ++discoveryToken
  isDiscovering.value = true
  usedFallback.value = false

  try {
    const models = await discoverModels(trimmed)
    if (token !== discoveryToken) return
    availableModels.value = models
    usedFallback.value =
      models.length === FALLBACK_MODELS.length &&
      models.every((m, i) => m.id === FALLBACK_MODELS[i].id)
    ensureSelectedModelValid()
  } finally {
    if (token === discoveryToken) isDiscovering.value = false
  }
}

function ensureSelectedModelValid() {
  if (!availableModels.value.some((m) => m.id === selectedModel.value)) {
    selectedModel.value = availableModels.value[0]?.id ?? selectedModel.value
  }
}

watchDebounced(
  apiKey,
  (key) => {
    discover(key)
  },
  { debounce: 500 },
)

onMounted(() => {
  apiKey.value = chatStore.llmConfig.apiKey
  selectedModel.value = chatStore.llmConfig.model
  if (apiKey.value.trim()) {
    discover(apiKey.value)
  }
})

async function handleSave() {
  if (!apiKey.value.trim()) {
    validationError.value = t('chat.apiKey.required')
    return
  }

  isValidating.value = true
  validationError.value = ''

  try {
    const valid = await LLMClient.validateApiKey(apiKey.value.trim())
    if (!valid) {
      validationError.value = t('chat.apiKey.invalid')
      return
    }

    chatStore.saveConfig({
      apiKey: apiKey.value.trim(),
      model: selectedModel.value,
    })
    chatStore.closeApiKeyDialog()
  } catch {
    validationError.value = t('chat.apiKey.validationFailed')
  } finally {
    isValidating.value = false
  }
}

function handleCancel() {
  chatStore.closeApiKeyDialog()
}
</script>

<template>
  <div class="dialog-overlay" @click.self="handleCancel">
    <div class="dialog">
      <h3 class="dialog-title">{{ t('chat.apiKey.title') }}</h3>
      <p class="dialog-description">{{ t('chat.apiKey.description') }}</p>

      <div class="form-group">
        <label class="form-label">{{ t('chat.apiKey.label') }}</label>
        <input
          v-model="apiKey"
          type="password"
          class="form-input"
          placeholder="sk-..."
          @keydown.enter="handleSave"
        />
      </div>

      <div class="form-group">
        <label class="form-label">{{ t('chat.apiKey.model') }}</label>
        <select v-model="selectedModel" class="form-select" :disabled="isDiscovering">
          <option v-for="model in availableModels" :key="model.id" :value="model.id">
            {{ model.name }}
          </option>
        </select>
        <p v-if="isDiscovering" class="model-hint">{{ t('chat.apiKey.discovering') }}</p>
        <p v-else-if="usedFallback" class="model-hint">{{ t('chat.apiKey.discoveryFailed') }}</p>
      </div>

      <p v-if="validationError" class="error-text">{{ validationError }}</p>

      <p class="privacy-note">{{ t('chat.apiKey.privacy') }}</p>

      <div class="dialog-actions">
        <button class="btn btn-secondary" @click="handleCancel">
          {{ t('common.cancel') }}
        </button>
        <button class="btn btn-primary" :disabled="isValidating" @click="handleSave">
          <span v-if="isValidating">{{ t('chat.apiKey.validating') }}</span>
          <span v-else>{{ t('common.save') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 24px;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 8px;
}

.dialog-description {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0 0 20px;
  line-height: 1.5;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}

.form-input,
.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus {
  border-color: var(--color-primary);
}

.model-hint {
  font-size: 11px;
  color: var(--color-text-muted);
  margin: 6px 0 0;
}

.error-text {
  font-size: 12px;
  color: var(--color-error);
  margin: 0 0 12px;
}

.privacy-note {
  font-size: 11px;
  color: var(--color-text-muted);
  margin: 0 0 20px;
  line-height: 1.5;
  padding: 8px 12px;
  background: var(--color-bg-tertiary);
  border-radius: 6px;
}

.dialog-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-secondary {
  background: var(--color-bg-tertiary);
  color: var(--color-text);
}

.btn-secondary:hover {
  background: var(--color-border);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

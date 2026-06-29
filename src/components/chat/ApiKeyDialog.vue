<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChatStore } from '@/stores/chat'
import { LLMClient } from '@/services/llmClient'
import { sortModelsByRecency, getFallbackModels, VISIBLE_MODELS_COUNT } from '@/services/modelOrdering'
import { PROVIDER_OPTIONS } from '@/types/chat'
import type { LLMModelOption, LLMProvider } from '@/types/chat'

const { t } = useI18n()
const chatStore = useChatStore()

const apiKey = ref('')
const selectedProvider = ref<LLMProvider>('openai')
const selectedModel = ref('')
const availableModels = ref<LLMModelOption[]>([])
const showAllModels = ref(false)
const isValidating = ref(false)
const isLoadingModels = ref(false)
const validationError = ref('')
const modelsError = ref('')
const usedFallback = ref(false)

// Show the newest few models by default; "show more" reveals the rest.
const displayedModels = computed(() =>
  showAllModels.value
    ? availableModels.value
    : availableModels.value.slice(0, VISIBLE_MODELS_COUNT),
)
const hasMoreModels = computed(() => availableModels.value.length > VISIBLE_MODELS_COUNT)

const isInitializing = ref(false)

function ensureSelectedModelInList() {
  const models = availableModels.value
  if (models.length === 0) {
    selectedModel.value = ''
    return
  }

  const index = models.findIndex((model) => model.id === selectedModel.value)
  if (index === -1) {
    selectedModel.value = models[0].id
  } else if (index >= VISIBLE_MODELS_COUNT) {
    // Keep a previously selected (older) model visible.
    showAllModels.value = true
  }
}

async function loadAvailableModels() {
  const key = apiKey.value.trim()
  if (!key) {
    availableModels.value = []
    selectedModel.value = ''
    modelsError.value = ''
    usedFallback.value = false
    return
  }

  isLoadingModels.value = true
  modelsError.value = ''
  usedFallback.value = false
  showAllModels.value = false
  availableModels.value = []

  try {
    const models = await LLMClient.listModels(key, selectedProvider.value)
    availableModels.value = sortModelsByRecency(models)
    if (availableModels.value.length === 0) {
      modelsError.value = t('chat.apiKey.modelsEmpty')
    }
    ensureSelectedModelInList()
  } catch {
    // Fall back to a static current list so the dropdown is never empty.
    availableModels.value = sortModelsByRecency(getFallbackModels(selectedProvider.value))
    usedFallback.value = availableModels.value.length > 0
    modelsError.value = usedFallback.value ? '' : t('chat.apiKey.modelsLoadFailed')
    ensureSelectedModelInList()
  } finally {
    isLoadingModels.value = false
  }
}

onMounted(async () => {
  isInitializing.value = true
  apiKey.value = chatStore.llmConfig.apiKey
  selectedProvider.value = chatStore.llmConfig.provider
  selectedModel.value = chatStore.llmConfig.model
  try {
    await loadAvailableModels()
  } finally {
    isInitializing.value = false
  }
})

watch(selectedProvider, async () => {
  if (isInitializing.value) return
  availableModels.value = []
  selectedModel.value = ''
  modelsError.value = ''
  showAllModels.value = false
  await loadAvailableModels()
})

async function handleSave() {
  if (!apiKey.value.trim()) {
    validationError.value = t('chat.apiKey.required')
    return
  }

  if (!selectedModel.value) {
    validationError.value = t('chat.apiKey.modelRequired')
    return
  }

  isValidating.value = true
  validationError.value = ''

  try {
    if (availableModels.value.length === 0) {
      await loadAvailableModels()
    }

    const valid = await LLMClient.validateApiKey(apiKey.value.trim(), selectedProvider.value)
    if (!valid) {
      validationError.value = t('chat.apiKey.invalid')
      return
    }

    const modelInList = availableModels.value.some((model) => model.id === selectedModel.value)
    if (!modelInList) {
      validationError.value = t('chat.apiKey.modelUnavailable')
      return
    }

    chatStore.saveConfig({
      provider: selectedProvider.value,
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
        <label class="form-label">{{ t('chat.apiKey.provider') }}</label>
        <select v-model="selectedProvider" class="form-select">
          <option v-for="provider in PROVIDER_OPTIONS" :key="provider.id" :value="provider.id">
            {{ provider.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">{{ t('chat.apiKey.label') }}</label>
        <input
          v-model="apiKey"
          type="password"
          class="form-input"
          :placeholder="selectedProvider === 'gemini' ? 'AIza...' : 'sk-...'"
          @keydown.enter="handleSave"
        />
      </div>

      <div class="form-group">
        <div class="model-header">
          <label class="form-label">{{ t('chat.apiKey.model') }}</label>
          <button
            type="button"
            class="refresh-btn"
            :disabled="isLoadingModels || !apiKey.trim()"
            @click="loadAvailableModels"
          >
            {{ isLoadingModels ? t('chat.apiKey.loadingModels') : t('chat.apiKey.refreshModels') }}
          </button>
        </div>
        <select
          v-model="selectedModel"
          class="form-select"
          :disabled="isLoadingModels || availableModels.length === 0"
        >
          <option v-if="availableModels.length === 0" disabled value="">
            {{
              !apiKey.trim()
                ? t('chat.apiKey.enterKeyForModels')
                : isLoadingModels
                  ? t('chat.apiKey.loadingModels')
                  : t('chat.apiKey.noModels')
            }}
          </option>
          <option v-for="model in displayedModels" :key="model.id" :value="model.id">
            {{ model.name }}
          </option>
        </select>
        <button
          v-if="hasMoreModels && !showAllModels"
          type="button"
          class="show-more-btn"
          @click="showAllModels = true"
        >
          {{ t('chat.apiKey.showMore') }}
        </button>
        <p v-if="modelsError" class="hint-text">{{ modelsError }}</p>
        <p v-else-if="isLoadingModels" class="hint-text">{{ t('chat.apiKey.loadingModels') }}</p>
        <p v-else-if="usedFallback" class="hint-text">{{ t('chat.apiKey.modelsFallback') }}</p>
        <p v-else-if="!apiKey.trim()" class="hint-text">{{ t('chat.apiKey.enterKeyForModels') }}</p>
      </div>

      <p v-if="validationError" class="error-text">{{ validationError }}</p>

      <p class="privacy-note">{{ t('chat.apiKey.privacy') }}</p>

      <div class="dialog-actions">
        <button class="btn btn-secondary" @click="handleCancel">
          {{ t('common.cancel') }}
        </button>
        <button
          class="btn btn-primary"
          :disabled="isValidating || isLoadingModels || !selectedModel"
          @click="handleSave"
        >
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

.model-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.form-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}

.model-header .form-label {
  margin-bottom: 0;
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

.refresh-btn {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg);
  color: var(--color-text-secondary);
  font-size: 11px;
  padding: 4px 8px;
  cursor: pointer;
}

.refresh-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.show-more-btn {
  margin-top: 6px;
  padding: 0;
  border: none;
  background: none;
  color: var(--color-primary);
  font-size: 12px;
  cursor: pointer;
}

.show-more-btn:hover {
  text-decoration: underline;
}

.hint-text {
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

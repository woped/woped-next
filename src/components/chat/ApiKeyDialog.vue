<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChatStore } from '@/stores/chat'
import { LLMClient } from '@/services/llmClient'
import { AVAILABLE_MODELS_BY_PROVIDER, PROVIDER_OPTIONS } from '@/types/chat'
import type { LLMProvider } from '@/types/chat'

const { t } = useI18n()
const chatStore = useChatStore()

const apiKey = ref('')
const selectedProvider = ref<LLMProvider>('openai')
const selectedModel = ref('gpt-4o')
const isValidating = ref(false)
const validationError = ref('')

const availableModels = computed(() => AVAILABLE_MODELS_BY_PROVIDER[selectedProvider.value])

function getDefaultModel(provider: LLMProvider): string {
  return AVAILABLE_MODELS_BY_PROVIDER[provider][0]?.id || 'gpt-4o'
}

onMounted(() => {
  apiKey.value = chatStore.llmConfig.apiKey
  selectedProvider.value = chatStore.llmConfig.provider
  selectedModel.value = chatStore.llmConfig.model
})

watch(selectedProvider, () => {
  const modelExists = availableModels.value.some((model) => model.id === selectedModel.value)
  if (!modelExists) {
    selectedModel.value = getDefaultModel(selectedProvider.value)
  }
}, { immediate: true })

async function handleSave() {
  if (!apiKey.value.trim()) {
    validationError.value = t('chat.apiKey.required')
    return
  }

  isValidating.value = true
  validationError.value = ''

  try {
    const valid = await LLMClient.validateApiKey(apiKey.value.trim(), selectedProvider.value)
    if (!valid) {
      validationError.value = t('chat.apiKey.invalid')
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
        <label class="form-label">{{ t('chat.apiKey.model') }}</label>
        <select v-model="selectedModel" class="form-select">
          <option v-for="model in availableModels" :key="model.id" :value="model.id">
            {{ model.name }}
          </option>
        </select>
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

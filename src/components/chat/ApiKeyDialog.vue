<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChatStore } from '@/stores/chat'
import { LLMClient } from '@/services/llmClient'
import { AVAILABLE_MODELS_BY_PROVIDER } from '@/types/chat'

const { t } = useI18n()
const chatStore = useChatStore()

const selectedProvider = ref('openai')
const apiKey = ref('')
const selectedModel = ref('gpt-4o')
const isValidating = ref(false)
const validationError = ref('')

const isMock = computed(() => selectedProvider.value === 'mock')
const availableModels = computed(() => AVAILABLE_MODELS_BY_PROVIDER[selectedProvider.value] ?? [])

onMounted(() => {
  selectedProvider.value = chatStore.llmConfig.provider ?? 'openai'
  apiKey.value = chatStore.llmConfig.apiKey
  selectedModel.value = chatStore.llmConfig.model
})

function onProviderChange() {
  selectedModel.value = availableModels.value[0]?.id ?? ''
  apiKey.value = ''
  validationError.value = ''
}

async function handleSave() {
  if (isMock.value) {
    chatStore.saveConfig({ provider: 'mock', apiKey: '', model: 'mock' })
    chatStore.closeApiKeyDialog()
    return
  }

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
        <label class="form-label">Provider</label>
        <select v-model="selectedProvider" class="form-select" @change="onProviderChange">
          <option value="openai">OpenAI</option>
          <option value="gemini">Google Gemini</option>
          <option value="mock">Mock (Demo – no key required)</option>
        </select>
      </div>

      <div v-if="!isMock" class="form-group">
        <label class="form-label">{{ t('chat.apiKey.label') }}</label>
        <input
          v-model="apiKey"
          type="password"
          class="form-input"
          :placeholder="selectedProvider === 'gemini' ? 'AIza...' : 'sk-...'"
          @keydown.enter="handleSave"
        />
      </div>

      <div v-if="!isMock" class="form-group">
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

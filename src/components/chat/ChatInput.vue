<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['send'])

const inputText = ref('')
const textareaRef = ref(null)

function handleSend() {
  if (!inputText.value.trim() || props.disabled) return
  emit('send', inputText.value.trim())
  inputText.value = ''
  adjustHeight()
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function adjustHeight() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}
</script>

<template>
  <div class="chat-input-container">
    <textarea
      ref="textareaRef"
      v-model="inputText"
      :placeholder="t('chat.inputPlaceholder')"
      :disabled="disabled"
      class="chat-textarea"
      rows="1"
      @keydown="handleKeydown"
      @input="adjustHeight"
    />
    <button
      class="send-btn"
      :disabled="!inputText.trim() || disabled"
      :title="t('chat.send')"
      @click="handleSend"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.chat-input-container {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}

.chat-textarea {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 13px;
  line-height: 1.5;
  resize: none;
  outline: none;
  font-family: inherit;
  min-height: 36px;
  max-height: 120px;
  transition: border-color 0.15s;
}

.chat-textarea:focus {
  border-color: var(--color-primary);
}

.chat-textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.chat-textarea::placeholder {
  color: var(--color-text-muted);
}

.send-btn {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: var(--color-primary);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.send-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>

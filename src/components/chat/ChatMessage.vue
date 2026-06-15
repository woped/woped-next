<script setup>
import { computed } from 'vue'
import MarkdownRenderer from './MarkdownRenderer.vue'

const props = defineProps({
  message: { type: Object, required: true },
})

const isUser = computed(() => props.message.role === 'user')
const timeFormatted = computed(() => {
  const date = new Date(props.message.timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})
</script>

<template>
  <div :class="['chat-message', { 'is-user': isUser, 'is-assistant': !isUser }]">
    <div class="message-avatar">
      <span v-if="isUser" class="avatar-icon">👤</span>
      <span v-else class="avatar-icon">🤖</span>
    </div>
    <div class="message-body">
      <div v-if="message.isLoading" class="message-loading">
        <span class="loading-dot"></span>
        <span class="loading-dot"></span>
        <span class="loading-dot"></span>
      </div>
      <div v-else-if="message.error" class="message-error">
        <span class="error-icon">⚠️</span>
        <span>{{ message.error }}</span>
      </div>
      <div v-else class="message-content">
        <MarkdownRenderer :source="message.content" />
      </div>
      <div class="message-time">{{ timeFormatted }}</div>
    </div>
  </div>
</template>

<style scoped>
.chat-message {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  align-items: flex-start;
}

.chat-message.is-user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-tertiary);
  font-size: 14px;
}

.message-body {
  max-width: 80%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.is-user .message-body {
  align-items: flex-end;
}

.message-content {
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
}

.is-user .message-content {
  background: var(--color-primary);
  color: white;
  border-bottom-right-radius: 4px;
}

.is-assistant .message-content {
  background: var(--color-bg-tertiary);
  color: var(--color-text);
  border-bottom-left-radius: 4px;
}

.message-error {
  padding: 8px 12px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--color-error) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-error) 30%, transparent);
  color: var(--color-error);
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.error-icon {
  font-size: 14px;
}

.message-loading {
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--color-bg-tertiary);
  display: flex;
  gap: 4px;
  align-items: center;
  border-bottom-left-radius: 4px;
}

.loading-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-text-muted);
  animation: bounce 1.4s infinite ease-in-out both;
}

.loading-dot:nth-child(1) { animation-delay: -0.32s; }
.loading-dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.message-time {
  font-size: 10px;
  color: var(--color-text-muted);
  padding: 0 4px;
}
</style>

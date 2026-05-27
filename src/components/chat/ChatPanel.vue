<script setup>
import { ref, nextTick, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useChatStore } from '@/stores/chat'
import ChatMessage from './ChatMessage.vue'
import ChatInput from './ChatInput.vue'
import ModelCommandPreview from './ModelCommandPreview.vue'
import ApiKeyDialog from './ApiKeyDialog.vue'

const { t } = useI18n()
const chatStore = useChatStore()
const { messages, isLoading, isConfigured, showApiKeyDialog } = storeToRefs(chatStore)

const messagesContainer = ref(null)

onMounted(() => {
  chatStore.loadConfig()
})

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

watch(messages, scrollToBottom, { deep: true })

function handleSend(text) {
  chatStore.sendMessage(text)
  scrollToBottom()
}

function handleExecuteCommands(commands) {
  chatStore.executeAllCommands(commands)
}

function handleOpenSettings() {
  chatStore.openApiKeyDialog()
}

function handleClear() {
  chatStore.clearMessages()
}

function handleAbort() {
  chatStore.abortCurrentRequest()
}
</script>

<template>
  <div class="chat-panel">
    <!-- Header -->
    <div class="chat-header">
      <span class="chat-title">{{ t('chat.title') }}</span>
      <div class="chat-actions">
        <button
          class="header-btn"
          :title="t('chat.clearHistory')"
          :disabled="messages.length === 0"
          @click="handleClear"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3,6 5,6 21,6" />
            <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6" />
          </svg>
        </button>
        <button
          class="header-btn"
          :title="t('chat.settings')"
          @click="handleOpenSettings"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68 1.65 1.65 0 0 0 9 3.17V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Setup prompt when no API key -->
    <div v-if="!isConfigured" class="setup-prompt">
      <div class="setup-icon">🔑</div>
      <p class="setup-text">{{ t('chat.setupRequired') }}</p>
      <button class="setup-btn" @click="handleOpenSettings">
        {{ t('chat.setupButton') }}
      </button>
    </div>

    <!-- Messages -->
    <template v-else>
      <div ref="messagesContainer" class="messages-container">
        <div v-if="messages.length === 0" class="empty-state">
          <div class="empty-icon">💬</div>
          <p class="empty-text">{{ t('chat.emptyState') }}</p>
          <div class="suggestions">
            <button class="suggestion-btn" @click="handleSend(t('chat.suggestions.describe'))">
              {{ t('chat.suggestions.describe') }}
            </button>
            <button class="suggestion-btn" @click="handleSend(t('chat.suggestions.analyze'))">
              {{ t('chat.suggestions.analyze') }}
            </button>
            <button class="suggestion-btn" @click="handleSend(t('chat.suggestions.help'))">
              {{ t('chat.suggestions.help') }}
            </button>
          </div>
        </div>
        <template v-else>
          <template v-for="msg in messages" :key="msg.id">
            <ChatMessage :message="msg" />
            <ModelCommandPreview
              v-if="msg.commands && msg.commands.length > 0"
              :commands="msg.commands"
              @execute="handleExecuteCommands"
            />
          </template>
        </template>
      </div>
      <div v-if="isLoading" class="abort-container">
        <button class="abort-btn" @click="handleAbort">
          {{ t('chat.stop') }}
        </button>
      </div>
      <ChatInput :disabled="isLoading" @send="handleSend" />
    </template>

    <!-- API Key Dialog -->
    <ApiKeyDialog v-if="showApiKeyDialog" />
  </div>
</template>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
  flex-shrink: 0;
}

.chat-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.chat-actions {
  display: flex;
  gap: 4px;
}

.header-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.header-btn:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
  color: var(--color-text);
}

.header-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Setup prompt */
.setup-prompt {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
  gap: 12px;
}

.setup-icon {
  font-size: 32px;
}

.setup-text {
  font-size: 13px;
  color: var(--color-text-muted);
  line-height: 1.5;
  margin: 0;
}

.setup-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: var(--color-primary);
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.setup-btn:hover {
  background: var(--color-primary-hover);
}

/* Messages */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

/* Abort button */
.abort-container {
  display: flex;
  justify-content: center;
  padding: 4px 12px;
}

.abort-btn {
  padding: 4px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg);
  color: var(--color-text-muted);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}

.abort-btn:hover {
  border-color: var(--color-error);
  color: var(--color-error);
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
  min-height: 200px;
}

.empty-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.empty-text {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0 0 16px;
}

.suggestions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  max-width: 250px;
}

.suggestion-btn {
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg);
  color: var(--color-text-secondary);
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
}

.suggestion-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 5%, transparent);
}
</style>

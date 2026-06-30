import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'
import { ChatOrchestrator } from '@/services/chatOrchestrator'
import { chatLogger } from '@/services/chatLogger'
import { usePetriNetStore } from './petriNet'
import { useConfigStore } from './config'
import { fileService } from '@/services/file/fileService'
import type { ChatMessage, ModelCommand, LLMConfig } from '@/types/chat'
import { DEFAULT_LLM_CONFIG } from '@/types/chat'
import { extractPnmlContent } from '@/utils/petriNetNormalize'
import { resolveArcEndpoints, resolveElementId } from '@/utils/chatElementResolve'

const LLM_CONFIG_STORAGE_KEY = 'woped_llm_config'
const OPENAI_API_KEY_STORAGE_KEY = 'woped_openai_api_key'
const GEMINI_API_KEY_STORAGE_KEY = 'woped_gemini_api_key'
const CHAT_MESSAGES_STORAGE_KEY = 'woped_chat_messages'
const MAX_PERSISTED_MESSAGES = 100

interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  llmConfig: LLMConfig
  isConfigured: boolean
  showApiKeyDialog: boolean
}

let activeOrchestrator: ChatOrchestrator | null = null

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    messages: [],
    isLoading: false,
    llmConfig: { ...DEFAULT_LLM_CONFIG },
    isConfigured: false,
    showApiKeyDialog: false,
  }),

  getters: {
    hasApiKey: (state): boolean => state.llmConfig.apiKey.length > 0,

    chatHistory: (state): Array<{ role: string; content: string }> =>
      state.messages
        .filter((m) => m.role !== 'system' && !m.isLoading && !m.error)
        .map((m) => ({ role: m.role, content: m.content })),
  },

  actions: {
    loadConfig() {
      try {
        const openAiApiKey = localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY) || ''
        const geminiApiKey = localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY) || ''
        const savedConfig = localStorage.getItem(LLM_CONFIG_STORAGE_KEY)
        if (savedConfig) {
          const parsed = JSON.parse(savedConfig)
          const provider = parsed.provider === 'gemini' ? 'gemini' : 'openai'
          const providerApiKey = provider === 'gemini' ? geminiApiKey : openAiApiKey
          this.llmConfig = { ...DEFAULT_LLM_CONFIG, ...parsed, provider, apiKey: providerApiKey }
        } else {
          this.llmConfig = {
            ...DEFAULT_LLM_CONFIG,
            provider: 'openai',
            apiKey: openAiApiKey,
          }
        }
        this.isConfigured = this.llmConfig.apiKey.length > 0
      } catch {
        this.llmConfig = { ...DEFAULT_LLM_CONFIG }
        this.isConfigured = false
      }

      this.loadMessages()
    },

    saveConfig(config: Partial<LLMConfig>) {
      const nextConfig = { ...this.llmConfig, ...config }
      this.llmConfig = nextConfig
      this.isConfigured = this.llmConfig.apiKey.length > 0

      try {
        if (config.apiKey !== undefined) {
          const keyStorage = nextConfig.provider === 'gemini'
            ? GEMINI_API_KEY_STORAGE_KEY
            : OPENAI_API_KEY_STORAGE_KEY
          localStorage.setItem(keyStorage, config.apiKey)
        }

        const { apiKey: _, ...configWithoutKey } = this.llmConfig
        localStorage.setItem(LLM_CONFIG_STORAGE_KEY, JSON.stringify(configWithoutKey))
      } catch (e) {
        chatLogger.error('Failed to save chat config', e)
      }
    },

    clearConfig() {
      try {
        localStorage.removeItem(OPENAI_API_KEY_STORAGE_KEY)
        localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY)
        localStorage.removeItem(LLM_CONFIG_STORAGE_KEY)
      } catch (e) {
        chatLogger.error('Failed to clear chat config', e)
      }
      this.llmConfig = { ...DEFAULT_LLM_CONFIG }
      this.isConfigured = false
    },

    loadMessages() {
      try {
        const savedMessages = localStorage.getItem(CHAT_MESSAGES_STORAGE_KEY)
        if (!savedMessages) {
          this.messages = []
          return
        }

        const parsed = JSON.parse(savedMessages)
        if (!Array.isArray(parsed)) {
          this.messages = []
          return
        }

        this.messages = parsed.filter((message: unknown) => this.isValidChatMessage(message))
      } catch (e) {
        this.messages = []
        chatLogger.error('Failed to load chat messages', e)
      }
    },

    saveMessages() {
      try {
        const persistableMessages = this.messages
          .filter((message) => !message.isLoading)
          .slice(-MAX_PERSISTED_MESSAGES)
        localStorage.setItem(CHAT_MESSAGES_STORAGE_KEY, JSON.stringify(persistableMessages))
      } catch (e) {
        chatLogger.error('Failed to save chat messages', e)
      }
    },

    openApiKeyDialog() {
      this.showApiKeyDialog = true
    },

    closeApiKeyDialog() {
      this.showApiKeyDialog = false
    },

    abortCurrentRequest() {
      if (activeOrchestrator) {
        activeOrchestrator.abort()
        activeOrchestrator = null
      }
      this.isLoading = false
      const loadingIndex = this.messages.findIndex((m) => m.isLoading)
      if (loadingIndex !== -1) {
        this.messages.splice(loadingIndex, 1)
      }
    },

    async sendMessage(content: string) {
      if (!content.trim() || this.isLoading) return
      if (!this.isConfigured) {
        this.showApiKeyDialog = true
        return
      }

      const userMessage: ChatMessage = {
        id: nanoid(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString(),
      }
      this.messages.push(userMessage)

      const loadingId = nanoid()
      const loadingMessage: ChatMessage = {
        id: loadingId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        isLoading: true,
      }
      this.messages.push(loadingMessage)
      this.isLoading = true

      try {
        const orchestrator = new ChatOrchestrator(
          this.llmConfig,
          useConfigStore().services,
        )
        activeOrchestrator = orchestrator

        const historyForContext = this.chatHistory.filter(
          (m) => m.content !== content.trim(),
        )
        const services = useConfigStore().services
        const response = await orchestrator.sendMessage(content, historyForContext, {
          onToolStart: (toolName) => {
            if (
              toolName !== 't2p_convert' ||
              !services.t2pEnabled ||
              services.t2pPromptingStrategy !== 'few_shot'
            ) {
              return
            }
            const idx = this.messages.findIndex((m) => m.id === loadingId)
            if (idx !== -1) {
              this.messages[idx] = {
                ...this.messages[idx],
                loadingHintKey: 'chat.t2pFewShotWait',
              }
            }
          },
        })

        activeOrchestrator = null

        const messageIndex = this.messages.findIndex((m) => m.id === loadingId)
        if (messageIndex !== -1) {
          this.messages[messageIndex] = {
            id: loadingId,
            role: 'assistant',
            content: response.message,
            timestamp: new Date().toISOString(),
            commands:
              response.commands && response.commands.length > 0
                ? response.commands
                : undefined,
          }
          this.saveMessages()
        }
      } catch (error) {
        activeOrchestrator = null

        const messageIndex = this.messages.findIndex((m) => m.id === loadingId)
        if (messageIndex !== -1) {
          const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
          if (errorMessage.includes('abort')) {
            this.messages.splice(messageIndex, 1)
          } else {
            this.messages[messageIndex] = {
              id: loadingId,
              role: 'assistant',
              content: '',
              timestamp: new Date().toISOString(),
              error: errorMessage,
            }
          }
          this.saveMessages()
        }
      } finally {
        this.isLoading = false
      }
    },

    executeCommand(command: ModelCommand) {
      const petriNetStore = usePetriNetStore()
      chatLogger.command(command.type, command.params)

      switch (command.type) {
        case 'add_place': {
          const pos = (command.params.position as { x: number; y: number }) || this.getNextPosition()
          petriNetStore.addPlace(pos, (command.params.name as string) || '')
          break
        }
        case 'add_transition': {
          const pos = (command.params.position as { x: number; y: number }) || this.getNextPosition()
          petriNetStore.addTransition(pos, (command.params.name as string) || '')
          break
        }
        case 'add_arc': {
          const net = petriNetStore.net
          if (!net) break
          const { sourceId, targetId } = resolveArcEndpoints(net, command.params)
          if (sourceId && targetId) {
            const arc = petriNetStore.addArc(sourceId, targetId)
            if (!arc) {
              chatLogger.warn(`add_arc skipped: invalid arc ${sourceId} → ${targetId}`)
            }
          } else {
            chatLogger.warn(
              `add_arc skipped: could not resolve source or target (${JSON.stringify(command.params)})`,
            )
          }
          break
        }
        case 'remove_element': {
          const net = petriNetStore.net
          const elementId = net
            ? resolveElementId(net, command.params.element_id ?? command.params.elementId)
            : null
          if (elementId) {
            petriNetStore.deleteElement(elementId)
          }
          break
        }
        case 'rename_element': {
          const net = petriNetStore.net
          const name = command.params.name as string
          const elementId = net
            ? resolveElementId(net, command.params.element_id ?? command.params.elementId)
            : null
          if (elementId && name) {
            if (net) {
              const isPlace = net.places.some((p) => p.id === elementId)
              if (isPlace) {
                petriNetStore.updatePlace(elementId, { name })
              } else {
                petriNetStore.updateTransition(elementId, { name })
              }
            }
          }
          break
        }
        case 'set_tokens': {
          const net = petriNetStore.net
          const tokens = command.params.tokens as number
          const elementId = net
            ? resolveElementId(net, command.params.element_id ?? command.params.elementId)
            : null
          if (elementId && tokens !== undefined) {
            petriNetStore.updatePlace(elementId, { tokens })
          }
          break
        }
        case 'import_net': {
          const rawPnml = command.params.pnml as string
          const pnml = rawPnml ? extractPnmlContent(rawPnml) : ''
          if (!pnml) {
            // Leave the command un-executed so the UI keeps the action
            // available instead of falsely reporting success.
            chatLogger.error('Import net from chat', new Error('Empty PNML content'))
            return
          }
          try {
            const result = fileService.importFromString(pnml, 'pnml')
            if (!result.net) {
              chatLogger.error(
                'Import net from chat',
                new Error(result.errors.map((e) => e.message).join('; ') || 'Import failed'),
              )
              return
            }
            if (result.subNets && result.subNets.size > 0) {
              const nets: Record<string, typeof result.net> = {
                [result.net.id]: result.net,
              }
              for (const [id, subNet] of result.subNets) {
                nets[id] = subNet
              }
              petriNetStore.loadNets(nets, result.net.id)
            } else {
              petriNetStore.loadNet(result.net)
            }
            if (!result.success && result.warnings.length > 0) {
              chatLogger.warn(`Import warnings: ${result.warnings.join('; ')}`)
            }
          } catch (e) {
            chatLogger.error('Import net from chat', e)
            return
          }
          break
        }
      }

      command.executed = true
    },

    executeAllCommands(commands: ModelCommand[]) {
      for (const cmd of commands) {
        if (!cmd.executed) {
          this.executeCommand(cmd)
        }
      }
    },

    clearMessages() {
      this.messages = []
      try {
        localStorage.removeItem(CHAT_MESSAGES_STORAGE_KEY)
      } catch (e) {
        chatLogger.error('Failed to clear chat messages', e)
      }
    },

    isValidChatMessage(message: unknown): message is ChatMessage {
      if (!message || typeof message !== 'object') return false

      const candidate = message as Partial<ChatMessage>
      const validRoles = ['user', 'assistant', 'system']

      return (
        typeof candidate.id === 'string' &&
        typeof candidate.content === 'string' &&
        typeof candidate.timestamp === 'string' &&
        typeof candidate.role === 'string' &&
        validRoles.includes(candidate.role)
      )
    },

    getNextPosition(): { x: number; y: number } {
      const petriNetStore = usePetriNetStore()
      const net = petriNetStore.net
      if (!net || (net.places.length === 0 && net.transitions.length === 0)) {
        return { x: 200, y: 200 }
      }

      let maxX = 0
      let maxY = 0
      for (const p of net.places) {
        maxX = Math.max(maxX, p.position.x)
        maxY = Math.max(maxY, p.position.y)
      }
      for (const t of net.transitions) {
        maxX = Math.max(maxX, t.position.x)
        maxY = Math.max(maxY, t.position.y)
      }

      return { x: maxX + 100, y: maxY }
    },
  },
})

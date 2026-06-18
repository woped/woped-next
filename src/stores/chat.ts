import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'
import { ChatOrchestrator } from '@/services/chatOrchestrator'
import { chatLogger } from '@/services/chatLogger'
import { usePetriNetStore } from './petriNet'
import { fileService } from '@/services/file/fileService'
import type { ChatMessage, ModelCommand, LLMConfig, ModelCommandType } from '@/types/chat'
import { DEFAULT_LLM_CONFIG } from '@/types/chat'
import { extractPnmlContent } from '@/utils/petriNetNormalize'
import {
  resolveArcEndpoints,
  resolveElementId,
  pickElementRef,
  createResolveContext,
  pickEndpointRef,
  type ResolveContext,
} from '@/utils/chatElementResolve'

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

const MODIFY_COMMAND_ORDER: ModelCommandType[] = [
  'add_place',
  'add_transition',
  'rename_element',
  'set_tokens',
  'add_arc',
  'remove_element',
]

function sortModifyCommands(commands: ModelCommand[]): ModelCommand[] {
  const order = new Map(MODIFY_COMMAND_ORDER.map((type, index) => [type, index]))
  return [...commands].sort(
    (left, right) => (order.get(left.type) ?? 99) - (order.get(right.type) ?? 99),
  )
}

function bridgeOrphanBatchTransitions(
  commands: ModelCommand[],
  context: ResolveContext,
): void {
  const petriNetStore = usePetriNetStore()
  const net = petriNetStore.net
  if (!net || context.createdInBatch.size === 0) return

  const failedArcs = commands.filter((cmd) => cmd.type === 'add_arc' && !cmd.executed)

  for (const transition of net.transitions) {
    if (!context.createdInBatch.has(transition.id)) continue

    const hasOutgoingToExisting = net.arcs.some(
      (arc) =>
        arc.sourceId === transition.id &&
        context.knownElementIds.has(arc.targetId) &&
        !context.createdInBatch.has(arc.targetId),
    )
    if (hasOutgoingToExisting) continue

    const hasIncoming = net.arcs.some((arc) => arc.targetId === transition.id)
    if (!hasIncoming) continue

    const hasAnyOutgoing = net.arcs.some((arc) => arc.sourceId === transition.id)
    if (hasAnyOutgoing) continue

    for (const arcCommand of failedArcs) {
      const targetRef = pickEndpointRef(arcCommand.params, 'target')
      const targetId = targetRef ? resolveElementId(net, targetRef, context) : null
      if (!targetId) continue
      if (!context.knownElementIds.has(targetId) || context.createdInBatch.has(targetId)) continue
      if (!net.places.some((place) => place.id === targetId)) continue

      const arc = petriNetStore.addArc(transition.id, targetId)
      if (arc) {
        arcCommand.executed = true
        arcCommand.error = undefined
        break
      }
    }

    if (failedArcs.some((cmd) => cmd.executed)) continue

    if (failedArcs.length === 0) continue

    const preExistingPlaces = net.places.filter(
      (place) =>
        context.knownElementIds.has(place.id) && !context.createdInBatch.has(place.id),
    )
    if (preExistingPlaces.length !== 1) continue

    const arc = petriNetStore.addArc(transition.id, preExistingPlaces[0].id)
    if (arc) {
      chatLogger.warn(
        `auto-bridge: connected ${transition.name || transition.id} → ${preExistingPlaces[0].name || preExistingPlaces[0].id}`,
      )
    }
  }
}

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
        const orchestrator = new ChatOrchestrator(this.llmConfig)
        activeOrchestrator = orchestrator

        const historyForContext = this.chatHistory.filter(
          (m) => m.content !== content.trim(),
        )
        const response = await orchestrator.sendMessage(content, historyForContext)

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

    executeCommand(command: ModelCommand, context?: ResolveContext): boolean {
      const petriNetStore = usePetriNetStore()
      chatLogger.command(command.type, command.params)
      command.error = undefined

      let success = false

      switch (command.type) {
        case 'add_place': {
          const pos = (command.params.position as { x: number; y: number }) || this.getNextPosition()
          const place = petriNetStore.addPlace(pos, (command.params.name as string) || '')
          context?.createdInBatch.add(place.id)
          success = true
          break
        }
        case 'add_transition': {
          const pos = (command.params.position as { x: number; y: number }) || this.getNextPosition()
          const transition = petriNetStore.addTransition(
            pos,
            (command.params.name as string) || '',
          )
          context?.createdInBatch.add(transition.id)
          success = true
          break
        }
        case 'add_arc': {
          const net = petriNetStore.net
          if (!net) break
          const { sourceId, targetId } = resolveArcEndpoints(net, command.params, context)
          if (sourceId && targetId) {
            const arc = petriNetStore.addArc(sourceId, targetId)
            if (arc) {
              success = true
            } else {
              chatLogger.warn(`add_arc skipped: invalid arc ${sourceId} → ${targetId}`)
              command.error = 'chat.commandErrors.addArcInvalidType'
            }
          } else {
            chatLogger.warn(
              `add_arc skipped: could not resolve source or target (${JSON.stringify(command.params)})`,
            )
            command.error = 'chat.commandErrors.addArcFailed'
          }
          break
        }
        case 'remove_element': {
          const net = petriNetStore.net
          const elementId = net
            ? resolveElementId(net, pickElementRef(command.params), context)
            : null
          if (elementId) {
            petriNetStore.deleteElement(elementId)
            success = true
          } else {
            command.error = 'chat.commandErrors.removeElementFailed'
          }
          break
        }
        case 'rename_element': {
          const net = petriNetStore.net
          const name = command.params.name as string
          const elementId = net
            ? resolveElementId(net, pickElementRef(command.params), context)
            : null
          if (elementId && name && net) {
            const isPlace = net.places.some((p) => p.id === elementId)
            if (isPlace) {
              petriNetStore.updatePlace(elementId, { name })
            } else {
              petriNetStore.updateTransition(elementId, { name })
            }
            success = true
          } else {
            command.error = 'chat.commandErrors.renameElementFailed'
          }
          break
        }
        case 'set_tokens': {
          const net = petriNetStore.net
          const tokens = command.params.tokens as number
          const elementId = net
            ? resolveElementId(net, pickElementRef(command.params), context)
            : null
          if (elementId && tokens !== undefined) {
            petriNetStore.updatePlace(elementId, { tokens })
            success = true
          } else {
            command.error = 'chat.commandErrors.setTokensFailed'
          }
          break
        }
        case 'import_net': {
          const rawPnml = command.params.pnml as string
          if (!rawPnml) {
            command.error = 'chat.commandErrors.missingPnml'
            break
          }

          try {
            const pnml = extractPnmlContent(rawPnml)
            if (!pnml) {
              chatLogger.error('Import net from chat', new Error('Empty PNML content'))
              command.error = 'chat.commandErrors.emptyPnml'
              break
            }

            const result = fileService.importFromString(pnml, 'pnml')
            if (!result.net) {
              chatLogger.error(
                'Import net from chat',
                new Error(result.errors.map((e) => e.message).join('; ') || 'Import failed'),
              )
              command.error = 'chat.commandErrors.importFailed'
              break
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

            success = true
          } catch (e) {
            chatLogger.error('Import net from chat', e)
            command.error = 'chat.commandErrors.importFailed'
          }
          break
        }
      }

      command.executed = success
      return success
    },

    executeAllCommands(commands: ModelCommand[]) {
      const petriNetStore = usePetriNetStore()
      const pending = commands.filter((cmd) => !cmd.executed)
      const importCommands = pending.filter((cmd) => cmd.type === 'import_net')
      const modifyCommands = pending.filter((cmd) => cmd.type !== 'import_net')

      if (importCommands.length > 0) {
        for (const cmd of modifyCommands) {
          cmd.executed = false
          cmd.error = 'chat.commandErrors.skippedForImport'
        }

        if (importCommands.length > 1) {
          for (const cmd of importCommands.slice(0, -1)) {
            cmd.executed = false
            cmd.error = 'chat.commandErrors.duplicateImportSkipped'
          }
        }

        this.executeCommand(importCommands[importCommands.length - 1])
        return
      }

      const context = createResolveContext(petriNetStore.net)
      const sorted = sortModifyCommands(modifyCommands)

      for (const cmd of sorted) {
        this.executeCommand(cmd, context)
      }

      for (const cmd of sorted) {
        if (cmd.type === 'add_arc' && !cmd.executed && cmd.error === 'chat.commandErrors.addArcFailed') {
          cmd.error = undefined
          this.executeCommand(cmd, context)
        }
      }

      bridgeOrphanBatchTransitions(sorted, context)
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

import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useChatStore } from '@/stores/chat'
import { usePetriNetStore } from '@/stores/petriNet'
import type { ModelCommand } from '@/types/chat'

const SAMPLE_PNML = `<?xml version="1.0"?>
<pnml><net id="generated">
  <place id="p1"><graphics><position x="0" y="0"/></graphics><initialMarking><text>1</text></initialMarking></place>
  <transition id="t1"><graphics><position x="100" y="0"/></graphics></transition>
  <place id="p2"><graphics><position x="200" y="0"/></graphics></place>
  <arc id="a1" source="p1" target="t1"/>
  <arc id="a2" source="t1" target="p2"/>
</net></pnml>`

const LLM_CONFIG_STORAGE_KEY = 'woped_llm_config'
const API_KEY_STORAGE_KEY = 'woped_openai_api_key'
const CHAT_MESSAGES_STORAGE_KEY = 'woped_chat_messages'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

describe('Chat Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorageMock.clear()
  })

  it('starts with default state', () => {
    const store = useChatStore()

    expect(store.messages).toEqual([])
    expect(store.isLoading).toBe(false)
    expect(store.isConfigured).toBe(false)
    expect(store.llmConfig.apiKey).toBe('')
  })

  it('saves api key separately from model config', () => {
    const store = useChatStore()

    store.saveConfig({
      apiKey: 'secret-key',
      model: 'gpt-4o-mini',
      maxTokens: 2048,
      temperature: 0.2,
    })

    expect(localStorage.getItem(API_KEY_STORAGE_KEY)).toBe('secret-key')

    const rawConfig = localStorage.getItem(LLM_CONFIG_STORAGE_KEY)
    expect(rawConfig).toBeTruthy()

    const parsedConfig = JSON.parse(rawConfig!)
    expect(parsedConfig).toEqual({
      provider: 'openai',
      model: 'gpt-4o-mini',
      maxTokens: 2048,
      temperature: 0.2,
    })
    expect(parsedConfig.apiKey).toBeUndefined()
    expect(store.isConfigured).toBe(true)
  })

  it('loads merged config from localStorage', () => {
    localStorage.setItem(API_KEY_STORAGE_KEY, 'restored-key')
    localStorage.setItem(
      LLM_CONFIG_STORAGE_KEY,
      JSON.stringify({
        model: 'gpt-4o-mini',
        maxTokens: 1024,
        temperature: 0.1,
      }),
    )

    const store = useChatStore()
    store.loadConfig()

    expect(store.llmConfig).toEqual({
      provider: 'openai',
      apiKey: 'restored-key',
      model: 'gpt-4o-mini',
      maxTokens: 1024,
      temperature: 0.1,
    })
    expect(store.isConfigured).toBe(true)
  })

  it('falls back to defaults when stored config is invalid', () => {
    localStorage.setItem(LLM_CONFIG_STORAGE_KEY, '{invalid-json')
    localStorage.setItem(API_KEY_STORAGE_KEY, 'restored-key')

    const store = useChatStore()
    store.loadConfig()

    expect(store.llmConfig.apiKey).toBe('')
    expect(store.isConfigured).toBe(false)
  })

  it('filters chatHistory to successful user/assistant messages', () => {
    const store = useChatStore()
    store.messages = [
      {
        id: '1',
        role: 'system',
        content: 'internal',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        role: 'user',
        content: 'hello',
        timestamp: new Date().toISOString(),
      },
      {
        id: '3',
        role: 'assistant',
        content: 'thinking',
        timestamp: new Date().toISOString(),
        isLoading: true,
      },
      {
        id: '4',
        role: 'assistant',
        content: 'failed',
        timestamp: new Date().toISOString(),
        error: 'error',
      },
      {
        id: '5',
        role: 'assistant',
        content: 'answer',
        timestamp: new Date().toISOString(),
      },
    ]

    expect(store.chatHistory).toEqual([
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'answer' },
    ])
  })

  it('clears localStorage entries and resets config', () => {
    const store = useChatStore()
    store.saveConfig({ apiKey: 'secret-key', model: 'gpt-4o-mini' })

    store.clearConfig()

    expect(localStorage.getItem(API_KEY_STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem(LLM_CONFIG_STORAGE_KEY)).toBeNull()
    expect(store.llmConfig.apiKey).toBe('')
    expect(store.isConfigured).toBe(false)
  })

  it('saves messages to localStorage without loading placeholders', () => {
    const store = useChatStore()
    store.messages = [
      {
        id: '1',
        role: 'user',
        content: 'hello',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        isLoading: true,
      },
    ]

    store.saveMessages()

    const rawMessages = localStorage.getItem(CHAT_MESSAGES_STORAGE_KEY)
    expect(rawMessages).toBeTruthy()
    expect(JSON.parse(rawMessages!)).toEqual([
      {
        id: '1',
        role: 'user',
        content: 'hello',
        timestamp: store.messages[0].timestamp,
      },
    ])
  })

  it('loads only valid messages from localStorage', () => {
    localStorage.setItem(
      CHAT_MESSAGES_STORAGE_KEY,
      JSON.stringify([
        {
          id: '1',
          role: 'user',
          content: 'valid',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          role: 'invalid',
          content: 'invalid-role',
          timestamp: new Date().toISOString(),
        },
      ]),
    )

    const store = useChatStore()
    store.loadMessages()

    expect(store.messages).toHaveLength(1)
    expect(store.messages[0].id).toBe('1')
  })

  it('imports a generated net and requests a fit-to-view', () => {
    const chat = useChatStore()
    const petriNet = usePetriNetStore()
    const beforeFit = petriNet.fitToViewRequest

    const command: ModelCommand = { type: 'import_net', params: { pnml: SAMPLE_PNML } }
    chat.executeCommand(command)

    expect(command.executed).toBe(true)
    expect(petriNet.net?.places).toHaveLength(2)
    expect(petriNet.net?.transitions).toHaveLength(1)
    // Loading a net signals the canvas to fit it into view
    expect(petriNet.fitToViewRequest).toBe(beforeFit + 1)
  })

  it('does not mark import_net executed when PNML is empty', () => {
    const chat = useChatStore()
    const petriNet = usePetriNetStore()
    const beforeFit = petriNet.fitToViewRequest

    const command: ModelCommand = { type: 'import_net', params: { pnml: '' } }
    chat.executeCommand(command)

    // Failure must not be reported as success, and must not load anything
    expect(command.executed).toBeFalsy()
    expect(petriNet.fitToViewRequest).toBe(beforeFit)
  })

  it('clears chat messages and persisted history', () => {
    const store = useChatStore()
    store.messages = [
      {
        id: '1',
        role: 'user',
        content: 'hello',
        timestamp: new Date().toISOString(),
      },
    ]
    localStorage.setItem(CHAT_MESSAGES_STORAGE_KEY, JSON.stringify(store.messages))

    store.clearMessages()

    expect(store.messages).toEqual([])
    expect(localStorage.getItem(CHAT_MESSAGES_STORAGE_KEY)).toBeNull()
  })
})

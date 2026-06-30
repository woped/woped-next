import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { resetAppToDefaults } from '@/services/appReset'
import { useConfigStore } from '@/stores/config'
import { useChatStore } from '@/stores/chat'
import { usePetriNetStore } from '@/stores/petriNet'
import { AUTOSAVE_STORAGE_KEY } from '@/composables/useAutoSave'

const CONFIG_STORAGE_KEY = 'woped-config'
const PETRI_NET_STORAGE_KEY = 'woped-petrinet'
const OPENAI_API_KEY_STORAGE_KEY = 'woped_openai_api_key'
const LLM_CONFIG_STORAGE_KEY = 'woped_llm_config'
const CHAT_MESSAGES_STORAGE_KEY = 'woped_chat_messages'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
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

describe('resetAppToDefaults', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorageMock.clear()
  })

  it('clears settings, chat, persistence, and loads the default sample net', () => {
    const configStore = useConfigStore()
    const chatStore = useChatStore()
    const petriNetStore = usePetriNetStore()

    configStore.updateEditor({ gridSize: 40, showGrid: false })
    chatStore.saveConfig({ apiKey: 'secret-key', model: 'gpt-4o-mini' })
    chatStore.messages.push({
      id: 'm1',
      role: 'user',
      content: 'Hello',
      timestamp: new Date().toISOString(),
    })
    chatStore.saveMessages()

    petriNetStore.addPlace({ x: 10, y: 10 }, 'Custom')
    petriNetStore.saveToLocalStorage()
    localStorage.setItem(AUTOSAVE_STORAGE_KEY, '{}')
    localStorage.setItem(`${AUTOSAVE_STORAGE_KEY}-activeNet`, 'x')

    resetAppToDefaults()

    expect(configStore.editor.gridSize).toBe(20)
    expect(configStore.editor.showGrid).toBe(true)
    expect(chatStore.llmConfig.apiKey).toBe('')
    expect(chatStore.isConfigured).toBe(false)
    expect(chatStore.messages).toEqual([])
    expect(localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem(LLM_CONFIG_STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem(CHAT_MESSAGES_STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem(AUTOSAVE_STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem(`${AUTOSAVE_STORAGE_KEY}-activeNet`)).toBeNull()

    const net = petriNetStore.net
    expect(net?.places.some((p) => p.name === 'Start')).toBe(true)
    expect(net?.operators.length).toBe(2)
    expect(net?.places.some((p) => p.name === 'Custom')).toBe(false)
    expect(petriNetStore.hydratedFromStorage).toBe(false)

    const savedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY)!)
    expect(savedConfig.editor.gridSize).toBe(20)
    expect(localStorage.getItem(PETRI_NET_STORAGE_KEY)).toBeNull()
  })
})

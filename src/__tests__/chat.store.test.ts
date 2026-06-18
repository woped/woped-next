import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useChatStore } from '@/stores/chat'
import { usePetriNetStore } from '@/stores/petriNet'
import type { ModelCommand } from '@/types/chat'
import { OperatorType } from '@/types/petri-net'

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

const SAMPLE_PNML = `<?xml version="1.0" encoding="UTF-8"?>
<pnml>
  <net id="test-net" type="http://www.pnml.org/version-2009/grammar/ptnet">
    <name><text>Test Net</text></name>
    <place id="p1">
      <name><text>Place 1</text></name>
      <graphics><position x="100" y="100"/></graphics>
      <initialMarking><text>1</text></initialMarking>
    </place>
    <transition id="t1">
      <name><text>Transition 1</text></name>
      <graphics><position x="200" y="100"/></graphics>
    </transition>
    <arc id="a1" source="p1" target="t1">
      <inscription><text>1</text></inscription>
    </arc>
  </net>
</pnml>`

describe('Chat Store command execution', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('marks import_net as failed when PNML is missing', () => {
    const store = useChatStore()
    const command: ModelCommand = {
      type: 'import_net',
      params: {},
      executed: false,
    }

    expect(store.executeCommand(command)).toBe(false)
    expect(command.executed).toBe(false)
    expect(command.error).toBe('chat.commandErrors.missingPnml')
  })

  it('marks import_net as failed when PNML content is empty', () => {
    const store = useChatStore()
    const command: ModelCommand = {
      type: 'import_net',
      params: { pnml: '```xml\n\n```' },
      executed: false,
    }

    expect(store.executeCommand(command)).toBe(false)
    expect(command.executed).toBe(false)
    expect(command.error).toBe('chat.commandErrors.emptyPnml')
  })

  it('imports a valid net and marks command as executed', () => {
    const store = useChatStore()
    const petriNetStore = usePetriNetStore()
    const command: ModelCommand = {
      type: 'import_net',
      params: { pnml: SAMPLE_PNML },
      executed: false,
    }

    expect(store.executeCommand(command)).toBe(true)
    expect(command.executed).toBe(true)
    expect(command.error).toBeUndefined()
    expect(petriNetStore.net.places).toHaveLength(1)
    expect(petriNetStore.net.transitions).toHaveLength(1)
  })

  it('skips modify commands when batch contains import_net', () => {
    const store = useChatStore()
    const petriNetStore = usePetriNetStore()

    const commands: ModelCommand[] = [
      { type: 'add_place', params: { name: 'Extra' }, executed: false },
      { type: 'import_net', params: { pnml: SAMPLE_PNML }, executed: false },
    ]

    store.executeAllCommands(commands)

    expect(commands[0].executed).toBe(false)
    expect(commands[0].error).toBe('chat.commandErrors.skippedForImport')
    expect(commands[1].executed).toBe(true)
    expect(petriNetStore.net.places).toHaveLength(1)
    expect(petriNetStore.net.places[0].name).toBe('Place 1')
  })

  it('executes modify commands when no import_net is present', () => {
    const store = useChatStore()
    const petriNetStore = usePetriNetStore()
    const initialPlaceCount = petriNetStore.net.places.length

    const commands: ModelCommand[] = [
      { type: 'add_place', params: { name: 'Extra' }, executed: false },
    ]

    store.executeAllCommands(commands)

    expect(commands[0].executed).toBe(true)
    expect(commands[0].error).toBeUndefined()
    expect(petriNetStore.net.places).toHaveLength(initialPlaceCount + 1)
  })

  it('connects arcs using names from the same command batch', () => {
    const store = useChatStore()
    const petriNetStore = usePetriNetStore()
    petriNetStore.addPlace({ x: 0, y: 0 }, 'Start')
    petriNetStore.addTransition({ x: 100, y: 0 }, 'OldStep')
    petriNetStore.addTransition({ x: 200, y: 0 }, 'After')

    const commands: ModelCommand[] = [
      { type: 'add_transition', params: { name: 'test' }, executed: false },
      { type: 'add_place', params: { name: 'test1' }, executed: false },
      { type: 'add_arc', params: { source: 'Start', target: 'test' }, executed: false },
      { type: 'add_arc', params: { source: 'test', target: 'test1' }, executed: false },
      { type: 'add_arc', params: { source: 'test1', target: 'After' }, executed: false },
    ]

    store.executeAllCommands(commands)

    expect(commands.every((cmd) => cmd.executed)).toBe(true)
    expect(petriNetStore.net.arcs.length).toBeGreaterThanOrEqual(3)
  })

  it('runs add_arc commands after creates even when the LLM lists arcs first', () => {
    const store = useChatStore()
    const petriNetStore = usePetriNetStore()
    petriNetStore.addPlace({ x: 0, y: 0 }, 'Start')
    petriNetStore.addTransition({ x: 200, y: 0 }, 'Split')

    const commands: ModelCommand[] = [
      { type: 'add_arc', params: { source: 'Start', target: 'test' }, executed: false },
      { type: 'add_arc', params: { source: 'test', target: 'test1' }, executed: false },
      { type: 'add_arc', params: { source: 'test1', target: 'Split' }, executed: false },
      { type: 'add_transition', params: { name: 'test' }, executed: false },
      { type: 'add_place', params: { name: 'test1' }, executed: false },
    ]

    store.executeAllCommands(commands)

    expect(commands.every((cmd) => cmd.executed)).toBe(true)
  })

  it('supports place_id and transition_id arc params', () => {
    const store = useChatStore()
    const petriNetStore = usePetriNetStore()
    petriNetStore.addPlace({ x: 0, y: 0 }, 'Start')

    const commands: ModelCommand[] = [
      { type: 'add_transition', params: { name: 'test' }, executed: false },
      {
        type: 'add_arc',
        params: { place_id: 'Start', transition_id: 'test' },
        executed: false,
      },
    ]

    store.executeAllCommands(commands)

    expect(commands.every((cmd) => cmd.executed)).toBe(true)
  })

  it('connects a prepended chain to the existing Start place when names are similar', () => {
    const store = useChatStore()
    const petriNetStore = usePetriNetStore()
    const existingStart = petriNetStore.addPlace({ x: 100, y: 0 }, 'Start')
    petriNetStore.addTransition({ x: 200, y: 0 }, 'Next')

    const commands: ModelCommand[] = [
      { type: 'add_place', params: { name: 'Start neu' }, executed: false },
      { type: 'add_transition', params: { name: 'Task T' }, executed: false },
      { type: 'add_arc', params: { source: 'Start neu', target: 'Task T' }, executed: false },
      { type: 'add_arc', params: { source: 'Task T', target: 'Start' }, executed: false },
    ]

    store.executeAllCommands(commands)

    expect(commands.every((cmd) => cmd.executed)).toBe(true)
    expect(
      petriNetStore.net.arcs.some(
        (arc) => arc.sourceId !== existingStart.id && arc.targetId === existingStart.id,
      ),
    ).toBe(true)
  })

  it('prefers the existing Start place over Start neu when both could match', () => {
    const store = useChatStore()
    const petriNetStore = usePetriNetStore()
    petriNetStore.addPlace({ x: 100, y: 0 }, 'Start')

    const commands: ModelCommand[] = [
      { type: 'add_place', params: { name: 'Start neu' }, executed: false },
      { type: 'add_transition', params: { name: 'Task T' }, executed: false },
      { type: 'add_arc', params: { source: 'Start neu', target: 'Task T' }, executed: false },
      { type: 'add_arc', params: { source: 'Task T', target: 'Start' }, executed: false },
    ]

    store.executeAllCommands(commands)

    const taskT = petriNetStore.net.transitions.find((transition) => transition.name === 'Task T')
    const existingStart = petriNetStore.net.places.find((place) => place.name === 'Start')
    expect(taskT).toBeDefined()
    expect(existingStart).toBeDefined()
    expect(
      petriNetStore.net.arcs.some(
        (arc) => arc.sourceId === taskT!.id && arc.targetId === existingStart!.id,
      ),
    ).toBe(true)
  })

  it('auto-bridges an orphan transition when the arc to the existing model failed', () => {
    const store = useChatStore()
    const petriNetStore = usePetriNetStore()
    const existingStart = petriNetStore.addPlace({ x: 100, y: 0 }, 'Start')

    const commands: ModelCommand[] = [
      { type: 'add_place', params: { name: 'Start neu' }, executed: false },
      { type: 'add_transition', params: { name: 'Task T' }, executed: false },
      { type: 'add_arc', params: { source: 'Start neu', target: 'Task T' }, executed: false },
      {
        type: 'add_arc',
        params: { source: 'Task T', target: 'wrong-target-id' },
        executed: false,
      },
    ]

    store.executeAllCommands(commands)

    expect(
      petriNetStore.net.arcs.some(
        (arc) => arc.sourceId !== existingStart.id && arc.targetId === existingStart.id,
      ),
    ).toBe(true)
  })

  it('connects arcs to split operators referenced by keyword', () => {
    const store = useChatStore()
    const petriNetStore = usePetriNetStore()
    petriNetStore.addPlace({ x: 0, y: 0 }, 'Start')
    const split = petriNetStore.addOperator({ x: 300, y: 0 }, OperatorType.AND_SPLIT, 'Split')

    const commands: ModelCommand[] = [
      { type: 'add_transition', params: { name: 'test' }, executed: false },
      { type: 'add_place', params: { name: 'test1' }, executed: false },
      { type: 'add_arc', params: { source_name: 'Start', target_name: 'test' }, executed: false },
      { type: 'add_arc', params: { source_name: 'test', target_name: 'test1' }, executed: false },
      { type: 'add_arc', params: { source_name: 'test1', target_name: 'split' }, executed: false },
    ]

    store.executeAllCommands(commands)

    expect(commands.every((cmd) => cmd.executed)).toBe(true)
    expect(
      petriNetStore.net.arcs.some(
        (arc) => arc.sourceId !== split.id && arc.targetId === split.id,
      ),
    ).toBe(true)
  })
})

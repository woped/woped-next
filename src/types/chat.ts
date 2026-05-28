export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  commands?: ModelCommand[]
  isLoading?: boolean
  error?: string
}

export type ModelCommandType =
  | 'add_place'
  | 'add_transition'
  | 'add_arc'
  | 'remove_element'
  | 'rename_element'
  | 'set_tokens'
  | 'import_net'

export interface ModelCommand {
  type: ModelCommandType
  params: Record<string, unknown>
  executed?: boolean
}

export interface ModelSummary {
  placesCount: number
  transitionsCount: number
  arcsCount: number
  operatorTypes: string[]
  hasSubprocesses: boolean
  elementNames: string[]
}

export interface LLMConfig {
  provider: LLMProvider
  apiKey: string
  model: string
  maxTokens: number
  temperature: number
}

export type LLMProvider = 'openai' | 'gemini'

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: 'openai',
  apiKey: '',
  model: 'gpt-4o',
  maxTokens: 4096,
  temperature: 0.7,
}

export const PROVIDER_OPTIONS: Array<{ id: LLMProvider; name: string }> = [
  { id: 'openai', name: 'OpenAI' },
  { id: 'gemini', name: 'Google Gemini' },
]

export const AVAILABLE_MODELS_BY_PROVIDER: Record<LLMProvider, Array<{ id: string; name: string }>> = {
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
  ],
  gemini: [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
  ],
}

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export interface ToolResult {
  toolCallId: string
  content: string
}

export interface OrchestratorResponse {
  message: string
  commands: ModelCommand[]
}

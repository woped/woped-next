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

export interface LLMModelOption {
  id: string
  name: string
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

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  commands?: ModelCommand[]
  isLoading?: boolean
  /** i18n key shown below the loading indicator while waiting */
  loadingHintKey?: string
  error?: string
}

export interface ChatSendCallbacks {
  onToolStart?: (toolName: string) => void
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
  /** Provider creation timestamp (Unix seconds), when available (OpenAI). Used to sort newest-first. */
  created?: number
}

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
  /** Original function name from the provider (e.g. Gemini default_api: prefix). */
  providerFunctionName?: string
}

export interface ToolResult {
  toolCallId: string
  content: string
}

export interface OrchestratorResponse {
  message: string
  commands: ModelCommand[]
}

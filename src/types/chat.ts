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
  apiKey: string
  model: string
  maxTokens: number
  temperature: number
}

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  apiKey: '',
  model: 'gpt-4o',
  maxTokens: 4096,
  temperature: 0.7,
}

export interface ModelOption {
  id: string
  name: string
}

/**
 * Static fallback list of current chat models, used before an API key is
 * entered or when model discovery fails. Kept intentionally small and current,
 * covering distinct use cases (flagship / balanced / efficient).
 */
export const AVAILABLE_MODELS: readonly ModelOption[] = [
  { id: 'gpt-4.1', name: 'GPT-4.1' },
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
] as const

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

import type { LLMConfig } from '@/types/chat'
import { usePetriNetStore } from '@/stores/petriNet'
import { createLocalMcpServer } from './localMcpServer'
import { registerNlpTools } from './registerNlpTools'

export function createNlpMcpServer(llmConfig?: LLMConfig) {
  const server = createLocalMcpServer()

  registerNlpTools(
    server,
    {
      getNet: () => usePetriNetStore().net,
    },
    llmConfig,
  )

  return server
}

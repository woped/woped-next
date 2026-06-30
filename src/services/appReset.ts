import { useConfigStore } from '@/stores/config'
import { useChatStore } from '@/stores/chat'
import { usePetriNetStore } from '@/stores/petriNet'
import { useTokenGameStore } from '@/stores/tokenGame'
import { useSimulationStore } from '@/stores/simulation'
import { clearAutoSaveStorage } from '@/composables/useAutoSave'

/**
 * Reset the application to factory defaults: settings, chat, API keys,
 * persisted diagram, and the default sample net.
 */
export function resetAppToDefaults(): void {
  const configStore = useConfigStore()
  const chatStore = useChatStore()
  const petriNetStore = usePetriNetStore()
  const tokenGameStore = useTokenGameStore()
  const simulationStore = useSimulationStore()

  chatStore.abortCurrentRequest()
  configStore.reset()
  chatStore.clearConfig()
  chatStore.clearMessages()
  clearAutoSaveStorage()

  if (tokenGameStore.isRunning) {
    tokenGameStore.stop()
  }

  petriNetStore.resetToDefaultSample()
  simulationStore.reset()
}

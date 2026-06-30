import { ref, watch, onUnmounted } from 'vue'
import { usePetriNetStore } from '@/stores/petriNet'
import { useConfigStore } from '@/stores/config'
import { fileService } from '@/services/file/fileService'

export const AUTOSAVE_STORAGE_KEY = 'woped-autosave'

export function clearAutoSaveStorage(): void {
  try {
    localStorage.removeItem(AUTOSAVE_STORAGE_KEY)
    localStorage.removeItem(`${AUTOSAVE_STORAGE_KEY}-activeNet`)
  } catch {
    // localStorage unavailable — ignore
  }
}

/**
 * Auto-save composable. Periodically saves the current net to localStorage
 * when general.autoSave is enabled.
 */
export function useAutoSave() {
  const petriNetStore = usePetriNetStore()
  const configStore = useConfigStore()

  let timerId: ReturnType<typeof setInterval> | null = null
  const lastSaved = ref<number | null>(null)

  function save() {
    try {
      const snapshot = JSON.stringify(petriNetStore.nets)
      localStorage.setItem(AUTOSAVE_STORAGE_KEY, snapshot)
      localStorage.setItem(`${AUTOSAVE_STORAGE_KEY}-activeNet`, petriNetStore.activeNetId)
      lastSaved.value = Date.now()
    } catch {
      // localStorage full or unavailable — silently skip
    }
  }

  function restore(): boolean {
    try {
      const raw = localStorage.getItem(AUTOSAVE_STORAGE_KEY)
      const activeNetId = localStorage.getItem(`${AUTOSAVE_STORAGE_KEY}-activeNet`)
      if (!raw || !activeNetId) return false
      const nets = JSON.parse(raw)
      if (nets && typeof nets === 'object' && nets[activeNetId]) {
        petriNetStore.loadNets(nets, activeNetId)
        return true
      }
    } catch {
      // corrupt data — ignore
    }
    return false
  }

  function start() {
    stop()
    const interval = configStore.$state.general.autoSaveInterval || 60000
    timerId = setInterval(save, interval)
  }

  function stop() {
    if (timerId !== null) {
      clearInterval(timerId)
      timerId = null
    }
  }

  watch(
    () => configStore.$state.general.autoSave,
    (enabled) => {
      if (enabled) start()
      else stop()
    },
    { immediate: true },
  )

  watch(
    () => configStore.$state.general.autoSaveInterval,
    () => {
      if (configStore.$state.general.autoSave) start()
    },
  )

  onUnmounted(stop)

  return { lastSaved, save, restore, start, stop }
}

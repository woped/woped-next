import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'
import VueKonva from 'vue-konva'
import { i18n, setLocale } from './i18n'
import { useConfigStore } from './stores/config'
import { usePetriNetStore } from './stores/petriNet'
import './style.css'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(i18n)
app.use(VueKonva)

// Initialize stores before mounting so components hydrate from persisted state.
const configStore = useConfigStore()
configStore.load()
setLocale(configStore.language.locale)

const petriNetStore = usePetriNetStore()
petriNetStore.loadFromLocalStorage()

// Persist net changes (debounced). Only net data and the active net id are
// watched; transient UI state (viewport, selection, tool) is not persisted.
watch(
  [() => petriNetStore.nets, () => petriNetStore.activeNetId],
  () => petriNetStore.scheduleSave(),
  { deep: true },
)

app.mount('#app')

import { createApp } from "vue";
import { createPinia } from "pinia";
import VueKonva from "vue-konva";
import { i18n, setLocale } from "./i18n";
import "./style.css";
import App from "./App.vue";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(i18n);
app.use(VueKonva);
app.mount("#app");

// Initialize config store after mounting
import { useConfigStore } from "./stores/config";
const configStore = useConfigStore();
configStore.load();

// Initialize petri net store and restore persisted state
import { usePetriNetStore } from "./stores/petriNet";
const petriNetStore = usePetriNetStore();
petriNetStore.load();

// Set initial locale from config
setLocale(configStore.language.locale);

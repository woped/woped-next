<script setup>
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useConfigStore } from '@/stores/config'
import { withPort } from '@/services/tools/toolConfig'
import { pingService } from '@/services/tools/serviceHealth'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])

const { t } = useI18n()
const configStore = useConfigStore()
const { general, editor, tokenGame, analysis, language, services } = storeToRefs(configStore)

// Active tab
const activeTab = ref('general')

const tabs = computed(() => [
  { id: 'general', label: t('settings.general') },
  { id: 'editor', label: t('settings.editor') },
  { id: 'simulation', label: t('settings.simulation') },
  { id: 'analysis', label: t('settings.analysis') },
  { id: 'services', label: t('settings.wopedServices') },
])

// Local copies for editing
const localGeneral = ref({ ...general.value })
const localEditor = ref({ ...editor.value })
const localTokenGame = ref({ ...tokenGame.value })
const localAnalysis = ref({ ...analysis.value })
const localLanguage = ref({ ...language.value })
const localServices = ref({ ...services.value })

// A URL is acceptable if it is empty or a valid http(s) URL.
function isValidEndpoint(url) {
  const trimmed = (url ?? '').trim()
  if (!trimmed) return true
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

// A port is acceptable if it is empty/unset or an integer in 1..65535.
function isValidPort(port) {
  if (port === null || port === undefined || port === '') return true
  const n = Number(port)
  return Number.isInteger(n) && n >= 1 && n <= 65535
}

// Coerce a port input into an integer or null for persistence.
function toPortOrNull(port) {
  if (port === null || port === undefined || port === '') return null
  const n = Number(port)
  return Number.isInteger(n) && n >= 1 && n <= 65535 ? n : null
}

// Derive the implicit default port from an endpoint URL (explicit port, else 443/80).
function defaultPortFromEndpoint(url) {
  const trimmed = (url ?? '').trim()
  if (!trimmed) return ''
  try {
    const parsed = new URL(trimmed)
    if (parsed.port) return parsed.port
    return parsed.protocol === 'https:' ? '443' : '80'
  } catch {
    return ''
  }
}

const t2pDefaultPortPlaceholder = computed(() =>
  defaultPortFromEndpoint(localServices.value.t2pEndpoint),
)
const p2tDefaultPortPlaceholder = computed(() =>
  defaultPortFromEndpoint(localServices.value.p2tEndpoint),
)

// Only enabled services with a non-empty URL must be valid; a disabled service
// (or one intentionally left blank to force the LLM fallback) is fine.
const t2pEndpointInvalid = computed(
  () => localServices.value.t2pEnabled && !isValidEndpoint(localServices.value.t2pEndpoint),
)
const p2tEndpointInvalid = computed(
  () => localServices.value.p2tEnabled && !isValidEndpoint(localServices.value.p2tEndpoint),
)
const t2pPortInvalid = computed(() => !isValidPort(localServices.value.t2pPort))
const p2tPortInvalid = computed(() => !isValidPort(localServices.value.p2tPort))
const servicesValid = computed(
  () =>
    !t2pEndpointInvalid.value &&
    !p2tEndpointInvalid.value &&
    !t2pPortInvalid.value &&
    !p2tPortInvalid.value,
)

// Connection test state per service: 'idle' | 'testing' | 'ok' | 'fail'
const connectionStatus = ref({ t2p: 'idle', p2t: 'idle' })

function resetConnectionStatus(kind) {
  connectionStatus.value[kind] = 'idle'
}

async function testConnection(kind) {
  const endpoint = kind === 't2p' ? localServices.value.t2pEndpoint : localServices.value.p2tEndpoint
  const port = kind === 't2p' ? localServices.value.t2pPort : localServices.value.p2tPort

  if (!isValidEndpoint(endpoint) || !isValidPort(port) || !(endpoint ?? '').trim()) {
    connectionStatus.value[kind] = 'fail'
    return
  }

  connectionStatus.value[kind] = 'testing'
  const url = withPort(endpoint.trim(), toPortOrNull(port))
  const ok = await pingService(url)
  connectionStatus.value[kind] = ok ? 'ok' : 'fail'
}

// Store original settings when dialog opens (for cancel restore)
const originalTheme = ref(null)
const originalLocale = ref(null)

// Reset local values when dialog opens
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      localGeneral.value = { ...general.value }
      localEditor.value = { ...editor.value }
      localTokenGame.value = { ...tokenGame.value }
      localAnalysis.value = { ...analysis.value }
      localLanguage.value = { ...language.value }
      localServices.value = { ...services.value }
      connectionStatus.value = { t2p: 'idle', p2t: 'idle' }
      originalTheme.value = general.value.theme
      originalLocale.value = language.value.locale
    }
  }
)

// Save all settings
const saveSettings = () => {
  if (!servicesValid.value) {
    activeTab.value = 'services'
    return
  }
  configStore.updateGeneral(localGeneral.value)
  configStore.updateEditor(localEditor.value)
  configStore.updateTokenGame(localTokenGame.value)
  configStore.updateAnalysis(localAnalysis.value)
  configStore.updateServices({
    ...localServices.value,
    t2pPort: toPortOrNull(localServices.value.t2pPort),
    p2tPort: toPortOrNull(localServices.value.p2tPort),
  })
  configStore.updateLanguage(localLanguage.value)
  emit('close')
}

// Cancel and close (restore settings if changed)
const cancel = () => {
  if (originalTheme.value && originalTheme.value !== localGeneral.value.theme) {
    configStore.setTheme(originalTheme.value)
  }
  if (originalLocale.value && originalLocale.value !== localLanguage.value.locale) {
    configStore.setLocale(originalLocale.value)
  }
  emit('close')
}

// Reset to defaults
const resetDefaults = () => {
  configStore.reset()
  localGeneral.value = { ...general.value }
  localEditor.value = { ...editor.value }
  localTokenGame.value = { ...tokenGame.value }
  localAnalysis.value = { ...analysis.value }
  localLanguage.value = { ...language.value }
  localServices.value = { ...services.value }
}

// Preview theme immediately when changed
const previewTheme = () => {
  configStore.setTheme(localGeneral.value.theme)
}

// Preview locale immediately when changed
const previewLocale = () => {
  configStore.setLocale(localLanguage.value.locale)
}

// Handle escape key
const handleKeydown = (e) => {
  if (e.key === 'Escape') {
    cancel()
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="dialog-overlay"
      @click.self="cancel"
      @keydown="handleKeydown"
    >
      <div class="dialog" role="dialog" aria-labelledby="settings-title">
        <!-- Header -->
        <div class="dialog-header">
          <h2 id="settings-title">{{ $t('settings.title') }}</h2>
          <button class="close-btn" @click="cancel" :aria-label="$t('common.close')">×</button>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="['tab', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Content -->
        <div class="dialog-content">
          <!-- General Tab -->
          <div v-show="activeTab === 'general'" class="tab-content">
            <div class="setting-group">
              <h3>{{ $t('settings.appearance') }}</h3>
              <div class="setting-row">
                <label>{{ $t('settings.theme') }}</label>
                <select v-model="localGeneral.theme" @change="previewTheme">
                  <option value="light">{{ $t('settings.themeLight') }}</option>
                  <option value="dark">{{ $t('settings.themeDark') }}</option>
                  <option value="system">{{ $t('settings.themeSystem') }}</option>
                </select>
              </div>
            </div>

            <div class="setting-group">
              <h3>{{ $t('settings.language') }}</h3>
              <div class="setting-row">
                <label>{{ $t('settings.language') }}</label>
                <select v-model="localLanguage.locale" @change="previewLocale">
                  <option value="en">English</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
            </div>

            <div class="setting-group">
              <h3>{{ $t('settings.autoSave') }}</h3>
              <div class="setting-row">
                <label>{{ $t('settings.enableAutoSave') }}</label>
                <input type="checkbox" v-model="localGeneral.autoSave" />
              </div>
              <div class="setting-row" v-if="localGeneral.autoSave">
                <label>{{ $t('settings.autoSaveInterval') }}</label>
                <input
                  type="number"
                  v-model.number="localGeneral.autoSaveInterval"
                  min="10000"
                  max="600000"
                  step="10000"
                />
                <span class="hint">{{ Math.round(localGeneral.autoSaveInterval / 1000) }}s</span>
              </div>
            </div>
          </div>

          <!-- Editor Tab -->
          <div v-show="activeTab === 'editor'" class="tab-content">
            <div class="setting-group">
              <h3>{{ $t('settings.grid') }}</h3>
              <div class="setting-row">
                <label>{{ $t('settings.showGrid') }}</label>
                <input type="checkbox" v-model="localEditor.showGrid" />
              </div>
              <div class="setting-row">
                <label>{{ $t('settings.snapToGrid') }}</label>
                <input type="checkbox" v-model="localEditor.snapToGrid" />
              </div>
              <div class="setting-row">
                <label>{{ $t('settings.gridSize') }}</label>
                <input
                  type="number"
                  v-model.number="localEditor.gridSize"
                  min="10"
                  max="50"
                  step="5"
                />
              </div>
            </div>

            <div class="setting-group">
              <h3>{{ $t('settings.notation') }}</h3>
              <div class="setting-row">
                <label>{{ $t('settings.operatorNotation') }}</label>
                <select v-model="localEditor.operatorNotation">
                  <option value="vanDerAalst">{{ $t('settings.notationVanDerAalst') }}</option>
                  <option value="modern">{{ $t('settings.notationModern') }}</option>
                </select>
              </div>
            </div>

            <div class="setting-group">
              <h3>{{ $t('settings.display') }}</h3>
              <div class="setting-row">
                <label>{{ $t('settings.showLabels') }}</label>
                <input type="checkbox" v-model="localEditor.showLabels" />
              </div>
              <div class="setting-row">
                <label>{{ $t('settings.showTokenNumbers') }}</label>
                <input type="checkbox" v-model="localEditor.showTokenNumbers" />
              </div>
              <div class="setting-row">
                <label>{{ $t('settings.defaultZoom') }}</label>
                <input
                  type="number"
                  v-model.number="localEditor.defaultZoom"
                  min="0.25"
                  max="3"
                  step="0.25"
                />
                <span class="hint">{{ Math.round(localEditor.defaultZoom * 100) }}%</span>
              </div>
            </div>

            <div class="setting-group">
              <h3>{{ $t('settings.animation') }}</h3>
              <div class="setting-row">
                <label>{{ $t('settings.animationDuration') }}</label>
                <input
                  type="number"
                  v-model.number="localEditor.animationDuration"
                  min="0"
                  max="1000"
                  step="50"
                />
              </div>
            </div>
          </div>

          <!-- Simulation Tab -->
          <div v-show="activeTab === 'simulation'" class="tab-content">
            <div class="setting-group">
              <h3>{{ $t('settings.tokenGameSettings') }}</h3>
              <div class="setting-row">
                <label>{{ $t('settings.defaultSpeed') }}</label>
                <input
                  type="number"
                  v-model.number="localTokenGame.defaultSpeed"
                  min="100"
                  max="5000"
                  step="100"
                />
              </div>
              <div class="setting-row">
                <label>{{ $t('settings.showAnimations') }}</label>
                <input type="checkbox" v-model="localTokenGame.showAnimations" />
              </div>
              <div class="setting-row">
                <label>{{ $t('settings.highlightEnabled') }}</label>
                <input type="checkbox" v-model="localTokenGame.highlightEnabled" />
              </div>
            </div>

            <div class="setting-group">
              <h3>{{ $t('settings.conflictResolution') }}</h3>
              <div class="setting-row">
                <label>{{ $t('settings.defaultMode') }}</label>
                <select v-model="localTokenGame.conflictResolution">
                  <option value="manual">{{ $t('tokenGame.manual') }}</option>
                  <option value="random">{{ $t('tokenGame.random') }}</option>
                  <option value="first">{{ $t('tokenGame.first') }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Analysis Tab -->
          <div v-show="activeTab === 'analysis'" class="tab-content">
            <div class="setting-group">
              <h3>{{ $t('settings.stateSpace') }}</h3>
              <div class="setting-row">
                <label>{{ $t('settings.maxStates') }}</label>
                <input
                  type="number"
                  v-model.number="localAnalysis.maxStates"
                  min="100"
                  max="10000"
                  step="100"
                />
              </div>
            </div>

            <div class="setting-group">
              <h3>{{ $t('settings.behavior') }}</h3>
              <div class="setting-row">
                <label>{{ $t('settings.autoAnalyze') }}</label>
                <input type="checkbox" v-model="localAnalysis.autoAnalyze" />
              </div>
              <div class="setting-row">
                <label>{{ $t('settings.showInfoMessages') }}</label>
                <input type="checkbox" v-model="localAnalysis.showInfoMessages" />
              </div>
            </div>
          </div>

          <!-- WoPeD Services Tab -->
          <div v-show="activeTab === 'services'" class="tab-content">
            <p class="settings-hint">{{ $t('settings.servicesHint') }}</p>

            <div class="setting-group">
              <h3>{{ $t('settings.t2pService') }}</h3>
              <div class="setting-row">
                <label>{{ $t('settings.t2pEnabled') }}</label>
                <input type="checkbox" v-model="localServices.t2pEnabled" />
              </div>
              <div class="setting-row">
                <label>{{ $t('settings.t2pEndpoint') }}</label>
                <input
                  type="text"
                  v-model="localServices.t2pEndpoint"
                  class="endpoint-input"
                  :class="{ invalid: t2pEndpointInvalid }"
                  :disabled="!localServices.t2pEnabled"
                  placeholder="https://…"
                  @input="resetConnectionStatus('t2p')"
                />
              </div>
              <p v-if="t2pEndpointInvalid" class="setting-error">{{ $t('settings.invalidEndpoint') }}</p>
              <div class="setting-row">
                <label>{{ $t('settings.port') }}</label>
                <input
                  type="number"
                  v-model="localServices.t2pPort"
                  :class="{ invalid: t2pPortInvalid }"
                  :disabled="!localServices.t2pEnabled"
                  min="1"
                  max="65535"
                  :placeholder="t2pDefaultPortPlaceholder"
                  @input="resetConnectionStatus('t2p')"
                />
              </div>
              <p v-if="t2pPortInvalid" class="setting-error">{{ $t('settings.invalidPort') }}</p>
              <div class="setting-row connection-row">
                <button
                  type="button"
                  class="btn-test"
                  :disabled="!localServices.t2pEnabled || connectionStatus.t2p === 'testing'"
                  @click="testConnection('t2p')"
                >
                  {{ $t('settings.testConnection') }}
                </button>
                <span class="connection-status" :class="connectionStatus.t2p">
                  <template v-if="connectionStatus.t2p === 'testing'">{{ $t('settings.testing') }}</template>
                  <template v-else-if="connectionStatus.t2p === 'ok'">{{ $t('settings.connectionOk') }}</template>
                  <template v-else-if="connectionStatus.t2p === 'fail'">{{ $t('settings.connectionFailed') }}</template>
                </span>
              </div>
            </div>

            <div class="setting-group">
              <h3>{{ $t('settings.p2tService') }}</h3>
              <div class="setting-row">
                <label>{{ $t('settings.p2tEnabled') }}</label>
                <input type="checkbox" v-model="localServices.p2tEnabled" />
              </div>
              <div class="setting-row">
                <label>{{ $t('settings.p2tEndpoint') }}</label>
                <input
                  type="text"
                  v-model="localServices.p2tEndpoint"
                  class="endpoint-input"
                  :class="{ invalid: p2tEndpointInvalid }"
                  :disabled="!localServices.p2tEnabled"
                  placeholder="https://…"
                  @input="resetConnectionStatus('p2t')"
                />
              </div>
              <p v-if="p2tEndpointInvalid" class="setting-error">{{ $t('settings.invalidEndpoint') }}</p>
              <div class="setting-row">
                <label>{{ $t('settings.port') }}</label>
                <input
                  type="number"
                  v-model="localServices.p2tPort"
                  :class="{ invalid: p2tPortInvalid }"
                  :disabled="!localServices.p2tEnabled"
                  min="1"
                  max="65535"
                  :placeholder="p2tDefaultPortPlaceholder"
                  @input="resetConnectionStatus('p2t')"
                />
              </div>
              <p v-if="p2tPortInvalid" class="setting-error">{{ $t('settings.invalidPort') }}</p>
              <div class="setting-row connection-row">
                <button
                  type="button"
                  class="btn-test"
                  :disabled="!localServices.p2tEnabled || connectionStatus.p2t === 'testing'"
                  @click="testConnection('p2t')"
                >
                  {{ $t('settings.testConnection') }}
                </button>
                <span class="connection-status" :class="connectionStatus.p2t">
                  <template v-if="connectionStatus.p2t === 'testing'">{{ $t('settings.testing') }}</template>
                  <template v-else-if="connectionStatus.p2t === 'ok'">{{ $t('settings.connectionOk') }}</template>
                  <template v-else-if="connectionStatus.p2t === 'fail'">{{ $t('settings.connectionFailed') }}</template>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="dialog-footer">
          <button class="btn-reset" @click="resetDefaults">{{ $t('settings.resetDefaults') }}</button>
          <div class="footer-actions">
            <button class="btn-cancel" @click="cancel">{{ $t('common.cancel') }}</button>
            <button class="btn-save" @click="saveSettings">{{ $t('common.save') }}</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: var(--color-bg-secondary);
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.dialog-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  font-size: 20px;
  color: var(--color-text-muted);
  cursor: pointer;
  border-radius: 4px;
}

.close-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text);
}

.tabs {
  display: flex;
  padding: 0 20px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
}

.tab {
  padding: 12px 16px;
  border: none;
  background: none;
  font-size: 13px;
  color: var(--color-text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}

.tab:hover {
  color: var(--color-text-secondary);
}

.tab.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  background: var(--color-bg-secondary);
}

.dialog-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: var(--color-bg-secondary);
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.setting-group h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.setting-row label {
  flex: 1;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.setting-row input[type='checkbox'] {
  appearance: none;
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  cursor: pointer;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  position: relative;
  flex-shrink: 0;
}

.setting-row input[type='checkbox']:checked {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.setting-row input[type='checkbox']:checked::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 5px;
  height: 9px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.setting-row input[type='checkbox']:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.setting-row input[type='checkbox']:hover {
  border-color: var(--color-primary);
}

.setting-row input[type='number'],
.setting-row select {
  width: 120px;
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 13px;
  background: var(--color-bg-tertiary);
  color: var(--color-text);
}

.setting-row input[type='number']:focus,
.setting-row select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.setting-row input[type='text'].endpoint-input {
  flex: 1;
  min-width: 200px;
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 13px;
  background: var(--color-bg-tertiary);
  color: var(--color-text);
}

.setting-row input[type='text'].endpoint-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.setting-row input[type='text'].endpoint-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.setting-row input[type='text'].endpoint-input.invalid {
  border-color: var(--color-error);
}

.settings-hint {
  margin: 0 0 4px;
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.setting-error {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--color-error);
}

.setting-row input[type='number'].invalid {
  border-color: var(--color-error);
}

.connection-row {
  gap: 10px;
}

.btn-test {
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg-tertiary);
  color: var(--color-text);
  font-size: 13px;
  cursor: pointer;
}

.btn-test:hover:not(:disabled) {
  border-color: var(--color-primary);
}

.btn-test:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.connection-status {
  font-size: 12px;
  color: var(--color-text-muted);
}

.connection-status.ok {
  color: var(--color-success);
}

.connection-status.fail {
  color: var(--color-error);
}

.setting-row select option {
  background: var(--color-bg-secondary);
  color: var(--color-text);
}

.hint {
  font-size: 12px;
  color: var(--color-text-muted);
  min-width: 50px;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);
  border-radius: 0 0 12px 12px;
}

.footer-actions {
  display: flex;
  gap: 10px;
}

.btn-reset {
  padding: 8px 14px;
  border: none;
  background: none;
  color: var(--color-text-muted);
  font-size: 13px;
  cursor: pointer;
}

.btn-reset:hover {
  color: var(--color-error);
}

.btn-cancel {
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  color: var(--color-text);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.btn-cancel:hover {
  background: var(--color-bg-tertiary);
}

.btn-save {
  padding: 8px 20px;
  border: none;
  background: var(--color-primary);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.btn-save:hover {
  background: var(--color-primary-hover);
}
</style>

<script setup>
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useConfigStore } from '@/stores/config'

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
  { id: 'services', label: t('settings.services') },
])

// Local copies for editing
const localGeneral = ref({ ...general.value })
const localEditor = ref({ ...editor.value })
const localTokenGame = ref({ ...tokenGame.value })
const localAnalysis = ref({ ...analysis.value })
const localLanguage = ref({ ...language.value })
const localServices = ref({ ...services.value })

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
      originalTheme.value = general.value.theme
      originalLocale.value = language.value.locale
    }
  }
)

// Save all settings
const saveSettings = () => {
  configStore.updateGeneral(localGeneral.value)
  configStore.updateEditor(localEditor.value)
  configStore.updateTokenGame(localTokenGame.value)
  configStore.updateAnalysis(localAnalysis.value)
  configStore.updateServices(localServices.value)
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

          <!-- Services Tab -->
          <div v-show="activeTab === 'services'" class="tab-content">
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
                />
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
                />
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

.setting-row input[type='number']:focus,
.setting-row select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
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

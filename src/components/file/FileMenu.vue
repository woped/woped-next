<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { usePetriNetStore } from '@/stores/petriNet'
import { fileService } from '@/services/file/fileService'
import { imageExporter } from '@/services/file/imageExporter'
import { FORMAT_NAMES, FILE_EXTENSIONS } from '@/types/file-formats'
import { templates, categories, getTemplatesByCategory } from '@/services/templates/petriNetTemplates'

const { t } = useI18n()
const store = usePetriNetStore()
const { net, nets, breadcrumb } = storeToRefs(store)

// Get the main net (first in breadcrumb) and all subnets
const getMainNetAndSubNets = () => {
  const mainNetId = breadcrumb.value[0]
  const mainNet = nets.value[mainNetId]
  
  // Collect all subnets
  const subNets = new Map()
  for (const [id, netDef] of Object.entries(nets.value)) {
    if (id !== mainNetId) {
      subNets.set(id, netDef)
    }
  }
  
  return { mainNet, subNets }
}

// Menu state
const showMenu = ref(false)
const showTemplates = ref(false)
const isLoading = ref(false)
const error = ref('')

// Export options
const includeLayout = ref(true)

// Template categories with translated names
const templateCategories = computed(() => [
  { id: 'basic', label: t('templates.categoryBasic') },
  { id: 'patterns', label: t('templates.categoryPatterns') },
  { id: 'workflow', label: t('templates.categoryWorkflow') },
])

// Close menu when clicking outside
const handleClickOutside = (e) => {
  if (!e.target.closest('.file-menu')) {
    showMenu.value = false
    showTemplates.value = false
  }
}

// Load a template
const loadTemplate = (templateId) => {
  const template = templates.find(t => t.id === templateId)
  if (template) {
    const net = template.create()
    store.loadNet(net)
  }
  showMenu.value = false
  showTemplates.value = false
}

// New file
const handleNew = () => {
  if (confirm('Create a new empty net? Unsaved changes will be lost.')) {
    store.newNet()
  }
  showMenu.value = false
}

// Open file
const handleOpen = async () => {
  showMenu.value = false
  error.value = ''
  
  const file = await fileService.openFilePicker('.pnml,.json')
  if (!file) return
  
  isLoading.value = true
  try {
    const result = await fileService.importFile(file)
    
    if (result.success && result.net) {
      // If there are subNets, load them all together
      if (result.subNets && result.subNets.size > 0) {
        const allNets = { [result.net.id]: result.net }
        result.subNets.forEach((subNet, id) => {
          allNets[id] = subNet
        })
        store.loadNets(allNets, result.net.id)
      } else {
        store.loadNet(result.net)
      }
      
      if (result.warnings.length > 0) {
        console.warn('Import warnings:', result.warnings)
      }
    } else {
      error.value = result.errors.map(e => e.message).join('\n')
      alert('Import failed:\n' + error.value)
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Unknown error'
    alert('Import error: ' + error.value)
  } finally {
    isLoading.value = false
  }
}

// Save as PNML
const handleSavePNML = async () => {
  showMenu.value = false
  
  try {
    const { mainNet, subNets } = getMainNetAndSubNets()
    await fileService.exportToFile(mainNet, {
      format: 'pnml',
      includeLayout: includeLayout.value,
      includeMetadata: true,
      filename: `${mainNet.name}.pnml`,
    }, subNets)
  } catch (e) {
    alert('Export error: ' + (e instanceof Error ? e.message : 'Unknown error'))
  }
}

// Save as JSON
const handleSaveJSON = async () => {
  showMenu.value = false
  
  try {
    const { mainNet, subNets } = getMainNetAndSubNets()
    await fileService.exportToFile(mainNet, {
      format: 'json',
      includeLayout: includeLayout.value,
      includeMetadata: true,
      filename: `${mainNet.name}.json`,
    }, subNets)
  } catch (e) {
    alert('Export error: ' + (e instanceof Error ? e.message : 'Unknown error'))
  }
}

// Export as SVG
const handleExportSVG = async () => {
  showMenu.value = false
  
  try {
    const svg = imageExporter.exportSVG(net.value)
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    downloadBlob(blob, `${net.value.name}.svg`)
  } catch (e) {
    alert('Export error: ' + (e instanceof Error ? e.message : 'Unknown error'))
  }
}

// Export as PNG
const handleExportPNG = async () => {
  showMenu.value = false
  
  isLoading.value = true
  try {
    const blob = await imageExporter.exportPNG(net.value, 2)
    downloadBlob(blob, `${net.value.name}.png`)
  } catch (e) {
    alert('Export error: ' + (e instanceof Error ? e.message : 'Unknown error'))
  } finally {
    isLoading.value = false
  }
}

// Helper to download blob
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Toggle menu
const toggleMenu = () => {
  showMenu.value = !showMenu.value
}
</script>

<template>
  <div class="file-menu" @click.stop>
    <button 
      class="menu-trigger"
      :class="{ active: showMenu }"
      @click="toggleMenu"
    >
      <span class="icon">📁</span>
      <span class="label">{{ $t('menu.file') }}</span>
      <span class="arrow">▾</span>
    </button>

    <div v-if="showMenu" class="menu-dropdown">
      <button class="menu-item" @click="handleNew">
        <span class="item-icon">📄</span>
        <span class="item-label">{{ $t('menu.new') }}</span>
        <span class="item-shortcut">Ctrl+N</span>
      </button>

      <button class="menu-item" @click="handleOpen" :disabled="isLoading">
        <span class="item-icon">📂</span>
        <span class="item-label">{{ $t('menu.open') }}...</span>
        <span class="item-shortcut">Ctrl+O</span>
      </button>

      <!-- Templates Submenu -->
      <div class="menu-item-with-submenu" @mouseenter="showTemplates = true" @mouseleave="showTemplates = false">
        <button class="menu-item">
          <span class="item-icon">📋</span>
          <span class="item-label">{{ $t('menu.templates') }}</span>
          <span class="submenu-arrow">▶</span>
        </button>
        
        <div v-if="showTemplates" class="submenu">
          <template v-for="category in templateCategories" :key="category.id">
            <div class="submenu-category">{{ category.label }}</div>
            <button 
              v-for="tmpl in getTemplatesByCategory(category.id)" 
              :key="tmpl.id"
              class="menu-item"
              @click="loadTemplate(tmpl.id)"
              :title="$t(tmpl.descriptionKey)"
            >
              <span class="item-label">{{ $t(tmpl.nameKey) }}</span>
            </button>
          </template>
        </div>
      </div>

      <div class="menu-separator"></div>

      <button class="menu-item" @click="handleSavePNML">
        <span class="item-icon">💾</span>
        <span class="item-label">{{ $t('menu.save') }} (PNML)</span>
        <span class="item-shortcut">Ctrl+S</span>
      </button>

      <button class="menu-item" @click="handleSaveJSON">
        <span class="item-icon">💾</span>
        <span class="item-label">{{ $t('menu.save') }} (JSON)</span>
      </button>

      <div class="menu-separator"></div>

      <button class="menu-item" @click="handleExportSVG">
        <span class="item-icon">🖼️</span>
        <span class="item-label">{{ $t('menu.exportSvg') }}</span>
      </button>

      <button class="menu-item" @click="handleExportPNG" :disabled="isLoading">
        <span class="item-icon">🖼️</span>
        <span class="item-label">{{ $t('menu.exportPng') }}</span>
      </button>

      <div class="menu-separator"></div>

      <label class="menu-checkbox">
        <input type="checkbox" v-model="includeLayout" />
        <span>{{ $t('menu.includeLayout') }}</span>
      </label>
    </div>
  </div>
</template>

<style scoped>
.file-menu {
  position: relative;
}

.menu-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid transparent;
  border-radius: 6px;
  background-color: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.menu-trigger:hover,
.menu-trigger.active {
  background-color: var(--color-bg-tertiary);
  border-color: var(--color-border);
}

.menu-trigger .icon {
  font-size: 16px;
}

.menu-trigger .arrow {
  font-size: 10px;
  margin-left: 2px;
}

.menu-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  min-width: 220px;
  padding: 4px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background-color: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.1s ease;
  text-align: left;
}

.menu-item:hover:not(:disabled) {
  background-color: var(--color-bg-tertiary);
}

.menu-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.item-icon {
  width: 20px;
  text-align: center;
}

.item-label {
  flex: 1;
}

.item-shortcut {
  font-size: 11px;
  color: var(--color-text-muted);
}

.menu-separator {
  height: 1px;
  background-color: var(--color-border);
  margin: 4px 0;
}

.menu-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.menu-checkbox input {
  cursor: pointer;
}

/* Submenu styles */
.menu-item-with-submenu {
  position: relative;
}

.menu-item-with-submenu .menu-item {
  width: 100%;
}

.submenu-arrow {
  font-size: 10px;
  color: var(--color-text-muted);
}

.submenu {
  position: absolute;
  left: 100%;
  top: 0;
  margin-left: 2px;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  padding: 4px 0;
  z-index: 101;
}

.submenu-category {
  padding: 6px 12px 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-top: 1px solid var(--color-border);
  margin-top: 4px;
}

.submenu-category:first-child {
  border-top: none;
  margin-top: 0;
}

.submenu .menu-item {
  padding: 6px 12px;
}

.submenu .menu-item .item-label {
  font-size: 12px;
}
</style>

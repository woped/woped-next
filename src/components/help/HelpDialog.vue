<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHelpStore } from '@/stores/help'
import { HELP_CATEGORIES } from '@/types/help'

const { t } = useI18n()
const helpStore = useHelpStore()

const WOPED_WEBSITE_URL = 'https://woped.dhbw-karlsruhe.de'

const searchInput = ref(null)

const categories = computed(() => HELP_CATEGORIES)

const articlesByCategory = computed(() => helpStore.filteredArticlesByCategory)

const hasSearchResults = computed(() => helpStore.filteredArticles.length > 0)

const activeArticle = computed(() => helpStore.activeArticle)

const articleContent = computed(() => {
  if (!activeArticle.value) return ''
  return t(activeArticle.value.contentKey)
})

const articleTitle = computed(() => {
  if (!activeArticle.value) return ''
  return t(activeArticle.value.titleKey)
})

const hasTour = computed(() => !!activeArticle.value?.tourId)

function selectArticle(articleId) {
  helpStore.setArticle(articleId)
}

function close() {
  helpStore.closeDialog()
}

function handleKeydown(e) {
  if (e.key === 'Escape') {
    close()
  }
}

function startArticleTour() {
  if (activeArticle.value?.tourId) {
    helpStore.startTour(activeArticle.value.tourId)
  }
}

function onSearchInput(e) {
  helpStore.setSearch(e.target.value)
}

function clearSearch() {
  helpStore.setSearch('')
  searchInput.value?.focus()
}

watch(
  () => helpStore.dialogOpen,
  async (open) => {
    if (open) {
      await nextTick()
      searchInput.value?.focus()
    }
  }
)

function renderContent(text) {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Tables: detect lines starting with |
  html = html.replace(/((?:^\|.+\|$\n?)+)/gm, (tableBlock) => {
    const rows = tableBlock.trim().split('\n').filter(r => r.trim())
    if (rows.length < 2) return tableBlock

    const parseRow = (row) =>
      row.split('|').filter((_, i, a) => i > 0 && i < a.length - 1).map(c => c.trim())

    const headerCells = parseRow(rows[0])
    const isSeparator = (row) => /^\|[\s\-:|]+\|$/.test(row.trim())
    const dataStartIndex = isSeparator(rows[1]) ? 2 : 1

    let table = '<table class="help-table"><thead><tr>'
    headerCells.forEach(c => { table += `<th>${c}</th>` })
    table += '</tr></thead><tbody>'
    for (let i = dataStartIndex; i < rows.length; i++) {
      const cells = parseRow(rows[i])
      table += '<tr>'
      cells.forEach(c => { table += `<td>${c}</td>` })
      table += '</tr>'
    }
    table += '</tbody></table>'
    return table
  })

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  // Italic
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
  // Inline code
  html = html.replace(/`(.+?)`/g, '<code>$1</code>')

  // Paragraphs and line breaks
  const blocks = html.split('\n\n')
  html = blocks.map(block => {
    block = block.trim()
    if (!block) return ''
    if (block.startsWith('<table')) return block
    // List items
    if (/^- /.test(block) || /^\n- /.test(block)) {
      const items = block.split('\n').filter(l => l.trim())
      const listItems = items.map(item => {
        const content = item.replace(/^- /, '')
        return `<li>${content}</li>`
      }).join('')
      return `<ul>${listItems}</ul>`
    }
    return `<p>${block.replace(/\n/g, '<br>')}</p>`
  }).join('')

  return html
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="helpStore.dialogOpen"
      class="help-overlay"
      @click.self="close"
      @keydown="handleKeydown"
    >
      <div class="help-dialog" role="dialog" aria-labelledby="help-title">
        <!-- Header -->
        <div class="help-header">
          <a
            class="help-logo-link"
            :href="WOPED_WEBSITE_URL"
            target="_blank"
            rel="noopener noreferrer"
            :title="t('common.visitWopedWebsite')"
            :aria-label="t('common.visitWopedWebsite')"
          >
            <img class="help-logo" src="/woped-logo.svg" alt="WoPeD" />
          </a>
          <h2 id="help-title">{{ $t('help.title') }}</h2>
          <div class="help-search">
            <span class="search-icon">🔍</span>
            <input
              ref="searchInput"
              type="text"
              :placeholder="$t('help.search')"
              :value="helpStore.searchQuery"
              @input="onSearchInput"
            />
            <button
              v-if="helpStore.searchQuery"
              class="search-clear"
              @click="clearSearch"
            >×</button>
          </div>
          <button class="close-btn" @click="close" :aria-label="$t('common.close')">×</button>
        </div>

        <div class="help-body">
          <!-- Sidebar navigation -->
          <nav class="help-sidebar">
            <!-- Articles by category -->
            <template v-for="cat in categories" :key="cat.id">
              <div
                v-if="articlesByCategory[cat.id]?.length"
                class="sidebar-section"
              >
                <div class="section-header">
                  <span class="cat-icon">{{ cat.icon }}</span>
                  {{ $t(cat.titleKey) }}
                </div>
                <button
                  v-for="article in articlesByCategory[cat.id]"
                  :key="article.id"
                  :class="['article-btn', { active: helpStore.activeArticleId === article.id }]"
                  @click="selectArticle(article.id)"
                >
                  <span class="article-icon">{{ article.icon }}</span>
                  <span>{{ $t(article.titleKey) }}</span>
                </button>
              </div>
            </template>

            <div
              v-if="helpStore.searchQuery && !hasSearchResults"
              class="no-results"
            >
              {{ $t('help.searchNoResults', { query: helpStore.searchQuery }) }}
            </div>

            <!-- Guided Tours section (bottom) -->
            <div class="sidebar-divider"></div>

            <div class="sidebar-section tours-section">
              <div class="section-header">
                <span class="cat-icon">🎓</span>
                {{ $t('help.guidedTours') }}
              </div>
              <button
                v-for="tour in helpStore.tours"
                :key="tour.id"
                class="tour-btn"
                @click="helpStore.startTour(tour.id)"
              >
                <span class="tour-icon">▶</span>
                <span>{{ $t(tour.titleKey) }}</span>
              </button>
            </div>
          </nav>

          <!-- Content area -->
          <div class="help-content">
            <template v-if="activeArticle">
              <div class="article-header">
                <h3>
                  <span class="article-title-icon">{{ activeArticle.icon }}</span>
                  {{ articleTitle }}
                </h3>
                <button
                  v-if="hasTour"
                  class="tour-start-btn"
                  @click="startArticleTour"
                >
                  <span>▶</span> {{ $t('help.startTour') }}
                </button>
              </div>
              <div class="article-body" v-html="renderContent(articleContent)"></div>
            </template>
            <template v-else>
              <div class="no-article">
                <span class="no-article-icon">📖</span>
                <p>{{ $t('help.backToOverview') }}</p>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.help-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.help-dialog {
  background: var(--color-bg-secondary);
  border-radius: 12px;
  width: 90%;
  max-width: 900px;
  height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

/* Header */
.help-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
  flex-shrink: 0;
}

.help-logo-link {
  display: flex;
  flex-shrink: 0;
  line-height: 0;
  border-radius: 4px;
  transition: opacity 0.15s ease;
}

.help-logo-link:hover {
  opacity: 0.85;
}

.help-logo {
  height: 28px;
  width: auto;
  display: block;
  border-radius: 4px;
}

.help-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
}

.help-search {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  transition: border-color 0.15s;
}

.help-search:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.search-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.help-search input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  color: var(--color-text);
  outline: none;
}

.help-search input::placeholder {
  color: var(--color-text-muted);
}

.search-clear {
  width: 20px;
  height: 20px;
  border: none;
  background: var(--color-bg-tertiary);
  color: var(--color-text-muted);
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.search-clear:hover {
  background: var(--color-border);
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
  flex-shrink: 0;
}

.close-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text);
}

/* Body */
.help-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Sidebar */
.help-sidebar {
  width: 260px;
  flex-shrink: 0;
  overflow-y: auto;
  border-right: 1px solid var(--color-border);
  background: var(--color-bg);
  padding: 12px 0;
}

.sidebar-section {
  padding: 0 12px;
  margin-bottom: 8px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.cat-icon {
  font-size: 13px;
}

.article-btn,
.tour-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 10px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  border-radius: 6px;
  text-align: left;
  transition: all 0.1s;
}

.article-btn:hover,
.tour-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text);
}

.article-btn.active {
  background: var(--color-primary);
  color: #ffffff;
}

.article-icon {
  font-size: 14px;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.tours-section .tour-btn {
  color: var(--color-primary);
  font-weight: 500;
}

.tour-icon {
  font-size: 12px;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.sidebar-divider {
  height: 1px;
  background: var(--color-border);
  margin: 8px 12px;
}

.no-results {
  padding: 16px;
  text-align: center;
  font-size: 13px;
  color: var(--color-text-muted);
}

/* Content */
.help-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
}

.article-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
}

.article-header h3 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 10px;
}

.article-title-icon {
  font-size: 24px;
}

.tour-start-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--color-primary);
  background: transparent;
  color: var(--color-primary);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.tour-start-btn:hover {
  background: var(--color-primary);
  color: #ffffff;
}

/* Article body typography */
.article-body {
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text-secondary);
}

.article-body :deep(p) {
  margin: 0 0 12px;
}

.article-body :deep(strong) {
  color: var(--color-text);
  font-weight: 600;
}

.article-body :deep(em) {
  font-style: italic;
}

.article-body :deep(code) {
  background: var(--color-bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.article-body :deep(ul) {
  margin: 0 0 12px;
  padding-left: 20px;
}

.article-body :deep(li) {
  margin-bottom: 4px;
}

.article-body :deep(.help-table) {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  font-size: 13px;
}

.article-body :deep(.help-table th) {
  text-align: left;
  padding: 8px 12px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  font-weight: 600;
  color: var(--color-text);
}

.article-body :deep(.help-table td) {
  padding: 8px 12px;
  border: 1px solid var(--color-border);
}

.article-body :deep(.help-table tr:hover td) {
  background: var(--color-bg-tertiary);
}

/* No article state */
.no-article {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-muted);
}

.no-article-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.no-article p {
  font-size: 15px;
}
</style>

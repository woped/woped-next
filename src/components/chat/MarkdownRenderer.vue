<script setup>
import { computed, ref, watch, nextTick, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const { t } = useI18n()

const props = defineProps({
  source: { type: String, required: true },
})

const containerRef = ref(null)

marked.setOptions({ gfm: true, breaks: true })

const sanitizedHtml = computed(() =>
  DOMPurify.sanitize(marked.parse(props.source, { async: false })),
)

function getCodeBlockElements(container) {
  const preBlocks = [...container.querySelectorAll('pre')]
  if (preBlocks.length > 0) return preBlocks

  return [...container.querySelectorAll('code')].filter(
    (code) => !code.closest('p') && (code.textContent ?? '').includes('\n'),
  )
}

function createCopyButton() {
  const button = document.createElement('button')
  const label = t('chat.copyCode')
  button.type = 'button'
  button.className = 'copy-code-btn'
  button.title = label
  button.setAttribute('aria-label', label)
  button.textContent = label
  return button
}

function attachCopyButtons() {
  const container = containerRef.value
  if (!container) return

  for (const block of getCodeBlockElements(container)) {
    if (block.parentElement?.classList.contains('code-block-wrapper')) continue

    const wrapper = document.createElement('div')
    wrapper.className = 'code-block-wrapper'
    block.parentNode?.insertBefore(wrapper, block)
    wrapper.append(block, createCopyButton())
  }
}

watch(() => props.source, () => nextTick(attachCopyButtons))
onMounted(() => nextTick(attachCopyButtons))

async function handleContainerClick(event) {
  const button = event.target.closest('.copy-code-btn')
  if (!button || !containerRef.value?.contains(button)) return

  const code =
    button.closest('.code-block-wrapper')?.querySelector('code')?.textContent ??
    button.closest('.code-block-wrapper')?.querySelector('pre')?.textContent ??
    ''
  if (!code) return

  try {
    await navigator.clipboard.writeText(code)
    const originalLabel = button.textContent
    button.textContent = t('chat.copied')
    setTimeout(() => {
      button.textContent = originalLabel
    }, 2000)
  } catch {
    // Clipboard unavailable
  }
}
</script>

<template>
  <div
    ref="containerRef"
    class="markdown-body"
    v-html="sanitizedHtml"
    @click="handleContainerClick"
  />
</template>

<style scoped>
.markdown-body {
  line-height: 1.5;
  word-break: break-word;
}

.markdown-body :deep(p) {
  margin: 0 0 0.5em;
}

.markdown-body :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 0.25em 0 0.5em;
  padding-left: 1.25em;
}

.markdown-body :deep(li) {
  margin: 0.15em 0;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3) {
  margin: 0.5em 0 0.25em;
  font-weight: 600;
  line-height: 1.3;
}

.markdown-body :deep(h1) { font-size: 1.15em; }
.markdown-body :deep(h2) { font-size: 1.1em; }
.markdown-body :deep(h3) { font-size: 1.05em; }

.markdown-body :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.9em;
  padding: 0.1em 0.35em;
  border-radius: 4px;
  background: color-mix(in srgb, currentColor 12%, transparent);
}

.markdown-body :deep(.code-block-wrapper) {
  position: relative;
  margin: 0.5em 0;
}

.markdown-body :deep(pre),
.markdown-body :deep(.code-block-wrapper > code) {
  margin: 0;
  padding: 28px 10px 8px;
  border-radius: 6px;
  overflow-x: auto;
  background: color-mix(in srgb, currentColor 10%, transparent);
  font-size: 0.85em;
}

.markdown-body :deep(pre code) {
  padding: 0;
  background: none;
}

.markdown-body :deep(.copy-code-btn) {
  position: absolute;
  top: 6px;
  right: 6px;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 500;
  border-radius: 4px;
  border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
  background: color-mix(in srgb, currentColor 8%, transparent);
  color: inherit;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
}

.markdown-body :deep(.code-block-wrapper:hover .copy-code-btn),
.markdown-body :deep(.copy-code-btn:focus-visible) {
  opacity: 1;
}

.markdown-body :deep(.copy-code-btn:hover) {
  background: color-mix(in srgb, currentColor 15%, transparent);
}

.markdown-body :deep(a) {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.markdown-body :deep(blockquote) {
  margin: 0.5em 0;
  padding-left: 0.75em;
  border-left: 3px solid color-mix(in srgb, currentColor 30%, transparent);
  opacity: 0.9;
}
</style>

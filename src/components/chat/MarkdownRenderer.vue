<script setup>
import { computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const props = defineProps({
  source: { type: String, required: true },
})

// Configure marked once: GFM = GitHub-style tables/lists, breaks = newline → <br>
marked.setOptions({
  gfm: true,
  breaks: true,
})

const sanitizedHtml = computed(() => {
  const rawHtml = marked.parse(props.source, { async: false })
  return DOMPurify.sanitize(rawHtml)
})
</script>

<template>
  <div class="markdown-body" v-html="sanitizedHtml" />
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

.markdown-body :deep(pre) {
  margin: 0.5em 0;
  padding: 8px 10px;
  border-radius: 6px;
  overflow-x: auto;
  background: color-mix(in srgb, currentColor 10%, transparent);
}

.markdown-body :deep(pre code) {
  padding: 0;
  background: none;
  font-size: 0.85em;
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

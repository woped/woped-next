import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js/lib/core'
import type { LanguageFn } from 'highlight.js'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import python from 'highlight.js/lib/languages/python'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'

const LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  sh: 'bash',
  html: 'xml',
  pnml: 'xml',
}

const registerLanguage = (name: string, language: unknown) => {
  hljs.registerLanguage(name, language as LanguageFn)
}

registerLanguage('bash', bash)
registerLanguage('css', css)
registerLanguage('javascript', javascript)
registerLanguage('json', json)
registerLanguage('python', python)
registerLanguage('sql', sql)
registerLanguage('typescript', typescript)
registerLanguage('xml', xml)

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function resolveLanguage(lang?: string | null): string | null {
  if (!lang) return null
  const normalized = lang.trim().toLowerCase()
  const resolved = LANGUAGE_ALIASES[normalized] ?? normalized
  return hljs.getLanguage(resolved) ? resolved : null
}

marked.use({
  gfm: true,
  breaks: true,
  renderer: {
    code({ text, lang }) {
      const language = resolveLanguage(lang)
      if (language) {
        const highlighted = hljs.highlight(text, { language }).value
        return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`
      }
      return `<pre><code>${escapeHtml(text)}</code></pre>`
    },
  },
})

const SANITIZE_CONFIG = { ADD_ATTR: ['class'] }

export function renderMarkdownHtml(source: string): string {
  const html = marked.parse(source, { async: false })
  return DOMPurify.sanitize(html, SANITIZE_CONFIG)
}

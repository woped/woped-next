import { describe, expect, it } from 'vitest'
import { renderMarkdownHtml } from '@/utils/markdownHighlight'

describe('markdownHighlight', () => {
  it('highlights JavaScript fenced blocks', () => {
    const html = renderMarkdownHtml('```js\nconst value = 1\n```')
    expect(html).toContain('class="hljs language-javascript"')
    expect(html).toContain('hljs-keyword')
    expect(html).toContain('const')
  })

  it('leaves fenced blocks without language unhighlighted', () => {
    const html = renderMarkdownHtml('```\nplain text\n```')
    expect(html).not.toContain('hljs')
    expect(html).toContain('plain text')
  })

  it('keeps inline code unhighlighted', () => {
    const html = renderMarkdownHtml('Use `npm run dev`')
    expect(html).not.toContain('hljs-keyword')
    expect(html).toContain('npm run dev')
  })
})

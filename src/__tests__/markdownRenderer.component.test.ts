import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import MarkdownRenderer from '@/components/chat/MarkdownRenderer.vue'
import { i18n } from '@/i18n'

function mountMarkdown(source: string) {
  return mount(MarkdownRenderer, {
    props: { source },
    global: { plugins: [i18n] },
  })
}

describe('MarkdownRenderer', () => {
  it('renders the markdown-body container', () => {
    const wrapper = mountMarkdown('Hello')
    expect(wrapper.find('.markdown-body').exists()).toBe(true)
  })

  it('renders empty source without errors', () => {
    const wrapper = mountMarkdown('')
    expect(wrapper.find('.markdown-body').exists()).toBe(true)
    expect(wrapper.text()).toBe('')
  })

  describe('text formatting', () => {
    it('renders bold text', () => {
      const wrapper = mountMarkdown('**hello**')
      expect(wrapper.find('strong').text()).toBe('hello')
    })

    it('renders italic text', () => {
      const wrapper = mountMarkdown('*emphasis*')
      expect(wrapper.find('em').text()).toBe('emphasis')
    })

    it('renders heading text', () => {
      const wrapper = mountMarkdown('## Section title')
      expect(wrapper.text()).toContain('Section title')
      expect(wrapper.html()).not.toContain('##')
    })

    it('renders plain text without markdown syntax', () => {
      const wrapper = mountMarkdown('Just plain text')
      expect(wrapper.text()).toBe('Just plain text')
    })
  })

  describe('lists', () => {
    it('renders unordered lists', () => {
      const wrapper = mountMarkdown('- first\n- second')
      const items = wrapper.findAll('li')
      expect(items).toHaveLength(2)
      expect(items[0].text()).toBe('first')
      expect(items[1].text()).toBe('second')
    })

    it('renders ordered lists', () => {
      const wrapper = mountMarkdown('1. first\n2. second')
      const items = wrapper.findAll('li')
      expect(items).toHaveLength(2)
      expect(items[0].text()).toBe('first')
      expect(items[1].text()).toBe('second')
    })
  })

  describe('code', () => {
    it('renders inline code', () => {
      const wrapper = mountMarkdown('Use `npm run dev`')
      expect(wrapper.find('code').text()).toBe('npm run dev')
    })

    it('renders fenced code block content', () => {
      const wrapper = mountMarkdown('```\nconst x = 1\n```')
      expect(wrapper.find('code').text()).toContain('const x = 1')
    })

    it('does not add copy button for inline code', async () => {
      const wrapper = mountMarkdown('Use `npm run dev`')
      await flushPromises()
      expect(wrapper.find('.copy-code-btn').exists()).toBe(false)
    })
  })

  describe('copy button', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
        configurable: true,
      })
    })

    it('adds copy button to fenced code blocks', async () => {
      const wrapper = mountMarkdown('```\nconst x = 1\n```')
      await flushPromises()
      expect(wrapper.find('.copy-code-btn').exists()).toBe(true)
      expect(wrapper.find('.copy-code-btn').text()).toBe('Copy')
    })

    it('copies code block content on click', async () => {
      const wrapper = mountMarkdown('```\nconst x = 1\n```')
      await flushPromises()
      await wrapper.find('.copy-code-btn').trigger('click')
      await flushPromises()
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const x = 1\n')
    })
  })

  describe('links', () => {
    it('renders links with href and label', () => {
      const wrapper = mountMarkdown('[Docs](https://example.com)')
      const link = wrapper.find('a')
      expect(link.attributes('href')).toBe('https://example.com')
      expect(link.text()).toBe('Docs')
    })
  })

  describe('security', () => {
    it('strips script tags to prevent XSS', () => {
      const wrapper = mountMarkdown('<script>alert("xss")</script>')
      expect(wrapper.html()).not.toContain('<script')
    })
  })
})

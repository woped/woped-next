/// <reference types="vite/client" />
const PREFIX = '[Chat]'
const ENABLED = import.meta.env.DEV

function formatArgs(args: Record<string, unknown>): string {
  const entries = Object.entries(args)
  if (entries.length === 0) return '{}'
  const shortened = entries.map(([k, v]) => {
    const str = typeof v === 'string' && v.length > 80 ? v.substring(0, 80) + '...' : String(v)
    return `${k}: ${str}`
  })
  return `{ ${shortened.join(', ')} }`
}

export const chatLogger = {
  message(direction: 'sent' | 'received', preview: string) {
    if (!ENABLED) return
    const icon = direction === 'sent' ? '➡️' : '⬅️'
    console.debug(`${PREFIX} ${icon} ${direction}: ${preview.substring(0, 100)}`)
  },

  toolCall(name: string, args: Record<string, unknown>) {
    if (!ENABLED) return
    console.debug(`${PREFIX} 🔧 Tool call: ${name}(${formatArgs(args)})`)
  },

  toolResult(name: string, resultPreview: string) {
    if (!ENABLED) return
    console.debug(`${PREFIX} ✅ Tool result [${name}]: ${resultPreview.substring(0, 120)}`)
  },

  apiRequest(model: string, messageCount: number, hasTools: boolean) {
    if (!ENABLED) return
    console.debug(`${PREFIX} 🌐 API request → model=${model}, messages=${messageCount}, tools=${hasTools}`)
  },

  apiResponse(finishReason: string, hasToolCalls: boolean) {
    if (!ENABLED) return
    console.debug(`${PREFIX} 🌐 API response ← finish=${finishReason}, toolCalls=${hasToolCalls}`)
  },

  command(type: string, params: Record<string, unknown>) {
    if (!ENABLED) return
    console.debug(`${PREFIX} ⚡ Command: ${type}(${formatArgs(params)})`)
  },

  error(context: string, error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`${PREFIX} ❌ ${context}: ${msg}`)
  },

  warn(message: string) {
    console.warn(`${PREFIX} ⚠️ ${message}`)
  },
}

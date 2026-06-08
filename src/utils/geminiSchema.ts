/**
 * Gemini function-calling parameters use a JSON Schema subset that rejects
 * fields OpenAI accepts (e.g. additionalProperties) and requires array items
 * and object properties to be defined explicitly.
 */
export function sanitizeSchemaForGemini(
  schema: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(schema)) {
    if (key === 'additionalProperties' || key === '$schema') continue

    if (key === 'properties' && value && typeof value === 'object' && !Array.isArray(value)) {
      const sanitizedProps: Record<string, unknown> = {}
      for (const [propKey, propValue] of Object.entries(value as Record<string, unknown>)) {
        sanitizedProps[propKey] =
          propValue && typeof propValue === 'object' && !Array.isArray(propValue)
            ? sanitizeSchemaForGemini(propValue as Record<string, unknown>)
            : propValue
      }
      result[key] = sanitizedProps
      continue
    }

    if (
      (key === 'anyOf' || key === 'oneOf' || key === 'allOf') &&
      Array.isArray(value)
    ) {
      result[key] = value.map((entry) =>
        entry && typeof entry === 'object' && !Array.isArray(entry)
          ? sanitizeSchemaForGemini(entry as Record<string, unknown>)
          : entry,
      )
      continue
    }

    if (key === 'items' && value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizeSchemaForGemini(value as Record<string, unknown>)
      continue
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizeSchemaForGemini(value as Record<string, unknown>)
      continue
    }

    result[key] = value
  }

  if (result.type === 'array' && !result.items) {
    result.items = { type: 'string' }
  }

  if (result.type === 'object' && !result.properties) {
    result.properties = {}
  }

  return result
}

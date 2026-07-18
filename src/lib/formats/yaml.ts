import { load, dump, YAMLException } from 'js-yaml'

export function parseYAML(text: string): unknown {
  if (!text.trim()) throw new Error('Input is empty.')
  try {
    return load(text)
  } catch (e) {
    if (e instanceof YAMLException) {
      throw new Error(`YAML parse error — ${e.message}`)
    }
    throw e
  }
}

export function stringifyYAML(value: unknown): string {
  return dump(value, { indent: 2, lineWidth: 100, noRefs: true })
}

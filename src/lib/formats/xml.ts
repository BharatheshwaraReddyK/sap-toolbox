import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser'

const parserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  trimValues: true,
  parseTagValue: true,
  parseAttributeValue: true,
}

export function parseXML(text: string): unknown {
  if (!text.trim()) throw new Error('Input is empty.')
  const check = XMLValidator.validate(text)
  if (check !== true) {
    throw new Error(`XML parse error — ${check.err.msg} (line ${check.err.line})`)
  }
  const parser = new XMLParser(parserOptions)
  return parser.parse(text)
}

export function stringifyXML(value: unknown, pretty = true): string {
  const builder = new XMLBuilder({
    ...parserOptions,
    format: pretty,
    indentBy: '  ',
    suppressEmptyNode: false,
  })
  const xml = builder.build(value)
  return xml.trim()
}

export function validateXML(text: string): { valid: true } | { valid: false; message: string } {
  const check = XMLValidator.validate(text)
  if (check === true) return { valid: true }
  return { valid: false, message: `${check.err.msg} (line ${check.err.line}, col ${check.err.col})` }
}

/** Strip namespace prefixes from tag and attribute names, e.g. ns0:Foo -> Foo */
export function stripNamespaces(text: string): string {
  return text
    .replace(/<(\/?)[a-zA-Z0-9_.-]+:/g, '<$1')
    .replace(/\s[a-zA-Z0-9_.-]+:([a-zA-Z0-9_.-]+)=/g, ' $1=')
    .replace(/\sxmlns(:[a-zA-Z0-9_.-]+)?="[^"]*"/g, '')
}

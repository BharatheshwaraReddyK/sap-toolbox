export interface ToolEntry {
  path: string
  label: string
  code: string
  blurb: string
}

export interface ToolCategory {
  id: string
  title: string
  eyebrow: string
  tools: ToolEntry[]
}

export const registry: ToolCategory[] = [
  {
    id: 'convert',
    title: 'Convert',
    eyebrow: '01',
    tools: [
      { path: '/convert/xml-json', label: 'XML ⇄ JSON', code: 'XML/JSN', blurb: 'Round-trip between XML documents and JSON objects.' },
      { path: '/convert/csv-json', label: 'CSV ⇄ JSON', code: 'CSV/JSN', blurb: 'Rows to objects, and back again.' },
      { path: '/convert/csv-xml', label: 'CSV ⇄ XML', code: 'CSV/XML', blurb: 'Flatten hierarchical XML into rows, or the reverse.' },
      { path: '/convert/excel', label: 'Excel ⇄ JSON / CSV', code: 'XLS/JSN', blurb: 'Upload a workbook, export JSON, CSV, or a fresh .xlsx.' },
      { path: '/convert/yaml-json', label: 'YAML ⇄ JSON', code: 'YML/JSN', blurb: 'For config-heavy pipelines — Kubernetes, CI/CD, and friends.' },
      { path: '/convert/properties-json', label: '.properties ⇄ JSON', code: 'PROP/JSN', blurb: 'Java-style key=value files, nested via dotted keys.' },
      { path: '/convert/edi-json', label: 'EDI (X12/EDIFACT) ⇄ JSON', code: 'EDI/JSN', blurb: 'Segment/element/component structure, auto-detected separators.' },
    ],
  },
  {
    id: 'format',
    title: 'Format & validate',
    eyebrow: '02',
    tools: [
      { path: '/format/json', label: 'JSON formatter', code: 'JSN', blurb: 'Validate, beautify, minify, sort keys.' },
      { path: '/format/xml', label: 'XML formatter', code: 'XML', blurb: 'Validate well-formedness, beautify, strip namespaces.' },
      { path: '/format/csv', label: 'CSV normalizer', code: 'CSV', blurb: 'Check delimiter, headers, row length — re-emit clean.' },
      { path: '/format/yaml', label: 'YAML formatter', code: 'YML', blurb: 'Validate syntax and re-indent consistently.' },
      { path: '/format/edi', label: 'EDI formatter & validator', code: 'EDI', blurb: 'Segment viewer, envelope balance checks (ISA/IEA, UNB/UNZ, …).' },
    ],
  },
  {
    id: 'diff',
    title: 'Compare',
    eyebrow: '03',
    tools: [
      { path: '/diff/json', label: 'JSON diff', code: 'JSN Δ', blurb: 'Structural compare — added, removed, changed keys.' },
      { path: '/diff/xml', label: 'XML diff', code: 'XML Δ', blurb: 'Canonicalized structural compare, order-insensitive.' },
      { path: '/diff/csv', label: 'CSV diff', code: 'CSV Δ', blurb: 'Row-wise or key-wise, field-level change highlights.' },
    ],
  },
  {
    id: 'sap',
    title: 'SAP payload helpers',
    eyebrow: '04',
    tools: [
      { path: '/sap/idoc', label: 'IDoc viewer & converter', code: 'IDOC', blurb: 'Segment-aware XML → JSON, expandable tree explorer.' },
      { path: '/sap/odata', label: 'OData response beautifier', code: 'ODATA', blurb: 'Format Gateway payloads, surface entity shape.' },
      { path: '/sap/mapping', label: 'Mapping designer', code: 'MAP', blurb: 'Sketch source → target field mappings, test on a sample.' },
    ],
  },
]

export const allTools = registry.flatMap((c) => c.tools)

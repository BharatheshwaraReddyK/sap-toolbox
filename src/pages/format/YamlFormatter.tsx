import FormatPage from '../../components/FormatPage'
import { parseYAML, stringifyYAML } from '../../lib/formats/yaml'
import { stringifyJSON } from '../../lib/formats/json'

const sample = `apiVersion: apps/v1
kind: Deployment
metadata:
    name: sap-connector
spec:
    replicas: 2`

export default function YamlFormatter() {
  return (
    <FormatPage
      eyebrow="02 · format & validate"
      title="YAML formatter"
      description="Validate syntax and re-indent consistently. Minify renders the same document as compact JSON."
      tag="yaml"
      sample={sample}
      format={(text, minify) => {
        const parsed = parseYAML(text)
        return minify ? stringifyJSON(parsed, false) : stringifyYAML(parsed)
      }}
    />
  )
}

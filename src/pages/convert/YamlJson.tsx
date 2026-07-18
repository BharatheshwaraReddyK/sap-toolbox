import ConvertPage from '../../components/ConvertPage'
import { parseYAML, stringifyYAML } from '../../lib/formats/yaml'
import { parseJSON, stringifyJSON } from '../../lib/formats/json'

const yamlSample = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: sap-connector
spec:
  replicas: 2
  selector:
    matchLabels:
      app: sap-connector`

const jsonSample = `{
  "apiVersion": "apps/v1",
  "kind": "Deployment",
  "metadata": { "name": "sap-connector" },
  "spec": {
    "replicas": 2,
    "selector": { "matchLabels": { "app": "sap-connector" } }
  }
}`

export default function YamlJson() {
  return (
    <ConvertPage
      eyebrow="01 · convert"
      title="YAML ⇄ JSON"
      description="For config-heavy pipelines — Kubernetes manifests, CI/CD, and CPI resource bundles."
      formatA={{ name: 'YAML', tag: 'yaml', parse: parseYAML, stringify: stringifyYAML, sample: yamlSample }}
      formatB={{ name: 'JSON', tag: 'json', parse: parseJSON, stringify: (v) => stringifyJSON(v, true), sample: jsonSample }}
    />
  )
}

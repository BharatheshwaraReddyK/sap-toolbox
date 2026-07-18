import ConvertPage from '../../components/ConvertPage'
import { parseProperties, stringifyProperties } from '../../lib/formats/properties'
import { parseJSON, stringifyJSON } from '../../lib/formats/json'

const propsSample = `db.host=localhost
db.port=5432
db.credentials.user=sapuser
logging.level=INFO`

const jsonSample = `{
  "db": {
    "host": "localhost",
    "port": "5432",
    "credentials": { "user": "sapuser" }
  },
  "logging": { "level": "INFO" }
}`

export default function PropertiesJson() {
  return (
    <ConvertPage
      eyebrow="01 · convert"
      title=".properties ⇄ JSON"
      description="Java-style key=value configuration files, with dotted keys unfolded into nested objects."
      formatA={{ name: '.properties', tag: 'properties', parse: parseProperties, stringify: stringifyProperties, sample: propsSample }}
      formatB={{ name: 'JSON', tag: 'json', parse: parseJSON, stringify: (v) => stringifyJSON(v, true), sample: jsonSample }}
    />
  )
}

import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'

import XmlJson from './pages/convert/XmlJson'
import CsvJson from './pages/convert/CsvJson'
import CsvXml from './pages/convert/CsvXml'
import Excel from './pages/convert/Excel'
import YamlJson from './pages/convert/YamlJson'
import PropertiesJson from './pages/convert/PropertiesJson'

import JsonFormatter from './pages/format/JsonFormatter'
import XmlFormatter from './pages/format/XmlFormatter'
import CsvFormatter from './pages/format/CsvFormatter'
import YamlFormatter from './pages/format/YamlFormatter'

import JsonDiff from './pages/diff/JsonDiff'
import XmlDiff from './pages/diff/XmlDiff'
import CsvDiff from './pages/diff/CsvDiff'

import Idoc from './pages/sap/Idoc'
import OData from './pages/sap/OData'
import MappingDesigner from './pages/sap/MappingDesigner'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />

        <Route path="/convert/xml-json" element={<XmlJson />} />
        <Route path="/convert/csv-json" element={<CsvJson />} />
        <Route path="/convert/csv-xml" element={<CsvXml />} />
        <Route path="/convert/excel" element={<Excel />} />
        <Route path="/convert/yaml-json" element={<YamlJson />} />
        <Route path="/convert/properties-json" element={<PropertiesJson />} />

        <Route path="/format/json" element={<JsonFormatter />} />
        <Route path="/format/xml" element={<XmlFormatter />} />
        <Route path="/format/csv" element={<CsvFormatter />} />
        <Route path="/format/yaml" element={<YamlFormatter />} />

        <Route path="/diff/json" element={<JsonDiff />} />
        <Route path="/diff/xml" element={<XmlDiff />} />
        <Route path="/diff/csv" element={<CsvDiff />} />

        <Route path="/sap/idoc" element={<Idoc />} />
        <Route path="/sap/odata" element={<OData />} />
        <Route path="/sap/mapping" element={<MappingDesigner />} />

        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  )
}

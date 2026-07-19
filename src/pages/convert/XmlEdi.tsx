import { parseXML, stringifyXML } from '../../lib/formats/xml'
import { parseEDI, stringifyEDI, ediToXmlObject, xmlObjectToEDI } from '../../lib/formats/edi'
import ConvertPage from '../../components/ConvertPage'

const ediSample = [
  'ISA*00*          *00*          *ZZ*SENDERID       *ZZ*RECEIVERID     *210101*1200*U*00401*000000001*0*P*>',
  'GS*PO*SENDERID*RECEIVERID*20210101*1200*1*X*004010',
  'ST*850*0001',
  'BEG*00*SA*PO123456**20210101',
  'SE*3*0001',
  'GE*1*1',
  'IEA*1*000000001',
].join('~') + '~'

const xmlSample = stringifyXML(ediToXmlObject(parseEDI(ediSample)), true)

export default function XmlEdi() {
  return (
    <ConvertPage
      eyebrow="01 · convert"
      title="XML ⇄ EDI (X12/EDIFACT)"
      description="Each EDI segment becomes a <Segment tag='…'> element with repeated <Element> children — separators are kept as attributes on the root so the round trip is exact."
      formatA={{
        name: 'XML',
        tag: 'xml',
        parse: (text) => xmlObjectToEDI(parseXML(text)),
        stringify: (v) => stringifyXML(ediToXmlObject(v as ReturnType<typeof xmlObjectToEDI>), true),
        sample: xmlSample,
      }}
      formatB={{
        name: 'EDI',
        tag: 'edi',
        parse: (text) => parseEDI(text),
        stringify: (v) => stringifyEDI(v as ReturnType<typeof parseEDI>, true),
        sample: ediSample,
      }}
    />
  )
}

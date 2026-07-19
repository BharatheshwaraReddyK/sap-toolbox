import type { EdiDocument } from './edi'

interface SegmentEntry {
  name: string
  description: string
}

/**
 * Plain-English descriptions for the segments people run into constantly — mainly the
 * envelope segments (present in literally every X12/EDIFACT file) plus a handful of very
 * common business segments. This is NOT a full data dictionary: which segments are valid,
 * required, or repeatable depends on the specific transaction set / message type and its
 * implementation guide, which varies by trading partner. Treat this as orientation for a
 * fresher, not a validation source — see the links at the bottom of the formatter page for
 * the full, authoritative references.
 */
const X12_SEGMENTS: Record<string, SegmentEntry> = {
  ISA: { name: 'Interchange Control Header', description: 'The very first segment of every X12 file. Sender/receiver IDs, date/time, and the separators used.' },
  IEA: { name: 'Interchange Control Trailer', description: 'The very last segment. Closes the ISA header and states how many functional groups (GS) were included.' },
  GS: { name: 'Functional Group Header', description: 'Groups transaction sets of the same type together. GS08 states the X12 version, e.g. 004010 or 005010.' },
  GE: { name: 'Functional Group Trailer', description: 'Closes a GS group — states how many transaction sets (ST) it contained.' },
  ST: { name: 'Transaction Set Header', description: 'Marks the start of one business document. ST01 is the document type code (850, 810, 856, …).' },
  SE: { name: 'Transaction Set Trailer', description: 'Closes an ST document — segment count, and repeats its control number.' },
  BEG: { name: 'Beginning Segment (Purchase Order)', description: 'Near the top of an 850 — order type, PO number, and date.' },
  BIG: { name: 'Beginning Segment (Invoice)', description: 'Near the top of an 810 — invoice date/number and related PO reference.' },
  REF: { name: 'Reference Identification', description: "A general-purpose \u201chere's another ID\u201d segment — what it means depends on the qualifier in the first element." },
  N1: { name: 'Name', description: 'Identifies a party — buyer, seller, ship-to — by a code and name.' },
  N3: { name: 'Address Information', description: 'Street address lines, usually right after an N1.' },
  N4: { name: 'Geographic Location', description: 'City, state, ZIP/postal code, country — usually right after N3.' },
  PER: { name: 'Administrative Communications Contact', description: "A contact person's name, phone, or email for this document." },
  DTM: { name: 'Date/Time Reference', description: 'A date or time value — which one depends on the qualifier in the first element.' },
  PO1: { name: 'Baseline Item Data', description: 'One line item — quantity, unit, price, product/part number.' },
  PID: { name: 'Product/Item Description', description: 'Free-text description of the item in the preceding line-item segment.' },
  TDS: { name: 'Total Monetary Value Summary', description: 'The total dollar amount for the document (or a section of it).' },
  CTT: { name: 'Transaction Totals', description: 'Line-item count and/or hash total, used as an integrity check.' },
}

const EDIFACT_SEGMENTS: Record<string, SegmentEntry> = {
  UNA: { name: 'Service String Advice', description: 'Optional — explicitly states the separators used, instead of relying on defaults.' },
  UNB: { name: 'Interchange Header', description: "The first real segment. Sender/receiver IDs, date/time, and a control reference (matched by UNZ)." },
  UNZ: { name: 'Interchange Trailer', description: "The last segment. States how many messages were included and repeats UNB's control reference." },
  UNG: { name: 'Functional Group Header', description: "Optional — groups related messages together, similar to X12's GS." },
  UNE: { name: 'Functional Group Trailer', description: 'Closes a UNG group.' },
  UNH: { name: 'Message Header', description: 'Marks the start of one business message. Includes a reference number matched by UNT.' },
  UNT: { name: 'Message Trailer', description: 'Closes a UNH message — segment count and matching reference number.' },
  BGM: { name: 'Beginning of Message', description: "Document type and number — the EDIFACT equivalent of X12's BEG/BIG." },
  DTM: { name: 'Date/Time/Period', description: 'A date or time value — which one depends on the qualifier in the first element.' },
  NAD: { name: 'Name and Address', description: 'Identifies a party and their address, all in one segment.' },
  LIN: { name: 'Line Item', description: 'Identifies one line item by number and product/article code.' },
  QTY: { name: 'Quantity', description: 'A quantity value — ordered, shipped, invoiced, etc, depending on the qualifier.' },
  PRI: { name: 'Price Details', description: "An item's price and the price type (list, net, etc)." },
  MOA: { name: 'Monetary Amount', description: 'A monetary value — line total, tax, etc, depending on the qualifier.' },
  RFF: { name: 'Reference', description: "A general-purpose reference to another document or number, similar to X12's REF." },
  CNT: { name: 'Control Total', description: 'A count or total used as an integrity check for the message.' },
}

export function describeSegment(tag: string, standard: EdiDocument['standard']): string | null {
  const table = standard === 'EDIFACT' ? EDIFACT_SEGMENTS : standard === 'X12' ? X12_SEGMENTS : { ...X12_SEGMENTS, ...EDIFACT_SEGMENTS }
  const entry = table[tag]
  return entry ? `${entry.name} — ${entry.description}` : null
}

/** Common X12 transaction set codes (ST01) — far from exhaustive, just the ones people hit most often. */
export const X12_TRANSACTION_SETS: Record<string, string> = {
  '810': 'Invoice',
  '820': 'Payment Order / Remittance Advice',
  '832': 'Price/Sales Catalog',
  '834': 'Benefit Enrollment and Maintenance',
  '835': 'Health Care Claim Payment/Advice',
  '837': 'Health Care Claim',
  '846': 'Inventory Inquiry/Advice',
  '850': 'Purchase Order',
  '855': 'Purchase Order Acknowledgment',
  '856': 'Ship Notice/Manifest (ASN)',
  '860': 'Purchase Order Change Request',
  '861': 'Receiving Advice/Acceptance Certificate',
  '940': 'Warehouse Shipping Order',
  '945': 'Warehouse Shipping Advice',
  '997': 'Functional Acknowledgment',
}

/** Common EDIFACT message types (UNH second element) — same caveat, not exhaustive. */
export const EDIFACT_MESSAGE_TYPES: Record<string, string> = {
  CONTRL: 'Syntax and Service Report (Acknowledgment)',
  DESADV: 'Despatch Advice (ASN)',
  INVOIC: 'Invoice',
  INVRPT: 'Inventory Report',
  ORDERS: 'Purchase Order',
  ORDRSP: 'Purchase Order Response',
  PRICAT: 'Price/Sales Catalogue',
  REMADV: 'Remittance Advice',
}

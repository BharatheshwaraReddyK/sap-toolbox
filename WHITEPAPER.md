# Manifest — SAP Payload Toolbox

**A whitepaper on design, architecture, and rationale**

Author: Bharatheshwara Reddy K

---

## 1. Motivation

Anyone who has spent time in SAP integration work — PI/PO, CPI, or plain point-to-point
interfaces — ends up doing the same handful of tasks dozens of times a week: pretty-print a
payload someone pasted into a chat message, convert a CSV extract into the JSON shape a REST
call expects, or stare at two versions of an IDoc/EDI file trying to spot the one field that
changed between a "working" run and a "broken" one.

Generic online converter and diff tools exist, but none of them understand the shape of this
work: they don't preserve the exact formatting SAP data depends on (leading zeros in order and
material numbers, fixed decimal places in currency amounts), they don't know what an IDoc
segment or an X12 envelope is, and using ten different websites for ten related tasks is its
own kind of friction. Manifest exists to put these tools under one roof, built specifically
around the formats and habits of this kind of work, and to run entirely in the browser so
nothing sensitive ever has to leave the person's own machine.

## 2. Design principles

**Everything runs client-side.** There is no backend, no upload endpoint, no server-side
parsing. Every conversion, format check, and comparison happens in JavaScript in the browser
tab. This isn't just a privacy nicety — a lot of the payloads this tool is built for (order
data, invoice amounts, customer identifiers) are exactly the kind of thing that shouldn't be
sent to a third-party server just to be reformatted.

**String fidelity over convenience.** Early versions of the XML parser auto-converted
numeric-looking values into real numbers, the way most generic tools do. In practice this
silently destroys data that matters: `000011` becomes `11`, `2100.00` becomes `2100`. For a
tool whose whole purpose includes *comparing* two payloads, an invisible type coercion that
makes two different values look identical is worse than not parsing the value at all. Every
format module in this project treats field values as opaque strings by default and leaves
numeric interpretation to the person using the data, not the parser.

**Comparison happens at two levels, not one.** A "diff" of structured data can mean two
different things: has any *value* changed (field-level, path-based comparison), or has the
*text* changed (line-level comparison, sensitive to ordering and formatting)? These aren't the
same question — a sibling XML tag swapping position with no value change is invisible to a
naive field-level diff (arguably correctly, since key order alone isn't meaningful JSON data),
but it's exactly what a line-level diff exists to catch. Manifest computes both, and treats
content-identical-but-reordered fields as their own category (a "move") in the field-level view
too, rather than making the person go find a second view to see what actually happened.

**Reordering deserves its own category.** Most naive diff implementations treat any array
reordering, or a value that's moved rather than changed, as a delete-then-insert pair. That
reads as noise when reviewing a real change — two things that are actually the same value
sitting in a new position get flagged as if they were entirely new content. Both the field-level
and line-level diff engines here do an explicit matching pass first: anything that's
content-identical but sits somewhere else gets reported once, as a move, before anything else is
categorized as added, removed, or modified — and that matching is recursive, so a move nested
several levels deep, or inside a moved element, is still found.

**A generic format engine, not per-schema validation.** SAP payloads span EDI (X12, EDIFACT),
IDoc XML, OData JSON, flat files, and whatever a given interface happens to produce. Building a
schema-aware validator for even one transaction set properly (an X12 850, say) is a project in
its own right, and the moment you hard-code a specific implementation guide you've made the tool
useless for anyone whose trading partner does it differently. So the format modules here are
deliberately syntax-level: they parse structure faithfully, they check envelope balance and
well-formedness, and they stop short of asserting what a specific business document is *supposed*
to contain. Where the tool can offer orientation — segment glossaries, transaction set labels —
it does, but it says plainly when something is outside what it knows, rather than guessing.

## 3. Architecture overview

The application is a single-page React + TypeScript app built with Vite. There's no routing to
a server for any of its core functionality; React Router's hash-based routing is used so the
built output is a static site that works unmodified from any host, including a GitHub Pages
project subpath.

Each format lives in its own module under `lib/formats/`: parsing and stringifying are kept
separate from any UI concerns, so the same JSON, XML, CSV, YAML, `.properties`, Excel, and EDI
logic backs both the conversion tools and the format/validation tools.

Comparison logic lives under `lib/diff/`:

- `structuralDiff.ts` walks two parsed values recursively, matching array elements and object
  keys by content before classifying anything as added, removed, changed, or moved. Matching is
  content-first (an exact-match pass using a canonical, key-order-independent representation),
  so a moved element is recognized as the same element even when the encompassing structure has
  also changed elsewhere, and recursion continues into matched pairs so a reorder nested inside
  an otherwise-identical branch is still surfaced.
- `lineDiff.ts` wraps a conventional line-based diff (`diffLines`) with the same move-detection
  idea applied to whole lines, plus a pairing pass that turns adjacent delete/insert line pairs
  into a single "modified" line with word-level highlighting, rather than two separate lines.
- `csvDiff.ts` applies the same principles at the row level, either by position or by a chosen
  key column.

The EDI module (`lib/formats/edi.ts`) auto-detects X12 or EDIFACT separators from the fixed-
position `ISA` segment or an explicit `UNA`/`UNB` segment, respecting the escape/release
character where one is defined, and represents a parsed document as a flat list of
`{ tag, elements }` segments — the same shape whether the source was X12 or EDIFACT, which is
what lets a single formatter, JSON converter, and XML converter all work against either
standard without special-casing.

## 4. On accuracy over completeness

This tool makes a deliberate trade: where a fully "correct" implementation would require
hard-coding a specific business schema (a particular EDI transaction set's exact segment
requirements, for instance), it instead does the general, syntax-level version of the job
faithfully, and is explicit about the boundary. A false negative — silently coercing two
different values into looking the same, or silently dropping a real difference because it
happened to also involve reordering — is treated as a much more serious failure than an
honestly incomplete feature. That preference shows up throughout: in the string-fidelity
parsing decision, in the two-tier diff view, in recursive move detection, and in the choice to
label detection results ("X12", "unrecognized envelope") rather than assume.

## 5. License

Manifest is released under the MIT License. See `LICENSE` for the full text.

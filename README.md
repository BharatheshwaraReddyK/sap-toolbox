# Manifest — SAP Payload Toolbox

A browser-based toolbox for converting, formatting, and diffing the data formats that show up
constantly in SAP integration work — JSON, XML, CSV, YAML, Excel, and Java `.properties` files —
plus a few helpers aimed specifically at SAP payloads: an IDoc segment viewer, an OData response
beautifier, and a lightweight field mapping designer.

Everything runs client-side. Nothing you paste in is sent to a server.

## Tools

**Convert**
- XML ⇄ JSON
- CSV ⇄ JSON
- CSV ⇄ XML
- Excel ⇄ JSON / CSV (upload a workbook, or paste JSON/CSV to download one)
- YAML ⇄ JSON
- `.properties` ⇄ JSON

**Format & validate**
- JSON formatter (validate, beautify/minify, sort keys)
- XML formatter (validate, beautify/minify, strip namespaces)
- CSV normalizer (header/row-length checks, delimiter conversion)
- YAML formatter (validate, re-indent)

**Compare**
- JSON diff (structural, path-level)
- XML diff (canonicalized structural compare)
- CSV diff (row-wise or by a key column, field-level highlights)

**SAP payload helpers**
- IDoc viewer & converter — segment-aware XML → JSON with an expandable tree
- OData response beautifier — formats v2/v4 payloads and surfaces entity shape
- Mapping designer — sketch source → target field paths and preview the result

## Getting started

```bash
npm install
npm run dev       # local dev server
npm run build     # production build in dist/
npm run preview   # serve the production build locally
```

## Deploying to GitHub Pages

A workflow at `.github/workflows/deploy.yml` builds the app and publishes `dist/` to GitHub Pages
on every push to `main`. To enable it:

1. Push this repo to GitHub.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow manually) — the site will be live at
   `https://<your-username>.github.io/<repo-name>/`.

The app uses a hash-based router and a relative build base, so it works unmodified from a Pages
project subpath — no extra configuration needed.

## Project structure

```
src/
  lib/
    formats/       parse + stringify for each format (json, xml, csv, yaml, properties, excel)
    diff/           structural diff (JSON/XML) and row-level CSV diff
    registry.ts     the list of tools shown in the sidebar and on the home page
  components/       shared UI: layout, sidebar, code panes, generic Convert/Format/Diff pages
  pages/
    convert/        one page per conversion pair
    format/         one page per formatter/validator
    diff/           one page per comparison tool
    sap/            IDoc, OData, and mapping-designer pages
```

Most conversion and formatting pages are thin configurations of a shared `ConvertPage` /
`FormatPage` / `DiffPage` component — to add a new format pair, write its parse/stringify
functions in `lib/formats/`, then add a short page file and a `registry.ts` entry.

## Stack

React + TypeScript + Vite, Tailwind CSS v4, and a small set of format libraries:
`fast-xml-parser`, `papaparse`, `js-yaml`, `xlsx` (SheetJS).

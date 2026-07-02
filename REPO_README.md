# HMRC Boomi Integration Pattern Catalogue — Repo Conventions

This repo is the living, single source of truth for HMRC integration architecture work on Boomi.

## Structure

- `index.html` — the canonical catalogue page, served at repo root via GitHub Pages.
- `docs/` — every generated deliverable (Word, PPTX, draw.io XML, standalone SVG/PNG) lives here, unzipped, as the reference copies.
- `assets/docs.zip` — a zip bundle of everything in `docs/`, regenerated on every update. Linked from the "Download all docs" button at the top of `index.html`.

## Update workflow

Each time new patterns or deliverables are produced:

1. Update `index.html` with the new/changed content.
2. Drop any newly generated files (docx/pptx/drawio/svg/png) into `docs/`.
3. Rezip: `cd docs && zip -j ../assets/docs.zip *` (or equivalent) so `assets/docs.zip` always reflects the current `docs/` contents.
4. Commit and push to `main`. GitHub Pages serves the update automatically from root.

No page tabs in draw.io files — single canvas only. No standalone documents for content explicitly deferred (e.g. caching strategy) unless requested.

<!-- test edit: end-to-end commit/push verification, 2026-07-02 -->

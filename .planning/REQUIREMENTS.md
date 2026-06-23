# Requirements: AssetFlow CLI

**Defined:** 2026-06-23
**Core Value:** Install once. Never think about image optimization again.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Discovery Engine

- [ ] **DISC-01**: Automatically recursively scan directories (defaulting to `src/`, `public/`, `assets/`, `images/`).
- [ ] **DISC-02**: Support scanning and processing PNG, JPG, JPEG formats, with extension-mapping configurations.
- [ ] **DISC-03**: Ignore default patterns (`node_modules`, `.next`, `dist`, `build`, `coverage`, `.git`) and support custom ignore glob/paths.

### Optimization Engine

- [ ] **OPT-01**: Compress and convert PNG images to WebP/AVIF formats using Sharp.
- [ ] **OPT-02**: Compress and convert JPG/JPEG images to WebP/AVIF formats using Sharp.
- [ ] **OPT-03**: Automatically strip metadata (EXIF, GPS, camera data) from optimized files by default.
- [ ] **OPT-04**: Implement adaptive compression that matches quality to dimensions, size, and compression potential without visible degradation.
- [ ] **OPT-05**: Preserve exact directory structures for files in the output (e.g. `public/images/hero.png` -> `public/images/hero.webp`).
- [ ] **OPT-06**: Support optimization presets ("balanced", "quality", "compression") and customizable quality values (default: 80).

### Processing & Workflow Modes

- [ ] **MODE-01**: Implement Dry-Run mode (`--dry-run`) to estimate savings and report results without making actual changes to files.
- [ ] **MODE-02**: Implement Watch mode (`watch` command) using Chokidar to detect and optimize new/changed assets in real-time.
- [ ] **MODE-03**: Implement Changed Files mode (`--changed` flag) using git diff to target only modified and untracked images.
- [ ] **MODE-04**: Implement robust, non-crashing error handling (log warning/errors and skip bad/corrupted files, continuing to process other images).

### Reporting & Auditing

- [ ] **REP-01**: Render polished CLI output with Ora spinners, Chalk colors, and Vercel-like terminal summary cards.
- [ ] **REP-02**: Implement Doctor command (`doctor`) to analyze project image health, compute a score (e.g., 92/100), and list actionable optimization recommendations.
- [ ] **REP-03**: Export detailed optimization reports to `assetflow-report.json` containing per-file stats, reduction ratios, errors, and recommendations.

### Configuration & Infrastructure

- [ ] **CONF-01**: Parse and validate `assetflow.config.json` using Zod schemas with fallback defaults.
- [ ] **CONF-02**: Set up TypeScript strict build pipeline with fully typed modules (no `any`).
- [ ] **CONF-03**: Achieve 95%+ test coverage using Vitest for Unit, Integration, and E2E tests.
- [ ] **CONF-04**: Setup GitHub Actions for CI/CD lint/test/build validation and release workflows.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Formats & Platforms

- **FMT-01**: Built-in support for vector SVG optimizations (e.g., SVGO integration).
- **FMT-02**: Integrations for Next.js, Vite, and GitHub Actions as first-class plugins (`assetflow-next`, `assetflow-vite`, `assetflow-action`).

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Cloud-hosted compression | Local-first, privacy-first processing constraint |
| Desktop UI Dashboard | Keep focused on terminal CLI and headless automated environments |
| Dynamic runtime image serving | Handled by application servers (e.g. Next.js server); this is a build/development tool |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DISC-01 | Phase 1 | Pending |
| DISC-02 | Phase 1 | Pending |
| DISC-03 | Phase 1 | Pending |
| OPT-01 | Phase 2 | Pending |
| OPT-02 | Phase 2 | Pending |
| OPT-03 | Phase 2 | Pending |
| OPT-04 | Phase 2 | Pending |
| OPT-05 | Phase 2 | Pending |
| OPT-06 | Phase 2 | Pending |
| MODE-01 | Phase 3 | Pending |
| MODE-02 | Phase 3 | Pending |
| MODE-03 | Phase 3 | Pending |
| MODE-04 | Phase 3 | Pending |
| REP-01 | Phase 4 | Pending |
| REP-02 | Phase 4 | Pending |
| REP-03 | Phase 4 | Pending |
| CONF-01 | Phase 1 | Pending |
| CONF-02 | Phase 1 | Pending |
| CONF-03 | Phase 5 | Pending |
| CONF-04 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-23*
*Last updated: 2026-06-23 after initial definition*

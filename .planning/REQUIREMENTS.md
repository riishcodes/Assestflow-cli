# Requirements: AssetFlow CLI

**Defined:** 2026-06-23
**Core Value:** Install once. Never think about image optimization again.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Discovery Engine

- [x] **DISC-01**: Automatically recursively scan directories (defaulting to `src/`, `public/`, `assets/`, `images/`).
- [x] **DISC-02**: Support scanning and processing PNG, JPG, JPEG formats, with extension-mapping configurations.
- [x] **DISC-03**: Ignore default patterns (`node_modules`, `.next`, `dist`, `build`, `coverage`, `.git`) and support custom ignore glob/paths.

### Optimization Engine

- [x] **OPT-01**: Compress and convert PNG/JPG/JPEG images to WebP format using Sharp.
- [x] **OPT-02**: Compress and convert PNG/JPG/JPEG images to AVIF format using Sharp.
- [x] **OPT-03**: Support output format config options `webp`, `avif`, and `both` (generating both files).
- [x] **OPT-04**: Generate responsive image variants with aspect ratio preserved when `"responsive": true` and `"sizes"` array (e.g. `[640, 1280]`) are configured.
- [x] **OPT-05**: Automatically strip metadata (EXIF, GPS, camera data) from optimized files by default, unless `keepMetadata: true` is configured.
- [x] **OPT-06**: Implement adaptive compression that matches quality to dimensions, size, and compression potential without visible degradation.
- [x] **OPT-07**: Preserve exact directory structures for files in the output (e.g. `public/images/hero.png` -> `public/images/hero.webp`).
- [x] **OPT-08**: Support optimization presets ("balanced", "quality", "compression") and customizable quality values (default: 80).

### Processing & Workflow Modes

- [x] **MODE-01**: Implement Dry-Run mode (`--dry-run`) to estimate savings and report results without making actual changes to files.
- [x] **MODE-02**: Implement Watch mode (`watch` command) using Chokidar to detect and optimize new/changed assets in real-time.
- [x] **MODE-03**: Implement Changed Files mode (`--changed` flag) using git diff to target only modified and untracked images.
- [x] **MODE-04**: Implement robust, non-crashing error handling (log warning/errors and skip bad/corrupted files, continuing to process other images).

### Reporting & Auditing

- [x] **REP-01**: Render polished CLI output with Ora spinners, Chalk colors, and Vercel-like terminal summary cards.
- [x] **REP-02**: Implement Doctor command (`doctor`) to calculate a deterministic project health score (base 100 with specified deductions: -5 for >1MB, -2 for PNG >500KB, -3 for containing metadata, -5 for lacking optimized alternatives).
- [x] **REP-03**: Implement Largest Asset bottleneck detection and Potential Savings estimation within the doctor audit command.
- [x] **REP-04**: Export detailed optimization reports to `assetflow-report.json` containing per-file stats, reduction ratios, errors, and recommendations.
- [x] **REP-05**: Implement Project Fingerprint caching in `.assetflow/cache.json` tracking total images, size, health score, and date, allowing doctor/report command to display score improvements.
- [x] **REP-06**: Implement Report command (`report`) to read last optimization report, total optimized assets, current size, and historical health comparison from the cache.

### Configuration & Infrastructure

- [x] **CONF-01**: Parse and validate `assetflow.config.json` using Zod schemas with fallback defaults, validating the `responsive` and `sizes` settings.
- [x] **CONF-02**: Set up TypeScript strict build pipeline with fully typed modules (no `any`) and rich metadata configuration in `package.json`.
- [x] **CONF-03**: Achieve 95%+ test coverage using Vitest for Unit, Integration, and E2E tests.
- [x] **CONF-04**: Setup GitHub Actions for CI/CD lint/test/build validation and release workflows.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Formats & Platforms

- **FMT-01**: Built-in support for vector SVG optimizations (e.g., SVGO integration).
- **FMT-02**: Integrations for Next.js, Vite, and GitHub Actions as first-class plugins (`assetflow-next`, `assetflow-vite`, `assetflow-action`).
- **ENT-01**: Advanced AI compression models.
- **ENT-02**: Cloud synchronization and dashboard UI integration.
- **ENT-03**: Custom JSON export formats and enterprise reporting.

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
| DISC-01 | Phase 1 | Complete |
| DISC-02 | Phase 1 | Complete |
| DISC-03 | Phase 1 | Complete |
| OPT-01 | Phase 2 | Complete |
| OPT-02 | Phase 2 | Complete |
| OPT-03 | Phase 2 | Complete |
| OPT-04 | Phase 2 | Complete |
| OPT-05 | Phase 2 | Complete |
| OPT-06 | Phase 2 | Complete |
| OPT-07 | Phase 2 | Complete |
| OPT-08 | Phase 2 | Complete |
| MODE-01 | Phase 3 | Complete |
| MODE-02 | Phase 3 | Complete |
| MODE-03 | Phase 3 | Complete |
| MODE-04 | Phase 3 | Complete |
| REP-01 | Phase 4 | Complete |
| REP-02 | Phase 4 | Complete |
| REP-03 | Phase 4 | Complete |
| REP-04 | Phase 4 | Complete |
| REP-05 | Phase 4 | Complete |
| REP-06 | Phase 4 | Complete |
| CONF-01 | Phase 1 | Complete |
| CONF-02 | Phase 1 | Complete |
| CONF-03 | Phase 5 | Complete |
| CONF-04 | Phase 5 | Complete |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-23*
*Last updated: 2026-06-23 after full implementation*

# AssetFlow CLI

## What This Is

AssetFlow CLI is a zero-configuration, production-grade command-line image optimization engine that automatically discovers, analyzes, compresses, converts, monitors, audits, and reports image assets across a project. It is designed to run locally or in CI environments to ensure minimal file sizes and optimal visual quality without developer overhead.

## Core Value

Install once. Never think about image optimization again.

## Requirements

### Validated

- ✓ [Existing capability] — Full production release v1.0.0

### Active

- [x] Implement image discovery engine (scanning recursive directories `src/`, `public/`, `assets/`, `images/` for png, jpg, jpeg; ignoring node_modules, .next, dist, etc.)
- [x] Implement optimization engine (PNG/JPG/JPEG to WebP/AVIF or both using Sharp with presets and custom quality)
- [x] Implement responsive variants generation (creating widths specified with aspect ratio preserved)
- [x] Implement adaptive compression engine (analyzing dimensions, size, compression potential for zero visible degradation)
- [x] Implement EXIF/GPS metadata stripping (default enabled for privacy and size reduction; keepMetadata option)
- [x] Implement folder structure preservation (e.g., `public/images/hero.png` -> `public/images/hero.webp`)
- [x] Implement Dry Run mode (`--dry-run` to scan, estimate savings, and report without modification)
- [x] Implement Watch mode (`watch` command to watch directories, auto-optimize, and report in real-time)
- [x] Implement Changed Files mode (`--changed` flag to optimize only modified assets using git diff)
- [x] Implement Project Fingerprint cache (`.assetflow/cache.json`) to track project size and health score progress
- [x] Implement Doctor command (`doctor` command to audit image health with deterministic scoring, show largest bottleneck assets, potential savings, and previous run comparison)
- [x] Implement Report command (`report` command to read cache/history and print comparisons)
- [x] Implement Reporting system (colored terminal output, summary cards, and `assetflow-report.json` export)
- [x] Implement Zod-based config system (`assetflow.config.json` support)
- [x] Implement robust error handling (unsupported formats, corrupt images, permission issues without crashing)
- [x] Setup testing suite (Vitest for Unit, Integration, E2E tests, aiming for 95%+ coverage)
- [x] Configure benchmark scripts (testing 100, 500, 1000 images, measuring time, memory, savings)
- [x] Setup CI/CD (GitHub Actions workflows for PR check and Release/Publishing)

### Out of Scope

- [ ] Advanced AI compression models (deferred past v1)
- [ ] Custom JSON export formats (deferred past v1)
- [ ] Enterprise reporting (deferred past v1)
- [ ] Cloud synchronization (deferred past v1)
- [ ] Dashboard UI / Desktop App (deferred past v1)

## Context

- Technical Environment: Node.js, TypeScript.
- Primary Dependencies: `sharp`, `commander`, `fast-glob`, `chokidar`, `chalk`, `ora`, `zod`, `pretty-bytes`, `execa`, `vitest`.
- Target platforms: Cross-platform (Windows, macOS, Linux).

## Constraints

- **Tech Stack**: Must use specified stack (TypeScript, Commander, Sharp, Chokidar, Fast-Glob, Chalk, Ora, Zod, Pretty-Bytes, Execa, Vitest).
- **TypeScript**: Strict mode enabled, no `any` types.
- **Coverage**: Target 95%+ test coverage with Vitest.
- **Performance**: High performance for batch scanning and multi-file processing (utilizing parallel workers/promises where possible).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Sharp for processing | Native high-performance image manipulation library | ✓ Good |
| Commander.js for CLI | Industry standard CLI framework for Node.js | ✓ Good |
| Fast-Glob for file discovery | Fast recursive file listing with ignore support | ✓ Good |
| Chokidar for watching | Robust cross-platform file watcher for Node.js | ✓ Good |
| Vitest for testing | Fast, modern test runner with native TS support | ✓ Good |
| Caching in `.assetflow/` | Simplest file-based deterministic caching without database overhead | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-23 after full implementation*

# Roadmap: AssetFlow CLI

## Overview

Build AssetFlow CLI, a production-grade, zero-config CLI image optimization engine. The roadmap breaks development into 5 sequential phases: setting up infrastructure and image scanning, implementing the core Sharp-based compression/conversion engine (including responsive resizing and multiple format support), developing CLI commands and watch/git workflow modes, creating the health score doctor, historical fingerprinting, and reporting system, and completing verification/benchmarking and CI/CD integration.

## Phases

- [x] **Phase 1: Setup & Discovery** - Setup TypeScript project structure with npm metadata, validate Zod config, and build recursive glob-based image scanner.
- [x] **Phase 2: Optimization Engine** - Integrate Sharp, build WebP/AVIF/both format converters, metadata stripping, responsive variants generator, directory preservation, and adaptive quality.
- [x] **Phase 3: CLI Modes** - Implement Commander CLI hooks, Dry-Run, git-changed filtering, and real-time Chokidar Watch mode.
- [x] **Phase 4: Doctor & Reporting** - Build the cache manager (`.assetflow/cache.json`), the audit doctor engine (deterministic health score/largest assets/savings recommendations), the report printer, and JSON/terminal output summary.
- [x] **Phase 5: Verification & Release** - Achieve 95%+ test coverage with Vitest, generate benchmark scripts, and configure GitHub Actions CI/CD workflows.

## Phase Details

### Phase 1: Setup & Discovery
**Goal**: Build project scaffold with npm discovery metadata, Zod schema validator, and recursive file-system discovery engine.
**Depends on**: Nothing
**Requirements**: DISC-01, DISC-02, DISC-03, CONF-01, CONF-02
**Success Criteria**:
  1. TypeScript compilation is strict, compiling without errors or `any` casts.
  2. Zod successfully parses valid and reports clear errors on invalid `assetflow.config.json` files.
  3. Scanner recursively finds image files matching target extensions and respects custom ignoring configurations.
**Plans**: 1 plan

Plans:
- [x] 01-01: Build project infrastructure, package config, and glob scanner

### Phase 2: Optimization Engine
**Goal**: Core image optimization, format conversion, and responsive scaling using Sharp.
**Depends on**: Phase 1
**Requirements**: OPT-01, OPT-02, OPT-03, OPT-04, OPT-05, OPT-06, OPT-07, OPT-08
**Success Criteria**:
  1. PNG and JPG images are successfully converted to WebP, AVIF, or both formats.
  2. Aspect ratio-preserving scaling generates only specified responsive width sizes.
  3. All EXIF, GPS, and other metadata are stripped from output files unless keepMetadata is true.
  4. Optimized output assets preserve their relative folder structures in the output destination.
**Plans**: 1 plan

Plans:
- [x] 02-01: Build core Sharp processing, multi-format and responsive variant creation, and output directory layout

### Phase 3: CLI Modes
**Goal**: Set up command line commands and execution patterns (Dry-run, Git diff changed files, and Chokidar directory watcher).
**Depends on**: Phase 2
**Requirements**: MODE-01, MODE-02, MODE-03, MODE-04
**Success Criteria**:
  1. Running `--dry-run` estimates file size changes without creating/modifying files.
  2. Running `--changed` runs optimization only on files identified by `git diff`.
  3. Watch mode runs a background listener that processes files on creation/change.
  4. Individual image failures are captured without crashing the process run.
**Plans**: 1 plan

Plans:
- [x] 03-01: Integrate Commander CLI, dry-run, git diff tracker, and chokidar watcher

### Phase 4: Doctor & Reporting
**Goal**: CLI terminal interface, Doctor health checking command, historical fingerprinting, and JSON/cache reporting formats.
**Depends on**: Phase 3
**Requirements**: REP-01, REP-02, REP-03, REP-04, REP-05, REP-06
**Success Criteria**:
  1. Interactive progress feedback is shown using ora spinners and clear chalk alerts.
  2. Doctor command successfully calculates a deterministic Project Health Score and renders clear recommendations and score improvements.
  3. History is cached to `.assetflow/cache.json`, and running `report` prints optimization comparisons.
**Plans**: 1 plan

Plans:
- [x] 04-01: Build beautiful CLI UX, Cache manager, Doctor calculations, and report runner

### Phase 5: Verification & Release
**Goal**: Run tests, benchmark performance, and publish CI/CD.
**Depends on**: Phase 4
**Requirements**: CONF-03, CONF-04
**Success Criteria**:
  1. Combined Vitest unit, integration, and E2E coverage is 95%+.
  2. Performance benchmark scripts run successfully for mock datasets of 100, 500, and 1000 images.
  3. GitHub Action workflows run linting, tests, and build steps successfully.
**Plans**: 1 plan

Plans:
- [x] 05-01: Write Vitest suites, benchmarks, and GitHub Action workflows

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Setup & Discovery | 1/1 | Complete | 2026-06-23 |
| 2. Optimization Engine | 1/1 | Complete | 2026-06-23 |
| 3. CLI Modes | 1/1 | Complete | 2026-06-23 |
| 4. Doctor & Reporting | 1/1 | Complete | 2026-06-23 |
| 5. Verification & Release | 1/1 | Complete | 2026-06-23 |

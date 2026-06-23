# Roadmap: AssetFlow CLI

## Overview

Build AssetFlow CLI, a production-grade, zero-config CLI image optimization engine. The roadmap breaks development into 5 sequential phases: setting up infrastructure and image scanning, implementing the core Sharp-based compression/conversion engine, developing CLI commands and watch/git workflow modes, creating the health score doctor and reporting system, and completing verification/benchmarking and CI/CD integration.

## Phases

- [ ] **Phase 1: Setup & Discovery** - Setup TypeScript project structure, validate Zod config, and build recursive glob-based image scanner.
- [ ] **Phase 2: Optimization Engine** - Integrate Sharp, build WebP/AVIF conversions, metadata stripping, directory preservation, and adaptive quality.
- [ ] **Phase 3: CLI Modes** - Implement Commander CLI hooks, Dry-Run, git-changed filtering, and real-time Chokidar Watch mode.
- [ ] **Phase 4: Doctor & Reporting** - Build the CLI UX (chalk/ora), the audit doctor engine (health score/recommendations), and JSON/terminal output summary.
- [ ] **Phase 5: Verification & Release** - Achieve 95%+ test coverage with Vitest, generate benchmark scripts, and configure GitHub Actions CI/CD workflows.

## Phase Details

### Phase 1: Setup & Discovery
**Goal**: Build project scaffold, Zod schema validator, and recursive file-system discovery engine.
**Depends on**: Nothing
**Requirements**: DISC-01, DISC-02, DISC-03, CONF-01, CONF-02
**Success Criteria**:
  1. TypeScript compilation is strict, compiling without errors or `any` casts.
  2. Zod successfully parses valid and reports clear errors on invalid `assetflow.config.json` files.
  3. Scanner recursively finds image files matching target extensions and respects custom ignoring configurations.
**Plans**: 1 plan

Plans:
- [ ] 01-01: Build project infrastructure, package config, and glob scanner

### Phase 2: Optimization Engine
**Goal**: Core image optimization and format conversion using Sharp.
**Depends on**: Phase 1
**Requirements**: OPT-01, OPT-02, OPT-03, OPT-04, OPT-05, OPT-06
**Success Criteria**:
  1. PNG and JPG images are successfully converted to WebP and AVIF.
  2. All EXIF, GPS, and other metadata are stripped from output files.
  3. Optimized output assets preserve their relative folder structures in the output destination.
  4. Compression levels are automatically adjusted based on dimension constraints and compression potential.
**Plans**: 1 plan

Plans:
- [ ] 02-01: Build core Sharp processing, compression presets, and relative output structure

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
- [ ] 03-01: Integrate Commander CLI, dry-run, git diff tracker, and chokidar watcher

### Phase 4: Doctor & Reporting
**Goal**: CLI terminal interface, Doctor health checking command, and JSON reporting formats.
**Depends on**: Phase 3
**Requirements**: REP-01, REP-02, REP-03
**Success Criteria**:
  1. Interactive progress feedback is shown using ora spinners and clear chalk alerts.
  2. Doctor command successfully calculates a Project Health Score and renders clear recommendations.
  3. Command exits generate `assetflow-report.json` with details of all scanned and optimized files.
**Plans**: 1 plan

Plans:
- [ ] 04-01: Build beautiful CLI UX, Doctor audit calculations, and json exporter

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
- [ ] 05-01: Write Vitest suites, benchmarks, and GitHub Action workflows

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Setup & Discovery | 0/1 | Not started | - |
| 2. Optimization Engine | 0/1 | Not started | - |
| 3. CLI Modes | 0/1 | Not started | - |
| 4. Doctor & Reporting | 0/1 | Not started | - |
| 5. Verification & Release | 0/1 | Not started | - |

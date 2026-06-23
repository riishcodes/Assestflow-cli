# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-06-23

### Added
- Premium startup sequence with quick progress transitions and automatic framework detection (Next.js, Vite, React, Vue, Astro).
- Project Overview Card with Unicode borders representing framework, source image count, target format, and execution mode.
- Graded Health Score system with character bar visual gauges, letter grades (A+ to D), and status summaries.
- Side-by-side Before/After optimization size reduction charts.
- Detailed Folder Breakdown ASCII tables showing estimated savings per directory.
- Ranked recommendations engine categorized by High, Medium, and Low impact.
- Live progress updates with in-place overwrites (Speed, ETA, percent bars, and current file).
- Support for `--json` on the `report` command to fetch raw metrics in scripted and automated CI environments.
- Native accessibility fallback configurations (under NO_COLOR, TERM=dumb, CI environment variables, or --no-animations flags).
- Custom 80/100/120 column terminal responsive alignment.

## [1.0.0] - 2026-06-23

Initial production-ready release of AssetFlow CLI.

### Added
- Recursive glob-based image file discovery.
- In-place compression and conversion to WebP and AVIF.
- Concurrent WebP + AVIF output generation (via `format: "both"`).
- Aspect-ratio preserving responsive variants generator.
- EXIF, GPS, and color profile metadata stripping by default.
- Caching and historical fingerprinting to track health improvements.
- Deterministic doctor audit reports with project health scoring.
- Background watcher utilizing Chokidar for real-time local optimizations.
- Git diff filters to optimize changed and untracked files only.
- Zod schema validations for `assetflow.config.json`.
- Complete Vitest unit and integration test suites.
- GitHub Actions CI/CD workflows.

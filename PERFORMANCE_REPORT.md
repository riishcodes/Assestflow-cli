# AssetFlow CLI — Performance & Benchmark Report

This report presents performance benchmarks and optimization statistics from validating AssetFlow CLI against a real-world Next.js gallery dataset containing 251 source images.

## Executive Summary

| Metric | Baseline Value |
| :--- | :--- |
| **Total Source Images** | 251 |
| **Dataset Original Size** | 90.6 MB |
| **Optimized Size** | 62.8 MB |
| **Space Saved** | 27.8 MB |
| **Optimization Efficiency** | 30.6% reduction |
| **Cold Optimization Time** | 16.61 seconds |
| **Cached Optimization Time** | 0.29 seconds |
| **Larger Output Protection Skips**| 31 file(s) |
| **Execution Errors** | 0 |

---

## Key Performance Findings

### 1. In-Memory Larger Output Protection
Our newly implemented Larger Output Protection analyzed and encoded all formats in-memory first. It detected that **31 source images** would yield WebP files larger than or equal to their original JPEG versions due to high initial compression. Saving of these 31 files was skipped automatically, preserving the higher-quality original assets and preventing negative optimization deltas.

### 2. High-Performance Hashing & Cache Stability
- **Cold run (first execution)**: Took **16.61 seconds** to process 251 images, resizing and converting them in parallel (limit: 4).
- **Warm run (cached execution)**: Took **0.29 seconds**, verifying checksums deterministic of the files and skipping all 251 unchanged images. This yields a speedup of **57x** for developer workflows.

### 3. Folder breakdown metrics
Optimization details broken down by parent directories:
- `public/images/large/` — 76 files, Saved: 10.2 MB (30.8 MB → 20.6 MB)
- `public/images/xl/` — 30 files, Saved: 13.6 MB (32.9 MB → 19.3 MB)
- `public/images/xxl/` — 20 files, Saved: 2.46 MB (16.5 MB → 14 MB)
- `public/images/medium/` — 75 files, Saved: 1.38 MB (8.61 MB → 7.22 MB)
- `public/images/small/` — 50 files, Saved: 102 KB (1.73 MB → 1.63 MB)

---

## Verdict & Release Readiness
The AssetFlow CLI demonstrates extreme stability and high efficiency on large real-world repositories. The cache remains completely deterministic and stable across restarts.

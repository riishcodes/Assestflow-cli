# AssetFlow CLI — Testing Command Guide

This guide lists the exact commands to run and their expected outputs when validating the functionality of the AssetFlow CLI.

---

## 1. Version Check
Verify that the CLI is correctly installed and versioned.

* **Command:**
  ```bash
  assetflow --version
  ```
* **Expected Output:**
  ```text
  1.0.0
  ```

---

## 2. Help Documentation
Verify command-line interface helper description blocks.

* **Command:**
  ```bash
  assetflow --help
  ```
* **Expected Output:**
  ```text
  Usage: assetflow [options] [command]

  Install once. Never think about image optimization again.

  Options:
    -V, --version                                output the version number
    -d, --dry-run                                Scan and estimate savings without modifying files
    -c, --changed                                Optimize only files modified/staged/untracked in Git
    --config <path>                              Specify custom path to config file
    -f, --format <webp|avif|both>                Output formats WebP, AVIF or both
    -q, --quality <number>                       Override target compression quality (1-100)
    -p, --preset <balanced|quality|compression>  Compression presets
    --force                                      Force reprocessing of all files, ignoring cached checksum hashes
    -h, --help                                   display help for command

  Commands:
    optimize                                     Discover and optimize image assets in the project
    watch                                        Watch image folders and auto-optimize files as they change
    doctor                                       Audit project image assets for optimization opportunities and calculate score
    report                                       Display summary metrics and historical improvement comparison details
  ```

---

## 3. Dry-Run Estimation
Test scanning and size reduction estimation without writing any files to disk.

* **Command:**
  ```bash
  assetflow --dry-run
  ```
* **Expected Output:**
  ```text
  ✔ Configuration loaded
  ✔ Scan complete. Found 2 candidate image(s)

    Optimizing assets in parallel (limit: 4)...

  ✔ src/avatar.jpg → WEBP
    12.4 KB → 4.8 KB (61% reduction)
  ✔ public/images/hero.png → WEBP
    456.2 KB → 112.5 KB (75% reduction)
  ✔ Optimization finished
  ✔ Report saved to: assetflow-report.json

    ┌────────────────────────────────────────────────────────┐
    │  AssetFlow CLI — Optimization Summary                  │
    ├────────────────────────────────────────────────────────┤
    │  Processed Images:   2                                  │
    │  Original Size:      468.6 KB                          │
    │  Optimized Size:     117.3 KB                          │
    │  Saved Space:        351.3 KB                          │
    │  Average Reduction:  75%                               │
    │  Execution Time:     0.28s                             │
    └────────────────────────────────────────────────────────┘
  ```

---

## 4. Optimize In-Place (Both Formats)
Compress images in-place, outputting WebP and AVIF copies concurrently.

* **Command:**
  ```bash
  assetflow optimize --format both
  ```
* **Expected Output:**
  ```text
  ✔ Configuration loaded
  ✔ Scan complete. Found 2 candidate image(s)

    Optimizing assets in parallel (limit: 4)...

  ✔ src/avatar.jpg → WEBP
    12.4 KB → 4.8 KB (61% reduction)
  ✔ src/avatar.jpg → AVIF
    12.4 KB → 3.9 KB (68% reduction)
  ✔ public/images/hero.png → WEBP
    456.2 KB → 112.5 KB (75% reduction)
  ✔ public/images/hero.png → AVIF
    456.2 KB → 77.1 KB (83% reduction)
  ✔ Optimization finished
  ✔ Report saved to: assetflow-report.json

    ┌────────────────────────────────────────────────────────┐
    │  AssetFlow CLI — Optimization Summary                  │
    ├────────────────────────────────────────────────────────┤
    │  Processed Images:   2                                  │
    │  Original Size:      468.6 KB                          │
    │  Optimized Size:     198.3 KB                          │
    │  Saved Space:        270.3 KB                          │
    │  Average Reduction:  71%                               │
    │  Execution Time:     0.42s                             │
    └────────────────────────────────────────────────────────┘
  ```

---

## 5. Caching & Skip Behavior (Re-running Optimization)
Verify that identical files are skipped on a subsequent run because hashes match.

* **Command:**
  ```bash
  assetflow optimize --format both
  ```
* **Expected Output:**
  ```text
  ✔ Configuration loaded
  ✔ Scan complete. Found 2 candidate image(s)

    Optimizing assets in parallel (limit: 4)...

  ✔ Optimization finished
  ✔ src/avatar.jpg — skipped (unchanged)
  ✔ public/images/hero.png — skipped (unchanged)

    i Skipped 2 file(s) because they were already optimized (hashes matched).
  ✔ Report saved to: assetflow-report.json

    ┌────────────────────────────────────────────────────────┐
    │  AssetFlow CLI — Optimization Summary                  │
    ├────────────────────────────────────────────────────────┤
    │  Processed Images:   2                                  │
    │  Original Size:      468.6 KB                          │
    │  Optimized Size:     198.3 KB                          │
    │  Saved Space:        0 B                               │
    │  Average Reduction:  0%                                │
    │  Execution Time:     0.02s                             │
    └────────────────────────────────────────────────────────┘
  ```

---

## 6. Force Cache Bypass
Force re-compression and overwrite existing optimized variants regardless of cache.

* **Command:**
  ```bash
  assetflow optimize --format both --force
  ```
* **Expected Output:**
  ```text
  ✔ Configuration loaded
  ✔ Scan complete. Found 2 candidate image(s)

    Optimizing assets in parallel (limit: 4)...

  ✔ src/avatar.jpg → WEBP
    12.4 KB → 4.8 KB (61% reduction)
  ...
  ```

---

## 7. Project Image Audit
Deterministic scoring doctor command checks image size issues and unstripped metadata.

* **Command:**
  ```bash
  assetflow doctor
  ```
* **Expected Output:**
  ```text
  ✔ Audit check finished

    Project Image Audit
    ────────────────────────────────────────────────────────

    Project Health Score:    100 / 100
    (Previous Score: 78 | Improvement: +22)
    Potential Savings:       0 B
    Scanned Images:          2
    Total File Size:         198.3 KB

    Largest Assets:
      1. public/images/hero.png — 77.1 KB
      2. src/avatar.jpg — 3.9 KB

    Recommendations:
      ✓ All images fully optimized! Keep up the good work.
  ```

---

## 8. View History Report
Load historical delta measurements since last run.

* **Command:**
  ```bash
  assetflow report
  ```
* **Expected Output:**
  ```text
    Last Optimization Report
    Generated at: 6/23/2026, 12:05:12 PM
    ────────────────────────────────────────────────────────

    Total Scanned Images:   2
    Original Total Size:    468.6 KB
    Optimized Total Size:   198.3 KB
    Space Saved:            270.3 KB
    Reduction Ratio:        71%
    Project Health Score:   100 / 100

    Historical Progress Delta:
      • Score Improvement:  +22 points
      • Saved Size Delta:   270.3 KB
      • Scanned Files Delta: +0 images
  ```

---

## 9. Real-Time Watch Daemon
Runs chokidar file monitor. Terminate with `Ctrl+C`.

* **Command:**
  ```bash
  assetflow watch
  ```
* **Expected Output:**
  ```text
    AssetFlow Watcher
    Watching: src, public, assets, images
    Output Formats: WEBP
    Target Quality: 80
    Press Ctrl+C to exit.

  # When a new file 'test.jpg' is saved in a watched folder:
  ✔ public/images/test.jpg → WEBP
    800.5 KB → 180.2 KB (77% reduction)
  ```

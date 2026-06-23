# AssetFlow CLI — Launch Marketing Assets

This document contains copy-paste ready marketing assets, description fields, and templates for launching **AssetFlow CLI v1.0.0** on GitHub, npm, Product Hunt, X (Twitter), and LinkedIn.

---

## 1. GitHub & npm Metadata

### GitHub Repository Description
> Install once. Never think about image optimization again. Zero-config CLI engine to scan, compress, convert, and watch assets.

### GitHub Topics (Tags)
```text
image-optimization, webp, avif, performance, devtools, cli, sharp, nextjs, react, vue, astro, build-tool, frontend, image-compression
```

### npm Package Description
- **Short Description:**
  > Install once. Never think about image optimization again. Production-grade image compression & conversion engine.
- **Keywords:**
  > `["image-optimization", "webp", "avif", "performance", "nextjs", "vite", "frontend", "developer-tools", "cli", "sharp"]`

---

## 2. GitHub Release Notes (v1.0.0)

### Title: `🚀 v1.0.0 — Production-Grade Zero-Config Image Optimization Engine`

### Body Copy:
```markdown
## Release Highlights

AssetFlow CLI v1.0.0 is officially live! 🎉

AssetFlow is a zero-configuration, production-grade image optimization command-line engine that automatically discovers, analyzes, compresses, converts, monitors, audits, and reports image assets across your web projects. 

### ⚡ Key Features

* **Zero-Config Recursive Scanning**: Works out-of-the-box for Next.js, Vite, React, Vue, and Astro repositories.
* **Modern Formats Support**: Compress and convert images to `webp`, `avif`, or generate `both` formats concurrently.
* **Aspect-Ratio Resizing**: Scale images to custom width variants (e.g. `sizes: [640, 1280]`) safely without upscaling.
* **SHA-256 Hash Caching**: Delta fingerprint caching in `.assetflow/cache.json` bypasses unchanged assets on subsequent runs, yielding up to **57× faster runs**.
* **Project Health Doctor**: Run `assetflow doctor` to get a graded Health Score (deducting points for images >1MB, missing modern variants, or unstripped EXIF tags) and ranked actionable improvements.
* **Background Watcher**: Run `assetflow watch` to monitor directory additions/modifications and optimize them in real-time.
* **Git Changed Filter**: Target only files changed, staged, or untracked in local git branches to speed up pre-commit checking hooks.

### 📊 Benchmark Metrics
Optimizing **250 mixed-format images** (original size **89.3 MB**):
* **Balanced Mode** (Quality 80): Compresses to **62.8 MB** (31% space saved).
* **Compression Mode** (Quality 50): Compresses to **47.7 MB** (47% space saved) in **19s**.
* **Subsequent Cached Run**: Execution completes in under **350ms** (57× speedup).

### 📦 Installation

```bash
npx assetflow
```

Or install globally:

```bash
npm install -g assetflow-cli
```

---
*Thank you to all contributors who helped build and audit this release!*
```

---

## 3. Product Hunt Launch Copy

### Product Tagline
> Install once. Never think about image optimization again.

### Product Description
> AssetFlow CLI is a zero-config, production-grade image optimization tool that recursively audits, compresses, converts (to WebP/AVIF), and monitors images across any Next.js, Vite, React, Vue, or Astro workspace. Features SHA-256 caching, Git changed filters, responsive width variants, and an interactive Health Doctor.

### Maker Comment (Introduction)
> Hey Product Hunt! 👋
> 
> As web developers, we've all been there: exporting high-resolution PNGs or JPEGs from Figma, uploading them to online converters, renaming them, checking file sizes, stripping metadata manually, and committing them. When folders scale, this workflow becomes a bottleneck.
> 
> We built **AssetFlow CLI** to automate this entire pipeline with a single command. 
> 
> Key pillars of AssetFlow CLI:
> 1. **Install Once, Automate Forever:** Run `npx assetflow` to discover and optimize image folders.
> 2. **SHA-256 Hash Caching:** Never waste CPU cycles re-optimizing unchanged assets.
> 3. **Interactive Auditing:** Run `assetflow doctor` to grade your project's image assets health out of 100.
> 4. **Watch Mode:** Run `assetflow watch` to compress images on the fly during local development.
> 
> We'd love to hear your feedback, bug reports, and features requests. What frameworks would you like to see supported next?
> 
> Happy optimizing! 🚀

---

## 4. X / Twitter Announcement Post

### Main Post (1/3)
> Say goodbye to manual image compression. 🖼️⚡
> 
> Introducing AssetFlow CLI — a zero-config command-line engine that recursively discovers, compresses, converts (to WebP/AVIF), audits, and watches image assets across your project.
> 
> Try it now: `npx assetflow`
> 
> 👇 Here is how we speed up your web apps...

### Thread Post (2/3)
> 1️⃣ SHA-256 Checksum Caching: Skips unchanged assets, rendering subsequent runs up to 57× faster.
> 2️⃣ Interactive Health Doctor: Run `assetflow doctor` to inspect image sizes, check metadata stripping, and calculate your Health Score.
> 3️⃣ Responsive Widths: Automatically output scaled width sizes without upscaling.

### Thread Post (3/3)
> Out-of-the-box support for Next.js, React, Vite, Vue, and Astro. 
> 
> Check out the open-source repository, read the benchmarks, and star the project on GitHub:
> 🔗 https://github.com/riishcodes/assetflow-cli
> 
> Let us know what you think! 🚀

---

## 5. LinkedIn Launch Announcement

### Post Copy:
```text
🚀 Exciting Open Source Release: Introducing AssetFlow CLI v1.0.0!

If you are a web developer, you know that keeping image asset payloads low is crucial for Core Web Vitals, page speed, and SEO. But manually resizing, converting, and compressing images before committing them is a huge time sink.

That's why we built AssetFlow CLI—a production-grade, zero-configuration command-line tool designed to automate image optimization forever.

Simply run:
npx assetflow

Why is AssetFlow CLI different?
⚡ SHA-256 Hash Caching: We calculate unique checksums for every image and match them against a local cache, allowing subsequent runs to bypass unchanged files and run up to 57× faster.
🩺 Graded Health Doctor: Run "assetflow doctor" to get a detailed audit score (A+ to D) of your project's images, highlighting unstripped metadata and files over 1MB.
📐 Responsive Scaling: Configurable width resizing (e.g. 640px, 1280px) outputs aspect-ratio locked variants without pixel upscaling.
🌱 Git Integration: Target only files modified, staged, or untracked in git to accelerate pre-commit hooks and local runs.

We ran it on a mixed-format test suite of 250 images (89.3 MB original size):
• Balanced Mode compressed the payload down to 62.8 MB (31% savings)
• Compression Mode compressed the payload down to 47.7 MB (47% savings)
• Cached re-runs completed in less than 350ms!

AssetFlow CLI works out-of-the-box for Next.js, Vite, React, Vue, and Astro.

Check out the open-source repository and documentation on GitHub:
🔗 https://github.com/riishcodes/assetflow-cli

Let me know your thoughts in the comments! 👇
#webdevelopment #performance #javascript #typescript #opensource #nextjs #vite
```

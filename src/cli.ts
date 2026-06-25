/*
 * Copyright (c) 2026 AssetFlow.
 *
 * Licensed under the AssetFlow Community License.
 * Commercial use requires a commercial license.
 *
 * https://flow.riish.in
 */
import { Command } from 'commander';
import path from 'node:path';
import fs from 'node:fs/promises';
import { loadConfig, mergeConfig } from './config/manager.js';
import { scanDirectories, type ScannedFile } from './core/scanner.js';
import { optimizeImage, type OptimizationResult } from './core/optimizer.js';
import { runDoctorAudit } from './core/doctor-engine.js';
import { readCache, writeCache, compareCache } from './core/cache-manager.js';
import { getChangedFiles } from './core/changed.js';
import { startWatcher } from './core/watch.js';
import { exportReportJson } from './utils/report-exporter.js';
import { compileSummary, formatSize } from './utils/metrics.js';
import * as logger from './utils/logger.js';
import chalk from 'chalk';

/**
 * Automatically detects framework type in the project root.
 */
async function detectProjectType(projectRoot: string): Promise<string> {
  try {
    const files = await fs.readdir(projectRoot);
    if (files.includes('next.config.ts') || files.includes('next.config.js') || files.includes('next.config.mjs')) {
      return 'Next.js';
    }
    if (files.includes('vite.config.ts') || files.includes('vite.config.js') || files.includes('vite.config.mjs')) {
      return 'Vite';
    }
    if (files.includes('astro.config.mjs') || files.includes('astro.config.ts')) {
      return 'Astro';
    }
    try {
      const pkgPath = path.join(projectRoot, 'package.json');
      const raw = await fs.readFile(pkgPath, 'utf8');
      const pkg = JSON.parse(raw);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps['next']) return 'Next.js';
      if (deps['astro']) return 'Astro';
      if (deps['vite']) return 'Vite';
      if (deps['react']) return 'React';
      if (deps['vue']) return 'Vue';
    } catch {
      // Ignore package.json read failures
    }
    return 'Unknown Project';
  } catch {
    return 'Unknown Project';
  }
}



// Helper for parallel task limiting
async function processInParallel<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  const executing: Promise<any>[] = [];

  for (let i = 0; i < items.length; i++) {
    const p = Promise.resolve()
      .then(() => fn(items[i]))
      .then(res => {
        results[i] = res;
        executing.splice(executing.indexOf(p), 1);
      });
    executing.push(p);

    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}

// Utility to retrieve version from package.json
async function getPackageVersion(projectRoot: string): Promise<string> {
  try {
    const pkgPath = path.join(projectRoot, 'package.json');
    const raw = await fs.readFile(pkgPath, 'utf8');
    const pkg = JSON.parse(raw);
    return pkg.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
}

export async function runCli(argv: string[], projectRoot: string): Promise<void> {
  const program = new Command();
  const version = await getPackageVersion(projectRoot);

  program
    .name('assetflow')
    .description('Install once. Never think about image optimization again.')
    .version(version);

  program.addHelpText('before', () => {
    const hasNoAnims = argv.includes('--no-animations') ||
      process.env.NO_COLOR !== undefined ||
      process.env.TERM === 'dumb' ||
      process.env.CI !== undefined;
    logger.setAnimationsEnabled(!hasNoAnims);
    logger.renderBrandingHeader();
    return '';
  });

  // Global command configuration options
  program
    .option('-d, --dry-run', 'Scan and estimate savings without modifying files')
    .option('-c, --changed', 'Optimize only files modified/staged/untracked in Git')
    .option('--config <path>', 'Specify custom path to config file')
    .option('-f, --format <webp|avif|both>', 'Output formats WebP, AVIF or both')
    .option('-q, --quality <number>', 'Override target compression quality (1-100)', (val) => parseInt(val, 10))
    .option('-p, --preset <balanced|quality|compression>', 'Compression presets')
    .option('--force', 'Force reprocessing of all files, ignoring cached checksum hashes')
    .option('--no-animations', 'Disable startup animations and live progress bars');

  // Default optimize action
  program
    .action(async (options) => {
      await handleOptimizeCommand(projectRoot, options);
    });

  // Optimize command (alias to default command)
  program
    .command('optimize')
    .description('Discover and optimize image assets in the project')
    .action(async () => {
      await handleOptimizeCommand(projectRoot, program.opts());
    });

  // Watch command
  program
    .command('watch')
    .description('Watch image folders and auto-optimize files as they change')
    .action(async () => {
      await handleWatchCommand(projectRoot, program.opts());
    });

  // Doctor command
  program
    .command('doctor')
    .description('Audit project image assets for optimization opportunities and calculate score')
    .action(async () => {
      await handleDoctorCommand(projectRoot, program.opts());
    });

  // Report command
  program
    .command('report')
    .description('Display summary metrics and historical improvement comparison details')
    .option('--json', 'Output raw JSON report metrics to stdout')
    .action(async (cmdOptions) => {
      await handleReportCommand(projectRoot, { ...program.opts(), ...cmdOptions });
    });

  // Init command
  program
    .command('init')
    .description('Initialize assetflow.config.json with default settings')
    .action(async () => {
      await handleInitCommand(projectRoot);
    });

  await program.parseAsync(argv);
}

/**
 * Handles the "init" command flow.
 */
async function handleInitCommand(projectRoot: string): Promise<void> {
  logger.renderBrandingHeader();
  const configPath = path.join(projectRoot, 'assetflow.config.json');
  try {
    await fs.access(configPath);
    logger.printWarning('assetflow.config.json already exists.');
  } catch {
    const defaultConfig = {
      format: 'webp',
      quality: 80,
      preset: 'balanced',
      responsive: false,
      deleteOriginal: false,
      keepMetadata: false
    };
    await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
    logger.printSuccess('Created assetflow.config.json with sensible defaults.');
  }
}

/**
 * Handles the "optimize" command flow.
 */
async function handleOptimizeCommand(projectRoot: string, options: any): Promise<void> {
  const startTime = Date.now();
  const version = await getPackageVersion(projectRoot);
  const framework = await detectProjectType(projectRoot);

  // Configure animations based on flag and environment variables
  const disableAnimations = options.animations === false ||
    process.env.NO_COLOR !== undefined ||
    process.env.TERM === 'dumb' ||
    process.env.CI !== undefined;
  logger.setAnimationsEnabled(!disableAnimations);
  
  try {
    logger.renderCompactHeader(version);

    const fileConfig = await loadConfig(projectRoot);
    const config = mergeConfig(fileConfig, options);

    let files: ScannedFile[] = [];

    if (options.changed) {
      const changedFilesList = await getChangedFiles(projectRoot);
      if (changedFilesList === null) {
        files = await scanDirectories(projectRoot, config);
      } else {
        const allScanned = await scanDirectories(projectRoot, config);
        files = allScanned.filter(f => changedFilesList.includes(f.relativePath));
      }
    } else {
      files = await scanDirectories(projectRoot, config);
    }

    const sourceImages = files.filter(f => ['png', 'jpg', 'jpeg'].includes(f.extension));
    const generatedAssetsCount = files.length - sourceImages.length;

    // Health score audit before optimizations
    const auditBefore = await runDoctorAudit(files, config);

    // Play Claude-Style Thinking Timeline
    await logger.playThinkingTimeline({
      framework,
      imagesCount: sourceImages.length,
      savings: formatSize(auditBefore.potentialSavingsBytes),
      score: auditBefore.healthScore,
      recsCount: auditBefore.recommendations.length
    });

    // Project detection card representation
    logger.printProjectCard(
      version,
      framework,
      sourceImages.length,
      options.dryRun ? 'Dry Run' : 'Optimize',
      generatedAssetsCount,
      files.length,
      formatSize(auditBefore.totalSize),
      formatSize(auditBefore.potentialSavingsBytes)
    );

    if (sourceImages.length === 0) {
      logger.printWarning('No unoptimized PNG, JPG, or JPEG images found to process.');
      return;
    }

    const previousCache = await readCache(projectRoot);
    const cachedHashes = previousCache?.hashes || {};

    let completed = 0;
    const progressStartTime = Date.now();
    
    if (logger.areAnimationsEnabled()) {
      logger.updateProgress(completed, sourceImages.length, '', progressStartTime);
    } else {
      logger.startSpinner(`Optimizing ${completed}/${sourceImages.length} images...`);
    }

    const processedResults = await processInParallel(sourceImages, 4, async (file) => {
      const result = await optimizeImage(file, config, projectRoot, {
        dryRun: !!options.dryRun,
        cachedHash: cachedHashes[file.relativePath]
      });
      completed++;
      if (logger.areAnimationsEnabled()) {
        logger.updateProgress(completed, sourceImages.length, file.relativePath, progressStartTime);
      } else {
        logger.updateSpinner(`Optimizing ${completed}/${sourceImages.length} images...`);
      }
      return result;
    });

    if (logger.areAnimationsEnabled()) {
      logger.completeProgress(sourceImages.length);
    } else {
      logger.stopSpinner(true, 'Optimization finished');
    }

    // Sequentially print rows to terminal for DX visual elegance
    let skippedCount = 0;
    for (const result of processedResults) {
      if (result.skipped) {
        skippedCount++;
        console.log(`  ${chalk.cyan('✓')} ${chalk.gray(result.relativePath)} — ${chalk.cyan('skipped (unchanged)')}`);
      } else {
        logger.logFileOptimization(result);
      }
    }

    if (skippedCount > 0) {
      console.log(`\n  ${chalk.cyan('i')} Skipped ${skippedCount} file(s) because they were already optimized (hashes matched).`);
    }

    const executionTimeMs = Date.now() - startTime;
    const summary = compileSummary(processedResults, executionTimeMs);

    // Audit after to compile new score
    const finalScan = options.dryRun ? files : await scanDirectories(projectRoot, config);
    const auditAfter = await runDoctorAudit(finalScan, config);

    // Rewards Dashboard Card
    logger.printCompletionCard(summary, auditBefore.healthScore, auditAfter.healthScore);
    
    // Impact chart
    logger.printSizeComparison(summary.originalSize, summary.optimizedSize);

    // Save report if not dry run
    if (!options.dryRun) {
      const reportPath = await exportReportJson(
        projectRoot,
        processedResults,
        config,
        auditAfter.healthScore,
        auditAfter.recommendations,
        auditAfter.breakdown
      );
      logger.printSuccess(`Report saved to: ${chalk.gray(path.basename(reportPath))}`);

      const newHashes: Record<string, string> = { ...cachedHashes };
      for (const res of processedResults) {
        if (res.success && res.hash) {
          newHashes[res.relativePath] = res.hash;
        }
      }

      await writeCache(projectRoot, {
        images: auditAfter.totalImages,
        totalSize: formatSize(auditAfter.totalSize),
        totalSizeBytes: auditAfter.totalSize,
        healthScore: auditAfter.healthScore,
        hashes: newHashes,
      });
    }
  } catch (error: any) {
    logger.printError(error.message || String(error));
    process.exit(1);
  }
}

/**
 * Handles the "watch" command flow.
 */
async function handleWatchCommand(projectRoot: string, options: any): Promise<void> {
  const version = await getPackageVersion(projectRoot);
  const framework = await detectProjectType(projectRoot);

  const disableAnimations = options.animations === false ||
    process.env.NO_COLOR !== undefined ||
    process.env.TERM === 'dumb' ||
    process.env.CI !== undefined;
  logger.setAnimationsEnabled(!disableAnimations);

  try {
    const fileConfig = await loadConfig(projectRoot);
    const config = mergeConfig(fileConfig, options);

    logger.renderCompactHeader(version);
    console.log(`  Watching: ${chalk.gray(config.directories?.join(', ') || 'src, public, assets, images')}`);
    console.log(`  Output Formats: ${chalk.white(config.format.toUpperCase())}`);
    console.log(`  Target Quality: ${chalk.white(config.quality.toString())}`);
    console.log(`  Press ${chalk.bold('Ctrl+C')} to exit.\n`);

    let watchOptimizedCount = 0;
    let watchSavedBytes = 0;
    
    // Periodically show watch summaries every 30 seconds
    const interval = setInterval(() => {
      if (watchOptimizedCount > 0) {
        console.log(`\n  ${chalk.cyan('i')} ${chalk.bold('Watch Summary (Last 30s):')} Optimized ${chalk.green(watchOptimizedCount)} files, saved ${chalk.green(formatSize(watchSavedBytes))}.`);
        watchOptimizedCount = 0;
        watchSavedBytes = 0;
      }
    }, 30000);

    // Bind cleanup
    process.on('SIGINT', () => {
      clearInterval(interval);
      process.exit(0);
    });

    startWatcher(projectRoot, config, async (result) => {
      logger.logWatchOptimization(result);

      if (result.success && !result.skipped) {
        watchOptimizedCount++;
        let saved = result.originalSize;
        result.optimizedFiles.forEach(opt => {
          saved -= opt.size;
        });
        watchSavedBytes += Math.max(0, saved);
      }

      // Re-run report compilation in background on change
      try {
        const finalScan = await scanDirectories(projectRoot, config);
        const audit = await runDoctorAudit(finalScan, config);
        await exportReportJson(projectRoot, [result], config, audit.healthScore, audit.recommendations, audit.breakdown);

        const previousCache = await readCache(projectRoot);
        const newHashes = previousCache ? { ...previousCache.hashes } : {};
        if (result.success && result.hash) {
          newHashes[result.relativePath] = result.hash;
        }

        await writeCache(projectRoot, {
          images: audit.totalImages,
          totalSize: formatSize(audit.totalSize),
          totalSizeBytes: audit.totalSize,
          healthScore: audit.healthScore,
          hashes: newHashes,
        });
      } catch {
        // Ignore background reporting errors
      }
    });
  } catch (error: any) {
    logger.printError(error.message || String(error));
    process.exit(1);
  }
}

/**
 * Handles the "doctor" command flow.
 */
async function handleDoctorCommand(projectRoot: string, options: any): Promise<void> {
  const version = await getPackageVersion(projectRoot);
  const framework = await detectProjectType(projectRoot);

  const disableAnimations = options.animations === false ||
    process.env.NO_COLOR !== undefined ||
    process.env.TERM === 'dumb' ||
    process.env.CI !== undefined;
  logger.setAnimationsEnabled(!disableAnimations);

  try {
    logger.renderBrandingHeader();

    const config = await loadConfig(projectRoot);
    const files = await scanDirectories(projectRoot, config);
    const audit = await runDoctorAudit(files, config);
    const previousCache = await readCache(projectRoot);

    // Play Claude-Style Thinking Timeline
    await logger.playThinkingTimeline({
      framework,
      imagesCount: audit.totalImages,
      savings: formatSize(audit.potentialSavingsBytes),
      score: audit.healthScore,
      recsCount: audit.recommendations.length
    });

    // 1. Project Card
    logger.printProjectCard(
      version,
      framework,
      audit.totalImages,
      'Doctor Audit',
      audit.generatedAssets,
      audit.totalFilesDetected,
      formatSize(audit.totalSize),
      formatSize(audit.potentialSavingsBytes)
    );

    // 2. Graded Health Score gauge
    logger.printPremiumHealthScore(audit.healthScore, audit.breakdown);

    if (previousCache) {
      const delta = compareCache(audit.healthScore, audit.totalSize, audit.totalImages, previousCache);
      if (delta.scoreImprovement !== null) {
        const sign = delta.scoreImprovement >= 0 ? '+' : '';
        const impColor = delta.scoreImprovement >= 0 ? chalk.green : chalk.red;
        console.log(`  ${chalk.gray(`(Previous Score: ${delta.previousScore} | Improvement: ${impColor(sign + delta.scoreImprovement)})`)}\n`);
      }
    }

    console.log(`  ${chalk.gray('Total File Size:')}         ${chalk.white(formatSize(audit.totalSize))}`);
    console.log(`  ${chalk.gray('Potential Savings:')}       ${chalk.green.bold(formatSize(audit.potentialSavingsBytes))}\n`);

    // 3. Top 5 Largest Assets visual bars
    logger.printLargestAssetsVisual(audit.largestAssets);

    // 4. Top 5 Savings Opportunities visual bars
    logger.printSavingsOpportunitiesVisual(audit.savingsOpportunities);

    // 5. Folder performance breakdown table
    logger.printFolderBreakdownTable(audit.folderBreakdown);

    // 6. Smart ranked recommendations
    logger.printRankedRecommendations(audit.recommendations, audit);

    console.log('');
  } catch (error: any) {
    logger.printError(error.message || String(error));
    process.exit(1);
  }
}

/**
 * Handles the "report" command flow.
 */
async function handleReportCommand(projectRoot: string, options: any): Promise<void> {
  const reportPath = path.join(projectRoot, 'assetflow-report.json');
  const version = await getPackageVersion(projectRoot);
  const framework = await detectProjectType(projectRoot);

  const disableAnimations = options.animations === false ||
    process.env.NO_COLOR !== undefined ||
    process.env.TERM === 'dumb' ||
    process.env.CI !== undefined;
  logger.setAnimationsEnabled(!disableAnimations);

  try {
    const rawReport = await fs.readFile(reportPath, 'utf8');
    const reportData = JSON.parse(rawReport);

    if (options.json) {
      console.log(rawReport);
      return;
    }

    const previousCache = await readCache(projectRoot);

    logger.renderCompactHeader(version);
    console.log(`  Last Optimization Report`);
    console.log(`  Generated at: ${chalk.gray(new Date(reportData.timestamp).toLocaleString())}`);
    console.log(`  ────────────────────────────────────────────────────────\n`);

    // Standardize counts
    const sourceImagesCount = reportData.summary.sourceImages ?? reportData.summary.totalOriginalImages ?? 0;
    const generatedAssetsCount = reportData.summary.generatedAssets ?? 0;
    const totalFilesCount = reportData.summary.totalFilesDetected ?? (sourceImagesCount + generatedAssetsCount);

    // Find largest file in reportData
    let largestFile: any = null;
    let maxOriginalSize = -1;
    if (reportData.files && reportData.files.length > 0) {
      for (const file of reportData.files) {
        if (file.originalSize > maxOriginalSize) {
          maxOriginalSize = file.originalSize;
          largestFile = file;
        }
      }
    }

    // Overview Card representation
    logger.printProjectCard(
      version,
      framework,
      sourceImagesCount,
      'Report Review',
      generatedAssetsCount,
      totalFilesCount,
      formatSize(reportData.summary.totalOriginalSize),
      formatSize(reportData.summary.spaceSaved),
      largestFile?.filePath,
      largestFile ? formatSize(largestFile.originalSize) : undefined
    );

    // Health Score visual bar
    if (reportData.healthScore !== null) {
      logger.printPremiumHealthScore(reportData.healthScore, reportData.breakdown);
    }

    if (previousCache) {
      const prevScore = previousCache.healthScore !== undefined ? previousCache.healthScore : 100;
      const currentScore = reportData.healthScore !== undefined && reportData.healthScore !== null ? reportData.healthScore : 100;
      const delta = compareCache(
        currentScore,
        reportData.summary.totalOptimizedSize,
        sourceImagesCount,
        previousCache
      );
      
      console.log(`  ${chalk.cyan.bold('Historical Progress Delta:')}`);
      if (delta.scoreImprovement !== null) {
        const sign = delta.scoreImprovement >= 0 ? '+' : '';
        console.log(`    • Score Improvement:  ${chalk.bold(sign + delta.scoreImprovement)} points`);
      }
      if (delta.sizeSavedBytes !== null && delta.sizeSavedBytes > 0) {
        console.log(`    • Saved Size Delta:   ${chalk.green.bold(formatSize(delta.sizeSavedBytes))}`);
      }
      if (delta.imageCountDelta !== null && delta.imageCountDelta !== 0) {
        const sign = delta.imageCountDelta > 0 ? '+' : '';
        console.log(`    • Scanned Files Delta: ${chalk.white(sign + delta.imageCountDelta)} images`);
      }
      console.log('');
    }

    // Impact charts
    logger.printSizeComparison(reportData.summary.totalOriginalSize, reportData.summary.totalOptimizedSize);

    // 1. Largest Saving Asset detail
    let largestSavingFile: any = null;
    let maxSavings = -1;
    if (reportData.files && reportData.files.length > 0) {
      for (const file of reportData.files) {
        const savings = file.originalSize - file.optimizedSize;
        if (savings > maxSavings && file.success) {
          maxSavings = savings;
          largestSavingFile = file;
        }
      }
    }

    console.log(`  ${chalk.bold('Largest Saving Asset:')}`);
    if (largestSavingFile && maxSavings > 0) {
      console.log(`    ${chalk.white(largestSavingFile.filePath)}`);
      console.log(`    ${chalk.gray(formatSize(largestSavingFile.originalSize))} → ${chalk.white(formatSize(largestSavingFile.optimizedSize))}`);
      console.log(`    Saved: ${chalk.green.bold(formatSize(maxSavings))}\n`);
    } else {
      console.log(`    ${chalk.gray('No savings detected.')}\n`);
    }

    // 2. Average savings
    const filesWithSavings = reportData.files ? reportData.files.filter((f: any) => f.success && f.originalSize > f.optimizedSize).length : 0;
    const avgSavings = filesWithSavings > 0 ? reportData.summary.spaceSaved / filesWithSavings : 0;
    console.log(`  ${chalk.bold('Average Savings Per File:')}  ${chalk.green.bold(formatSize(avgSavings))}\n`);

    // 3. Folder-Level breakdown
    const folderBreakdownMap = new Map<string, { count: number; original: number; optimized: number }>();
    if (reportData.files) {
      for (const file of reportData.files) {
        const relativeFolder = path.dirname(file.filePath).replace(/\\/g, '/');
        const folderKey = relativeFolder === '.' ? 'root' : relativeFolder;
        
        const existing = folderBreakdownMap.get(folderKey) || { count: 0, original: 0, optimized: 0 };
        folderBreakdownMap.set(folderKey, {
          count: existing.count + 1,
          original: existing.original + file.originalSize,
          optimized: existing.optimized + file.optimizedSize,
        });
      }
    }

    const folderSavingsList = Array.from(folderBreakdownMap.entries()).map(([folder, info]) => ({
      folder,
      count: info.count,
      original: info.original,
      optimized: info.optimized,
    })).sort((a, b) => (b.original - b.optimized) - (a.original - a.optimized));

    logger.printFolderSavingsTable(folderSavingsList);

    console.log('');
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      logger.printError("No report file found. Execute 'assetflow optimize' first to generate statistics.");
    } else {
      logger.printError(error.message || String(error));
    }
    process.exit(1);
  }
}

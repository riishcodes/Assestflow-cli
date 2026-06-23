import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import readline from 'node:readline';
import { formatSize, getReductionPercentage, type ReportSummary } from './metrics.js';
import type { OptimizationResult } from '../core/optimizer.js';
import type { FolderBreakdownItem } from '../core/doctor-engine.js';

let activeSpinner: Ora | null = null;
let animationsEnabled = true;

export function setAnimationsEnabled(enabled: boolean): void {
  animationsEnabled = enabled;
}

export function areAnimationsEnabled(): boolean {
  return animationsEnabled;
}

export function startSpinner(text: string): void {
  if (!animationsEnabled) {
    console.log(`  ${text}`);
    return;
  }
  if (activeSpinner) {
    activeSpinner.text = text;
  } else {
    activeSpinner = ora({
      text,
      color: 'cyan',
      spinner: 'dots',
    }).start();
  }
}

export function stopSpinner(success = true, text?: string): void {
  if (!animationsEnabled) {
    if (text) {
      console.log(`  ${success ? chalk.green('✓') : chalk.red('✗')} ${text}`);
    }
    return;
  }
  if (!activeSpinner) return;

  if (success) {
    activeSpinner.succeed(text);
  } else {
    activeSpinner.fail(text);
  }
  activeSpinner = null;
}

export function updateSpinner(text: string): void {
  if (!animationsEnabled) return;
  if (activeSpinner) {
    activeSpinner.text = text;
  }
}

/**
 * Animated Progress System
 */
export function updateProgress(completed: number, total: number, currentFile: string, startTime: number): void {
  const percent = Math.round((completed / total) * 100);
  const barWidth = 20;
  const filledWidth = Math.round((completed / total) * barWidth);
  const emptyWidth = barWidth - filledWidth;
  const bar = '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);

  const elapsedMs = Date.now() - startTime;
  const speed = completed > 0 ? (completed / (elapsedMs / 1000)) : 0;
  const eta = speed > 0 ? Math.round((total - completed) / speed) : 0;

  // Overwrite the previous 2 lines if we've already written progress
  if (completed > 0) {
    process.stdout.write('\u001b[2A');
    readline.cursorTo(process.stdout, 0);
    readline.clearLine(process.stdout, 0);
  }

  console.log(`  ${chalk.cyan(`[${bar}]`)} ${chalk.bold(percent)}% | ${completed} / ${total} | Speed: ${speed.toFixed(1)}/s | ETA: ${eta}s`);
  readline.clearLine(process.stdout, 0);
  console.log(`  ${chalk.gray('Current:')} ${chalk.white(currentFile.length > 50 ? currentFile.slice(0, 47) + '...' : currentFile)}`);
}

export function completeProgress(total: number): void {
  // Overwrite the last progress lines and clear them
  process.stdout.write('\u001b[2A');
  readline.cursorTo(process.stdout, 0);
  readline.clearLine(process.stdout, 0);
  console.log(`  ${chalk.green('✓')} Optimization complete across ${total} images.`);
  readline.clearLine(process.stdout, 0);
}

/**
 * Renders the Premium Project Detection Card.
 */
export function printProjectCard(
  version: string,
  framework: string,
  imageCount: number,
  mode: string,
  generatedCount?: number,
  totalDetectedCount?: number
): void {
  if (!animationsEnabled) {
    console.log(`AssetFlow v${version}`);
    console.log(`Framework: ${framework}`);
    console.log(`Source Images: ${imageCount}`);
    if (generatedCount !== undefined) {
      console.log(`Generated Assets: ${generatedCount}`);
    }
    if (totalDetectedCount !== undefined) {
      console.log(`Total Files Detected: ${totalDetectedCount}`);
    }
    console.log(`Mode: ${mode}`);
    console.log('──────────────────────────────────────────\n');
    return;
  }

  const border = chalk.cyan;
  console.log(border('  ╭──────────────────────────────────╮'));
  console.log(`  │  ${chalk.bold.cyan('AssetFlow')}                      │`);
  console.log(`  │  ${chalk.gray(`Image Performance CLI v${version.padEnd(5)}`)}    │`);
  console.log(border('  ├──────────────────────────────────┤'));
  console.log(`  │  ${chalk.gray('Framework:')}  ${chalk.white(framework.padEnd(18))}  │`);
  console.log(`  │  ${chalk.gray('Source Images:')} ${chalk.white(imageCount.toString().padEnd(14))}   │`);
  if (generatedCount !== undefined) {
    console.log(`  │  ${chalk.gray('Generated Assets:')} ${chalk.white(generatedCount.toString().padEnd(11))}   │`);
  }
  if (totalDetectedCount !== undefined) {
    console.log(`  │  ${chalk.gray('Total Files Detected:')} ${chalk.white(totalDetectedCount.toString().padEnd(8))}   │`);
  }
  console.log(`  │  ${chalk.gray('Mode:')}       ${chalk.white(mode.padEnd(18))}  │`);
  console.log(border('  ╰──────────────────────────────────╯\n'));
}

/**
 * Log individual file optimization outcome.
 */
export function logFileOptimization(res: OptimizationResult): void {
  if (!res.success) {
    console.log(
      `  ${chalk.red('✗')} ${chalk.gray(res.relativePath)} — ${chalk.red(res.error || 'Failed')}`
    );
    return;
  }

  // If skipped by cache
  if (res.skipped) {
    console.log(`  ${chalk.cyan('✓')} ${chalk.gray(res.relativePath)} — ${chalk.cyan('skipped (unchanged)')}`);
    return;
  }

  const hasOptimized = res.optimizedFiles.length > 0;
  const hasSkippedLarger = res.skippedLargerFiles && res.skippedLargerFiles.length > 0;

  if (hasOptimized || hasSkippedLarger) {
    console.log(`  ${chalk.green('✓')} ${chalk.bold(res.relativePath)}`);

    for (const opt of res.optimizedFiles) {
      const sizeLabel = opt.width ? ` (${opt.width}px)` : '';
      const reduction = getReductionPercentage(res.originalSize, opt.size);
      const reductionText = reduction > 0 ? ` (${reduction}% reduction)` : '';

      console.log(
        `    ${chalk.green('→')} ${chalk.bold(opt.format.toUpperCase())}${chalk.cyan(sizeLabel)}: ${chalk.gray(formatSize(res.originalSize))} ${chalk.yellow('→')} ${chalk.white(formatSize(opt.size))}${chalk.green(reductionText)}`
      );
    }

    if (hasSkippedLarger) {
      for (const item of res.skippedLargerFiles!) {
        console.log(
          `    ${chalk.yellow('Skipped:')} ${item.format.toUpperCase()} larger than source`
        );
      }
    }
  }
}

/**
 * Log watch mode optimization outcomes compactly.
 */
export function logWatchOptimization(res: OptimizationResult): void {
  if (!res.success) {
    console.log(`  ${chalk.red('✗')} ${chalk.gray(res.relativePath)} — ${chalk.red(res.error || 'Failed')}`);
    return;
  }
  if (res.skipped) {
    console.log(`  ${chalk.cyan('✓')} ${chalk.gray(res.relativePath)} — unchanged`);
    return;
  }
  if (res.optimizedFiles.length === 0) {
    console.log(`  ${chalk.yellow('✓')} ${chalk.gray(res.relativePath)} — skipped (larger than source)`);
    return;
  }
  const formats = res.optimizedFiles.map(o => o.format.toUpperCase()).join('/');
  console.log(`  ${chalk.green('✓')} ${chalk.white(res.relativePath)} — optimized to ${chalk.green(formats)}`);
}

/**
 * Calculates letter grades for health score.
 */
function getHealthGrade(score: number): { grade: string; color: (s: string) => string; desc: string } {
  if (score >= 95) return { grade: 'A+', color: chalk.green.bold, desc: 'Excellent image hygiene!' };
  if (score >= 90) return { grade: 'A', color: chalk.green.bold, desc: 'Great optimization, very fast!' };
  if (score >= 80) return { grade: 'B+', color: chalk.cyan.bold, desc: 'Good performance, minor adjustments needed.' };
  if (score >= 70) return { grade: 'B', color: chalk.yellow.bold, desc: 'Fair, some opportunities remain.' };
  if (score >= 50) return { grade: 'C', color: chalk.yellow.bold, desc: 'Needs compression & format conversion.' };
  return { grade: 'D', color: chalk.red.bold, desc: 'Critical image size bloating detected.' };
}

/**
 * Renders the Visual Health Score gauge.
 */
export function printPremiumHealthScore(score: number): void {
  const { grade, color, desc } = getHealthGrade(score);
  const barWidth = 20;
  const filled = Math.round((score / 100) * barWidth);
  const empty = barWidth - filled;
  const bar = animationsEnabled
    ? color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty))
    : '█'.repeat(filled) + '░'.repeat(empty);

  console.log(`  ${chalk.bold('Project Health Score')}\n`);
  console.log(`  ${bar}\n`);
  console.log(`  ${chalk.bold(score)} / 100\n`);
  console.log(`  ${chalk.gray('Grade:')}  ${color(grade)}`);
  console.log(`  ${chalk.gray('Status:')} ${chalk.white(desc)}\n`);
}

/**
 * Renders Before vs After optimization size visualization.
 */
export function printSizeComparison(original: number, optimized: number): void {
  const maxBarWidth = 20;
  const originalBar = animationsEnabled ? chalk.red('█'.repeat(maxBarWidth)) : '█'.repeat(maxBarWidth);
  const optimizedBarWidth = original > 0 ? Math.round((optimized / original) * maxBarWidth) : 0;
  const optimizedBar = animationsEnabled
    ? chalk.green('█'.repeat(optimizedBarWidth)) + chalk.gray('░'.repeat(maxBarWidth - optimizedBarWidth))
    : '█'.repeat(optimizedBarWidth) + '░'.repeat(maxBarWidth - optimizedBarWidth);

  const spaceSaved = original - optimized;
  const reduction = original > 0 ? Math.round((spaceSaved / original) * 100) : 0;

  console.log(`  ${chalk.bold('Optimization Impact:')}\n`);
  console.log(`    ${chalk.gray('Before')}  ${originalBar}  ${chalk.red(formatSize(original))}`);
  console.log(`    ${chalk.gray('After ')}  ${optimizedBar}  ${chalk.green(formatSize(optimized))}\n`);
  console.log(`    ${chalk.gray('Saved ')}  ${chalk.bold.green(formatSize(spaceSaved))} (${reduction}% reduction)\n`);
  console.log(`  ${chalk.gray('Original Total Size:')} ${chalk.white(formatSize(original))}`);
  console.log(`  ${chalk.gray('Space Saved:')}         ${chalk.green.bold(formatSize(spaceSaved))} (${reduction}% reduction)\n`);
}

/**
 * Visual size bars for largest files.
 */
export function printLargestAssetsVisual(assets: { path: string; size: number }[]): void {
  console.log(`  ${chalk.bold('Top 10 Largest Files:')}\n`);
  if (assets.length === 0) {
    console.log(`    ${chalk.gray('No source PNG, JPG, or JPEG files found.')}`);
    return;
  }

  const maxSize = Math.max(...assets.map(a => a.size), 1);
  const maxBarWidth = 20;

  assets.slice(0, 5).forEach((asset, idx) => {
    const barWidth = Math.round((asset.size / maxSize) * maxBarWidth);
    const bar = animationsEnabled
      ? chalk.yellow('█'.repeat(barWidth)) + chalk.gray('░'.repeat(maxBarWidth - barWidth))
      : '█'.repeat(barWidth) + '░'.repeat(maxBarWidth - barWidth);

    console.log(`    ${idx + 1}. ${chalk.white(asset.path)}`);
    console.log(`       ${bar}  ${chalk.yellow(formatSize(asset.size))}\n`);
  });
}

/**
 * Visual savings opportunities.
 */
export function printSavingsOpportunitiesVisual(opportunities: { path: string; size: number; savings: number }[]): void {
  console.log(`  ${chalk.bold('Top 10 Savings Opportunities:')}\n`);
  if (opportunities.length === 0) {
    console.log(`    ${chalk.gray('No savings opportunities detected.')}`);
    return;
  }

  const maxSavings = Math.max(...opportunities.map(o => o.savings), 1);
  const maxBarWidth = 20;

  opportunities.slice(0, 5).forEach((opp, idx) => {
    const barWidth = Math.round((opp.savings / maxSavings) * maxBarWidth);
    const bar = animationsEnabled
      ? chalk.green('█'.repeat(barWidth)) + chalk.gray('░'.repeat(maxBarWidth - barWidth))
      : '█'.repeat(barWidth) + '░'.repeat(maxBarWidth - barWidth);

    console.log(`    ${idx + 1}. ${chalk.white(opp.path)}`);
    console.log(`       ${bar}  ${chalk.gray(formatSize(opp.size))} → ${chalk.green(formatSize(opp.size - opp.savings))} (Saved: ${chalk.green.bold(formatSize(opp.savings))})\n`);
  });
}

/**
 * Renders visual breakdown tables for folders.
 */
export function printFolderBreakdownTable(folders: FolderBreakdownItem[]): void {
  console.log(`  ${chalk.bold('Folder Breakdown:')}\n`);
  if (folders.length === 0) {
    console.log(`    ${chalk.gray('No folder breakdown data available.')}`);
    return;
  }

  console.log(chalk.cyan('  ┌───────────────────────┬───────┬───────────┬──────────────────────────────┐'));
  console.log(chalk.cyan('  │') + ' Folder                ' + chalk.cyan('│') + ' Files ' + chalk.cyan('│') + ' Size      ' + chalk.cyan('│') + ' Savings                       ' + chalk.cyan('│'));
  console.log(chalk.cyan('  ├───────────────────────┼───────┼───────────┼──────────────────────────────┤'));

  const maxSavings = Math.max(...folders.map(f => f.estimatedSavings), 1);
  const barWidth = 10;

  folders.forEach((item) => {
    let folderName = item.folder;
    if (folderName.length > 21) {
      folderName = folderName.slice(0, 18) + '...';
    }
    const folderCol = folderName.padEnd(21);
    const filesCol = item.fileCount.toString().padStart(5);
    const sizeCol = formatSize(item.totalSize).padStart(9);

    const filled = Math.round((item.estimatedSavings / maxSavings) * barWidth);
    const bar = animationsEnabled
      ? chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(barWidth - filled))
      : '█'.repeat(filled) + '░'.repeat(barWidth - filled);

    const savingsText = formatSize(item.estimatedSavings);
    const savingsTextCol = savingsText.padEnd(16);

    console.log(`  ${chalk.cyan('│')} ${chalk.white(folderCol)} ${chalk.cyan('│')} ${chalk.white(filesCol)} ${chalk.cyan('│')} ${chalk.white(sizeCol)} ${chalk.cyan('│')} ${bar} ${chalk.green(savingsTextCol)} ${chalk.cyan('│')}`);
  });

  console.log(chalk.cyan('  └───────────────────────┴───────┴───────────┴──────────────────────────────┘\n'));
}

/**
 * Report folder-level savings table.
 */
export function printFolderSavingsTable(folders: { folder: string; count: number; original: number; optimized: number }[]): void {
  console.log(`  ${chalk.bold('Folder-Level Savings Breakdown:')}\n`);
  if (folders.length === 0) {
    console.log(`    ${chalk.gray('No folder breakdown data available.')}`);
    return;
  }

  console.log(chalk.cyan('  ┌───────────────────────┬───────┬─────────────┬─────────────┬────────────────┐'));
  console.log(chalk.cyan('  │') + ' Folder                ' + chalk.cyan('│') + ' Files ' + chalk.cyan('│') + ' Before      ' + chalk.cyan('│') + ' After       ' + chalk.cyan('│') + ' Saved           ' + chalk.cyan('│'));
  console.log(chalk.cyan('  ├───────────────────────┼───────┼─────────────┼─────────────┼────────────────┤'));

  folders.forEach((item) => {
    let folderName = item.folder;
    if (folderName.length > 21) {
      folderName = folderName.slice(0, 18) + '...';
    }
    const folderCol = folderName.padEnd(21);
    const filesCol = item.count.toString().padStart(5);
    const originalCol = formatSize(item.original).padStart(11);
    const optimizedCol = formatSize(item.optimized).padStart(11);
    const savedBytes = Math.max(0, item.original - item.optimized);
    const savedCol = formatSize(savedBytes).padStart(14);

    console.log(`  ${chalk.cyan('│')} ${chalk.white(folderCol)} ${chalk.cyan('│')} ${chalk.white(filesCol)} ${chalk.cyan('│')} ${chalk.white(originalCol)} ${chalk.cyan('│')} ${chalk.white(optimizedCol)} ${chalk.cyan('│')} ${chalk.green(savedCol)} ${chalk.cyan('│')}`);
  });

  console.log(chalk.cyan('  └───────────────────────┴───────┴─────────────┴─────────────┴────────────────┘\n'));
}

/**
 * Graded impact recommendations dashboard.
 */
export function printRankedRecommendations(recommendations: string[], audit: any): void {
  console.log(`  ${chalk.bold('Recommendations:')}\n`);

  if (recommendations.length === 0 && audit.healthScore === 100) {
    console.log(`    ${chalk.green('✓')} All images fully optimized! Keep up the good work.`);
    return;
  }

  const categorized: { impact: 'High' | 'Medium' | 'Low'; text: string; color: (s: string) => string }[] = [];

  // Parse potential savings for converters
  if (audit.potentialSavingsBytes >= 5 * 1024 * 1024) {
    categorized.push({
      impact: 'High',
      color: chalk.red.bold,
      text: `Convert source images to WebP/AVIF to leverage modern formats (Potential Savings: ${formatSize(audit.potentialSavingsBytes)})`
    });
  } else if (audit.potentialSavingsBytes >= 1 * 1024 * 1024) {
    categorized.push({
      impact: 'Medium',
      color: chalk.yellow.bold,
      text: `Convert source images to WebP/AVIF (Potential Savings: ${formatSize(audit.potentialSavingsBytes)})`
    });
  } else if (audit.potentialSavingsBytes > 0) {
    categorized.push({
      impact: 'Low',
      color: chalk.cyan.bold,
      text: `Optimize remaining assets (Potential Savings: ${formatSize(audit.potentialSavingsBytes)})`
    });
  }

  // Parse deductions
  const over1MbCount = audit.deductions.filter((d: any) => d.reason.includes('larger than 1MB')).length;
  if (over1MbCount > 0) {
    const sizeSavings = over1MbCount * 800 * 1024;
    categorized.push({
      impact: over1MbCount > 5 ? 'High' : 'Medium',
      color: over1MbCount > 5 ? chalk.red.bold : chalk.yellow.bold,
      text: `Compress ${over1MbCount} oversized image(s) > 1MB using lower quality presets or responsive scaling (Est. Savings: ${formatSize(sizeSavings)})`
    });
  }

  const metadataCount = audit.deductions.filter((d: any) => d.reason.includes('embedded metadata')).length;
  if (metadataCount > 0) {
    const metadataSavings = metadataCount * 15 * 1024;
    categorized.push({
      impact: 'Low',
      color: chalk.cyan.bold,
      text: `Strip embedded metadata from ${metadataCount} image(s) to remove camera profiles (Est. Savings: ${formatSize(metadataSavings)})`
    });
  }

  const order = { High: 0, Medium: 1, Low: 2 };
  categorized.sort((a, b) => order[a.impact] - order[b.impact]);

  categorized.forEach((rec) => {
    console.log(`    [${rec.color(rec.impact + ' Impact')}]`);
    console.log(`    ${chalk.white(rec.text)}\n`);
  });
}

/**
 * Helper to dynamically align and construct a bordered console card line.
 */
function formatBoxLine(label: string, valueStr: string, colorFn: (s: string) => string = (s) => s): string {
  const interiorWidth = 52;
  const spacesCount = interiorWidth - label.length - valueStr.length;
  const spaces = ' '.repeat(Math.max(1, spacesCount));
  return `  │  ${label}${spaces}${colorFn(valueStr)}  │`;
}

/**
 * Renders a premium visual completion card.
 */
export function printCompletionCard(summary: ReportSummary, healthBefore: number, healthAfter: number): void {
  const border = chalk.cyan('  ════════════════════════════════════════════════════════');
  console.log(`\n${border}`);
  console.log(`  ${chalk.bold.green('          AssetFlow CLI — Optimization Summary')}`);
  console.log(`${border}\n`);

  console.log(formatBoxLine('Source Images:', summary.sourceImages.toString(), chalk.white));
  console.log(formatBoxLine('Optimized:', summary.optimizedCount.toString(), chalk.white));
  console.log(formatBoxLine('Skipped (Cache):', summary.cacheSkippedCount.toString(), chalk.white));
  console.log(formatBoxLine('Skipped (Larger Out):', summary.largerOutputSkippedCount.toString(), chalk.white));
  console.log(formatBoxLine('Errors:', summary.errorCount.toString(), chalk.white));
  console.log('  ├──────────────────────────────────────────────────────┤');
  console.log(formatBoxLine('Space Saved:', formatSize(summary.spaceSaved), chalk.green.bold));
  console.log(formatBoxLine('Reduction:', Math.round(summary.averageReduction) + '%', chalk.green));
  console.log(formatBoxLine('Execution Time:', (summary.executionTimeMs / 1000).toFixed(2) + 's', chalk.white));
  
  if (healthBefore !== healthAfter) {
    console.log('  ├──────────────────────────────────────────────────────┤');
    console.log(formatBoxLine('Health Score:', `${healthBefore} → ${healthAfter}`, chalk.cyan.bold));
  }

  console.log(`\n${border}\n`);
}

/**
 * Prints generic success status.
 */
export function printSuccess(text: string): void {
  console.log(`  ${chalk.green.bold('✓')} ${text}`);
}

/**
 * Prints generic warning message.
 */
export function printWarning(text: string): void {
  console.log(`  ${chalk.yellow.bold('⚠️')} ${chalk.yellow(text)}`);
}

/**
 * Prints generic error message.
 */
export function printError(text: string): void {
  console.log(`  ${chalk.red.bold('Error:')} ${chalk.red(text)}`);
}

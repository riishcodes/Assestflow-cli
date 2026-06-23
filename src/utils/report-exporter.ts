import fs from 'node:fs/promises';
import path from 'node:path';
import type { OptimizationResult } from '../core/optimizer.js';
import { getReductionPercentage } from './metrics.js';
import type { AssetFlowConfig } from '../config/schema.js';

export interface ReportFileItem {
  filePath: string;
  originalSize: number;
  optimizedSize: number;
  reductionPercentage: number;
  success: boolean;
  error: string | null;
  outputs: {
    path: string;
    size: number;
    format: string;
    width: number | null;
    height: number | null;
  }[];
}

export interface ReportJsonData {
  version: string;
  generatedAt: string;
  config: AssetFlowConfig;
  timestamp: string; // backward compatibility
  summary: {
    totalOriginalImages: number; // backward compatibility
    totalOriginalSize: number;
    totalOptimizedSize: number;
    spaceSaved: number;
    averageReduction: number;
    sourceImages: number;
    generatedAssets: number;
    optimizedCount: number;
    cacheSkippedCount: number;
    largerOutputSkippedCount: number;
    errorCount: number;
  };
  files: ReportFileItem[];
  warnings: string[];
  recommendations: string[];
  healthScore: number | null;
}

/**
 * Saves a detailed run report to assetflow-report.json in the project root.
 * @param projectRoot Base directory of the project
 * @param results File optimization results
 * @param config Configuration used during optimization
 * @param healthScore Determined health score (optional)
 * @param recommendations Custom tips generated (optional)
 */
export async function exportReportJson(
  projectRoot: string,
  results: OptimizationResult[],
  config: AssetFlowConfig,
  healthScore: number | null = null,
  recommendations: string[] = []
): Promise<string> {
  const filePath = path.join(projectRoot, 'assetflow-report.json');

  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  let sourceImages = results.length;
  let optimizedCount = 0;
  let cacheSkippedCount = 0;
  let largerOutputSkippedCount = 0;
  let errorCount = 0;
  let generatedAssets = 0;

  const filesList: ReportFileItem[] = results.map((res) => {
    totalOriginalSize += res.originalSize;

    if (!res.success) {
      errorCount++;
    } else if (res.skipped) {
      cacheSkippedCount++;
    } else if (res.optimizedFiles.length === 0) {
      largerOutputSkippedCount++;
    } else {
      optimizedCount++;
    }

    let imageOutputSize = 0;
    const outputs = res.optimizedFiles.map((opt) => {
      imageOutputSize += opt.size;
      generatedAssets++;
      return {
        path: opt.relativePath,
        size: opt.size,
        format: opt.format,
        width: opt.width,
        height: opt.height,
      };
    });

    const effectiveOptimizedSize = res.success && res.optimizedFiles.length > 0 ? imageOutputSize : res.originalSize;
    totalOptimizedSize += effectiveOptimizedSize;

    return {
      filePath: res.relativePath,
      originalSize: res.originalSize,
      optimizedSize: effectiveOptimizedSize,
      reductionPercentage: res.success && res.optimizedFiles.length > 0 ? getReductionPercentage(res.originalSize, imageOutputSize) : 0,
      success: res.success,
      error: res.error,
      outputs,
    };
  });

  const spaceSaved = Math.max(0, totalOriginalSize - totalOptimizedSize);
  const averageReduction = totalOriginalSize > 0
    ? (spaceSaved / totalOriginalSize) * 100
    : 0;

  const warnings: string[] = [];
  for (const res of results) {
    if (!res.success && res.error) {
      warnings.push(`File ${res.relativePath} failed: ${res.error}`);
    }
  }

  const reportData: ReportJsonData = {
    version: '0.1.0',
    generatedAt: new Date().toISOString(),
    config,
    timestamp: new Date().toISOString(),
    summary: {
      totalOriginalImages: sourceImages,
      totalOriginalSize,
      totalOptimizedSize,
      spaceSaved,
      averageReduction: Math.round(averageReduction),
      sourceImages,
      generatedAssets,
      optimizedCount,
      cacheSkippedCount,
      largerOutputSkippedCount,
      errorCount,
    },
    files: filesList,
    warnings,
    recommendations,
    healthScore,
  };

  await fs.writeFile(filePath, JSON.stringify(reportData, null, 2), 'utf8');
  return filePath;
}

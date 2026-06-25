/*
 * Copyright (c) 2026 AssetFlow.
 *
 * Licensed under the AssetFlow Community License.
 * Commercial use requires a commercial license.
 *
 * https://flow.riish.in
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import type { ScannedFile } from './scanner.js';
import { getDefaultConfig, type AssetFlowConfig } from '../config/schema.js';

export interface FolderBreakdownItem {
  folder: string;
  fileCount: number;
  totalSize: number;
  estimatedSavings: number;
}

export interface DoctorReport {
  healthScore: number;
  totalSize: number;
  totalImages: number; // Source images (png, jpg, jpeg)
  generatedAssets: number; // WebP, AVIF, SVG
  totalFilesDetected: number; // Total files scanned
  potentialSavingsBytes: number;
  largestAssets: { path: string; size: number }[];
  savingsOpportunities: { path: string; size: number; savings: number }[];
  folderBreakdown: FolderBreakdownItem[];
  deductions: { reason: string; points: number }[];
  recommendations: string[];
  breakdown: {
    sizeEfficiency: number;
    modernFormats: number;
    metadataHygiene: number;
    assetOptimization: number;
  };
}

/**
 * Estimates the savings ratio for a sampled file by doing in-memory compression.
 */
async function estimateReductionRatio(file: ScannedFile, config: AssetFlowConfig): Promise<number> {
  try {
    const stats = await fs.stat(file.absolutePath);
    const originalSize = stats.size;
    if (originalSize === 0) return 0;

    const formats: ('webp' | 'avif')[] = [];
    if (config.format === 'both') {
      formats.push('webp', 'avif');
    } else {
      formats.push(config.format);
    }

    let totalOutputSize = 0;
    for (const format of formats) {
      let pipeline = sharp(file.absolutePath);
      // Keep metadata if configured
      if (config.keepMetadata) {
        pipeline = pipeline.keepMetadata();
      }
      
      if (format === 'webp') {
        pipeline = pipeline.webp({ quality: config.quality });
      } else {
        pipeline = pipeline.avif({ quality: config.quality });
      }
      
      const buffer = await pipeline.toBuffer();
      totalOutputSize += buffer.length;
    }

    const avgOutputSize = totalOutputSize / formats.length;
    const reductionRatio = (originalSize - avgOutputSize) / originalSize;
    return Math.max(0, reductionRatio);
  } catch {
    // Safe fallbacks if processing fails
    return file.extension === 'png' ? 0.75 : 0.60;
  }
}

/**
 * Runs a deterministic health audit across scanned project images.
 * @param files Scanned files in the workspace
 * @param config Optional project configuration to align savings estimations
 * @returns DoctorReport containing health score, savings estimation, and recommendations
 */
export async function runDoctorAudit(files: ScannedFile[], config?: AssetFlowConfig): Promise<DoctorReport> {
  const activeConfig = config || getDefaultConfig();
  let healthScore = 100;
  let totalSize = 0;
  const deductions: { reason: string; points: number }[] = [];
  const largestAssets: { path: string; size: number }[] = [];

  const sourceImageExtensions = ['png', 'jpg', 'jpeg'];
  const sourceImages = files.filter(f => sourceImageExtensions.includes(f.extension));
  const generatedAssets = files.filter(f => !sourceImageExtensions.includes(f.extension));

  // 1. Collect file stats and details
  const fileDetails: { file: ScannedFile; size: number }[] = [];
  for (const file of sourceImages) {
    let size = 0;
    try {
      const stats = await fs.stat(file.absolutePath);
      size = stats.size;
      totalSize += size;
      largestAssets.push({ path: file.relativePath, size });
    } catch {
      // Treat size as 0 if stat fails (e.g. mock paths in unit tests)
    }
    fileDetails.push({ file, size });
  }

  // 2. Perform compression sampling for PNG and JPG to estimate real savings opportunities
  const pngs = sourceImages.filter(f => f.extension === 'png');
  const jpgs = sourceImages.filter(f => ['jpg', 'jpeg'].includes(f.extension));

  // Sample up to 5 of each type
  const pngSamples = pngs.slice(0, 5);
  const jpgSamples = jpgs.slice(0, 5);

  let pngSavingsSum = 0;
  for (const sample of pngSamples) {
    pngSavingsSum += await estimateReductionRatio(sample, activeConfig);
  }
  const pngSavingsRatio = pngSamples.length > 0 ? pngSavingsSum / pngSamples.length : 0.75;

  let jpgSavingsSum = 0;
  for (const sample of jpgSamples) {
    jpgSavingsSum += await estimateReductionRatio(sample, activeConfig);
  }
  const jpgSavingsRatio = jpgSamples.length > 0 ? jpgSavingsSum / jpgSamples.length : 0.60;

  // 3. Process each source image for deductions and estimated savings
  let metadataCount = 0;
  let missingAlternativesCount = 0;
  let over1MbCount = 0;
  let pngOver500KbCount = 0;
  let oversizedImagesCount = 0;
  let potentialSavingsBytes = 0;

  const savingsOpportunities: { path: string; size: number; savings: number }[] = [];
  const folderMap = new Map<string, { count: number; size: number; savings: number }>();

  for (const detail of fileDetails) {
    const { file, size } = detail;
    let isOversized = false;

    // Deduct for files larger than 1MB (-5 points)
    if (size > 1024 * 1024) {
      over1MbCount++;
      isOversized = true;
      deductions.push({
        reason: `Image "${file.relativePath}" is larger than 1MB`,
        points: 5,
      });
    }

    // Deduct for PNGs larger than 500KB (-2 points)
    if (file.extension === 'png' && size > 500 * 1024) {
      pngOver500KbCount++;
      isOversized = true;
      deductions.push({
        reason: `PNG image "${file.relativePath}" is larger than 500KB`,
        points: 2,
      });
    }

    if (isOversized) {
      oversizedImagesCount++;
    }

    // Deduct for metadata presence (-3 points)
    let hasMetadata = false;
    try {
      const metadata = await sharp(file.absolutePath).metadata();
      if (metadata.exif || metadata.iptc || metadata.xmp || metadata.icc) {
        hasMetadata = true;
        metadataCount++;
        deductions.push({
          reason: `Image "${file.relativePath}" contains embedded metadata`,
          points: 3,
        });
      }
    } catch {
      // Ignore image parsing errors during doctor checks
    }

    // Deduct for missing WebP/AVIF optimized alternative version (-5 points)
    const fileDir = path.dirname(file.absolutePath);
    const baseName = path.basename(file.absolutePath, path.extname(file.absolutePath)).toLowerCase();
    
    const hasOptimizedVersion = files.some(f => {
      if (!['webp', 'avif'].includes(f.extension)) return false;
      const otherDir = path.dirname(f.absolutePath);
      const otherBaseName = path.basename(f.absolutePath, path.extname(f.absolutePath)).toLowerCase();
      return fileDir === otherDir && (otherBaseName === baseName || otherBaseName.startsWith(`${baseName}-`));
    });

    if (!hasOptimizedVersion) {
      missingAlternativesCount++;
      deductions.push({
        reason: `Image "${file.relativePath}" lacks optimized WebP or AVIF alternative`,
        points: 5,
      });
    }

    // Estimate file-specific savings
    // If the file already has an optimized version, its potential savings are 0!
    const savingsRatio = file.extension === 'png' ? pngSavingsRatio : jpgSavingsRatio;
    const fileSavings = hasOptimizedVersion ? 0 : Math.round(size * savingsRatio);
    potentialSavingsBytes += fileSavings;

    savingsOpportunities.push({
      path: file.relativePath,
      size,
      savings: fileSavings,
    });

    // Group by folder path (relative to workspace)
    const relativeFolder = path.dirname(file.relativePath).replace(/\\/g, '/');
    const folderKey = relativeFolder === '.' ? 'root' : relativeFolder;
    
    const existing = folderMap.get(folderKey) || { count: 0, size: 0, savings: 0 };
    folderMap.set(folderKey, {
      count: existing.count + 1,
      size: existing.size + size,
      savings: existing.savings + fileSavings,
    });
  }

  // Calculate weighted health score
  let sizeEfficiency = 100;
  let modernFormats = 100;
  let assetOptimization = 100;
  let metadataHygiene = 100;

  if (sourceImages.length > 0) {
    sizeEfficiency = Math.round(totalSize > 0 ? (1 - (potentialSavingsBytes / totalSize)) * 100 : 100);
    modernFormats = Math.round(((sourceImages.length - missingAlternativesCount) / sourceImages.length) * 100);
    assetOptimization = Math.round(((sourceImages.length - oversizedImagesCount) / sourceImages.length) * 100);
    metadataHygiene = Math.round(((sourceImages.length - metadataCount) / sourceImages.length) * 100);

    healthScore = (sizeEfficiency * 0.40) +
                  (modernFormats * 0.25) +
                  (assetOptimization * 0.25) +
                  (metadataHygiene * 0.10);
  }

  // Cap healthScore securely to stay between 0 and 100
  healthScore = Math.min(100, Math.max(0, Math.round(healthScore)));

  // Generate actionable recommendations
  const recommendations: string[] = [];
  if (missingAlternativesCount > 0) {
    const pngsCount = sourceImages.filter(f => f.extension === 'png').length;
    if (pngsCount > 0) {
      recommendations.push(`Convert ${pngsCount} PNG file(s) to WebP/AVIF to leverage modern formats.`);
    }
    const jpgsCount = sourceImages.filter(f => ['jpg', 'jpeg'].includes(f.extension)).length;
    if (jpgsCount > 0) {
      recommendations.push(`Optimize ${jpgsCount} JPEG/JPG file(s) to compress sizes.`);
    }
  }

  if (over1MbCount > 0) {
    recommendations.push(`Compress ${over1MbCount} image(s) larger than 1MB using lower quality presets or responsive scaling.`);
  }

  if (metadataCount > 0) {
    recommendations.push(`Remove embedded metadata from ${metadataCount} file(s) to strip unnecessary camera and color profiles.`);
  }

  // Sort and slice lists
  const sortedLargestAssets = largestAssets
    .sort((a, b) => b.size - a.size)
    .slice(0, 10);

  const sortedSavingsOpportunities = savingsOpportunities
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 10);

  // Folder breakdown conversion
  const folderBreakdown: FolderBreakdownItem[] = Array.from(folderMap.entries()).map(([folder, item]) => ({
    folder,
    fileCount: item.count,
    totalSize: item.size,
    estimatedSavings: item.savings,
  })).sort((a, b) => b.estimatedSavings - a.estimatedSavings);

  return {
    healthScore,
    totalSize,
    totalImages: sourceImages.length,
    generatedAssets: generatedAssets.length,
    totalFilesDetected: files.length,
    potentialSavingsBytes,
    largestAssets: sortedLargestAssets,
    savingsOpportunities: sortedSavingsOpportunities,
    folderBreakdown,
    deductions,
    recommendations,
    breakdown: {
      sizeEfficiency,
      modernFormats,
      metadataHygiene,
      assetOptimization,
    },
  };
}

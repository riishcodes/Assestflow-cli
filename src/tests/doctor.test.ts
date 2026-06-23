import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { runDoctorAudit } from '../core/doctor-engine.js';
import { setupTestWorkspace, cleanupTestWorkspace, getWorkspaceRoot } from './helpers.js';
import { scanDirectories } from '../core/scanner.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

describe('Doctor Auditing & Health Scoring', () => {
  const root = getWorkspaceRoot('doctor');

  beforeAll(async () => {
    await setupTestWorkspace('doctor');
  });

  afterAll(async () => {
    await cleanupTestWorkspace('doctor');
  });

  it('should run audit, identify largest files, and suggest actions', async () => {
    const files = await scanDirectories(root);
    const audit = await runDoctorAudit(files);

    expect(audit.totalImages).toBe(2);
    expect(audit.totalSize).toBeGreaterThan(0);
    expect(audit.potentialSavingsBytes).toBeGreaterThan(0);

    // Verify Largest Assets list
    expect(audit.largestAssets.length).toBe(2);
    expect(audit.largestAssets[0].size).toBeGreaterThanOrEqual(audit.largestAssets[1].size);

    // Deducted for missing optimized versions
    expect(audit.healthScore).toBeLessThan(100);

    expect(audit.recommendations.length).toBeGreaterThan(0);
    const hasConvertRec = audit.recommendations.some(r => r.includes('Convert'));
    expect(hasConvertRec).toBe(true);
  });

  it('should score an empty project as 100', async () => {
    const audit = await runDoctorAudit([]);
    expect(audit.healthScore).toBe(100);
    expect(audit.totalImages).toBe(0);
    expect(audit.totalSize).toBe(0);
    expect(audit.potentialSavingsBytes).toBe(0);
    expect(audit.folderBreakdown.length).toBe(0);
  });

  it('should score a perfect project as 100', async () => {
    // Create a special subdirectory for perfect project test
    const perfDir = path.join(root, 'perfect');
    await fs.mkdir(perfDir, { recursive: true });

    // 1. Write original small JPEG
    const jpgPath = path.join(perfDir, 'small.jpg');
    await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
      .jpeg()
      .toFile(jpgPath);

    // 2. Write its WebP optimized version in the same directory (no metadata, small)
    const webpPath = path.join(perfDir, 'small.webp');
    await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
      .webp()
      .toFile(webpPath);

    const config = {
      format: 'webp' as const,
      quality: 80,
      preset: 'balanced' as const,
      responsive: false,
      deleteOriginal: false,
      keepMetadata: false,
      directories: ['perfect'],
      ignore: [],
      sizes: [],
      force: false,
      watch: false
    };

    // Scan only this directory
    const files = await scanDirectories(root, { directories: ['perfect'] });
    const audit = await runDoctorAudit(files, config);

    // Should score 100 because the original has an optimized webp version, is tiny, and has no metadata
    expect(audit.healthScore).toBe(100);
    expect(audit.totalImages).toBe(1);
    expect(audit.generatedAssets).toBe(1);
  });

  it('should score a poor project at 0 and never go negative', async () => {
    // Create many unoptimized large files in a folder to drain the score below 0
    const poorFilesList = [];
    for (let i = 0; i < 30; i++) {
      poorFilesList.push({
        absolutePath: `/mock/path/image_${i}.png`,
        relativePath: `poor/image_${i}.png`,
        extension: 'png'
      });
    }

    // Since we mock the files array and runDoctorAudit reads stats, let's test it with files having stats error or mock it.
    // If stats fail, they are skipped from stats analysis, but unoptimized version check still runs!
    // Unoptimized version deduction: -5 points per missing alternative.
    // 30 files lacking webp/avif alternatives = 30 * -5 = -150 points.
    // Score should be securely capped at 0.
    const audit = await runDoctorAudit(poorFilesList);
    expect(audit.healthScore).toBe(0);
  });
});

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { optimizeImage } from '../core/optimizer.js';
import { scanDirectories } from '../core/scanner.js';
import { loadConfig, mergeConfig } from '../config/manager.js';
import { setupTestWorkspace, cleanupTestWorkspace, getWorkspaceRoot } from './helpers.js';
import { getDefaultConfig } from '../config/schema.js';

describe('Robustness and Edge Cases', () => {
  const root = getWorkspaceRoot('robustness');

  beforeAll(async () => {
    await setupTestWorkspace('robustness');
  });

  afterAll(async () => {
    await cleanupTestWorkspace('robustness');
  });

  it('should handle corrupted JPG file gracefully', async () => {
    const corruptJpgPath = path.join(root, 'src', 'corrupt.jpg');
    // Write random invalid bytes
    await fs.writeFile(corruptJpgPath, Buffer.from([0x12, 0x34, 0x56, 0x78, 0x90]));

    const file = {
      absolutePath: corruptJpgPath,
      relativePath: 'src/corrupt.jpg',
      extension: 'jpg',
    };

    const config = getDefaultConfig();
    const result = await optimizeImage(file, config, root);

    // Should fail gracefully and return success: false with an error message
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain('unsupported image format');
  });

  it('should handle corrupted PNG file gracefully', async () => {
    const corruptPngPath = path.join(root, 'src', 'corrupt.png');
    await fs.writeFile(corruptPngPath, Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]));

    const file = {
      absolutePath: corruptPngPath,
      relativePath: 'src/corrupt.png',
      extension: 'png',
    };

    const config = getDefaultConfig();
    const result = await optimizeImage(file, config, root);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle empty file (0 bytes) gracefully', async () => {
    const emptyPath = path.join(root, 'src', 'empty.jpg');
    await fs.writeFile(emptyPath, Buffer.from([]));

    const file = {
      absolutePath: emptyPath,
      relativePath: 'src/empty.jpg',
      extension: 'jpg',
    };

    const config = getDefaultConfig();
    const result = await optimizeImage(file, config, root);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle missing directories by returning empty files list', async () => {
    const config = getDefaultConfig();
    config.directories = ['non_existent_folder_abc'];

    const files = await scanDirectories(root, config);
    expect(files.length).toBe(0);
  });

  it('should handle deeply nested directories', async () => {
    const nestedDir = path.join(root, 'src', 'foo', 'bar', 'baz');
    await fs.mkdir(nestedDir, { recursive: true });

    const nestedImgPath = path.join(nestedDir, 'nested.jpg');
    await fs.writeFile(nestedImgPath, Buffer.from([0xFF, 0xD8, 0xFF, 0xE0])); // Fake JPEG header

    const config = getDefaultConfig();
    const files = await scanDirectories(root, config);

    const hasNested = files.some(f => f.relativePath.includes('nested.jpg'));
    expect(hasNested).toBe(true);
  });

  it('should support force mode override', async () => {
    const file = {
      absolutePath: path.join(root, 'src', 'avatar.jpg'),
      relativePath: 'src/avatar.jpg',
      extension: 'jpg',
    };

    const config = getDefaultConfig();
    config.force = true;

    // Run first time
    const res1 = await optimizeImage(file, config, root);
    // Run second time (with force: true, it should reprocess and NOT say skipped: true)
    const res2 = await optimizeImage(file, config, root, { cachedHash: res1.hash });

    expect(res2.success).toBe(true);
    expect(res2.skipped).toBeUndefined(); // Force prevents skipping
  });

  it('should respect config overrides in mergeConfig', () => {
    const fileConfig = getDefaultConfig();
    const overrides = {
      quality: 75,
      preset: 'quality' as const,
      format: 'avif' as const,
    };

    const merged = mergeConfig(fileConfig, overrides);
    expect(merged.quality).toBe(75);
    expect(merged.format).toBe('avif');
  });

  it('should fall back to defaults when config file is missing', async () => {
    const config = await loadConfig(path.join(root, 'non_existent_folder_xyz'));
    expect(config).toBeDefined();
    expect(config.quality).toBe(80);
    expect(config.format).toBe('webp');
  });
});

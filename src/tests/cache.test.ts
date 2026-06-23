import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readCache, writeCache, compareCache } from '../core/cache-manager.js';
import { setupTestWorkspace, cleanupTestWorkspace, getWorkspaceRoot } from './helpers.js';

describe('Cache Manager & historical Comparisons', () => {
  const root = getWorkspaceRoot('cache');

  beforeAll(async () => {
    await setupTestWorkspace('cache');
  });

  afterAll(async () => {
    await cleanupTestWorkspace('cache');
  });

  it('should return null when reading empty cache', async () => {
    const data = await readCache(root);
    expect(data).toBeNull();
  });

  it('should write cache data and read it back successfully', async () => {
    const mockCache = {
      images: 42,
      totalSize: '4.2 MB',
      totalSizeBytes: 4404019,
      healthScore: 88,
      hashes: {},
    };

    await writeCache(root, mockCache);

    const loaded = await readCache(root);
    expect(loaded).not.toBeNull();
    expect(loaded?.images).toBe(42);
    expect(loaded?.totalSize).toBe('4.2 MB');
    expect(loaded?.totalSizeBytes).toBe(4404019);
    expect(loaded?.healthScore).toBe(88);
    expect(loaded?.timestamp).toBeDefined();
  });

  it('should accurately compute comparisons against previous cache runs', () => {
    const previous = {
      images: 10,
      totalSize: '2.0 MB',
      totalSizeBytes: 2097152,
      healthScore: 80,
      timestamp: new Date().toISOString(),
      hashes: {},
    };

    const delta = compareCache(95, 1572864, 12, previous);

    expect(delta.previousScore).toBe(80);
    expect(delta.currentScore).toBe(95);
    expect(delta.scoreImprovement).toBe(15);
    expect(delta.sizeSavedBytes).toBe(524288);
    expect(delta.imageCountDelta).toBe(2);
  });

  it('should accurately compare scores when health score is 0', () => {
    const previous = {
      images: 5,
      totalSize: '1.0 MB',
      totalSizeBytes: 1048576,
      healthScore: 0,
      timestamp: new Date().toISOString(),
      hashes: {},
    };

    const delta = compareCache(0, 1048576, 5, previous);
    expect(delta.scoreImprovement).toBe(0); // Should be 0, not 100
  });

  it('should handle null previous cache on comparison', () => {
    const delta = compareCache(90, 1048576, 5, null);
    expect(delta.previousScore).toBeNull();
    expect(delta.scoreImprovement).toBeNull();
    expect(delta.sizeSavedBytes).toBeNull();
    expect(delta.imageCountDelta).toBeNull();
  });
});

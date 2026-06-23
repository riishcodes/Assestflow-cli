import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execa } from 'execa';
import fs from 'node:fs/promises';
import path from 'node:path';
import { setupTestWorkspace, cleanupTestWorkspace, getWorkspaceRoot } from './helpers.js';

describe('AssetFlow CLI — E2E Command Integration', () => {
  const root = getWorkspaceRoot('e2e');
  const cliBinary = path.resolve(process.cwd(), 'dist', 'index.js');

  beforeAll(async () => {
    // Setup clean workspace with mock images
    await setupTestWorkspace('e2e');
  });

  afterAll(async () => {
    await cleanupTestWorkspace('e2e');
  });

  it('should run dry-run optimization and estimate savings without writing files', async () => {
    const { stdout } = await execa('node', [cliBinary, '--dry-run'], { cwd: root });

    expect(stdout).toContain('Optimizing assets');
    expect(stdout).toContain('Optimization Summary');
    
    // Verify no optimized output files were generated
    const webpExists = await fs.stat(path.join(root, 'public', 'images', 'hero.webp'))
      .then(() => true)
      .catch(() => false);
    expect(webpExists).toBe(false);
  });

  it('should run optimization and write WebP files to disk', async () => {
    const { stdout } = await execa('node', [cliBinary], { cwd: root });

    expect(stdout).toContain('Source Images:');
    expect(stdout).toContain('AssetFlow CLI — Optimization Summary');
    
    // Verify WebP files exist
    const heroWebpExists = await fs.stat(path.join(root, 'public', 'images', 'hero.webp'))
      .then(() => true)
      .catch(() => false);
    const avatarWebpExists = await fs.stat(path.join(root, 'src', 'avatar.webp'))
      .then(() => true)
      .catch(() => false);
    
    expect(heroWebpExists).toBe(true);
    expect(avatarWebpExists).toBe(true);

    // Verify report json is exported
    const reportPath = path.join(root, 'assetflow-report.json');
    const reportExists = await fs.stat(reportPath).then(() => true).catch(() => false);
    expect(reportExists).toBe(true);

    const reportContent = await fs.readFile(reportPath, 'utf8');
    const parsed = JSON.parse(reportContent);
    expect(parsed.summary.sourceImages).toBe(2);
    expect(parsed.healthScore).toBe(100); // 100 since WebPs now exist!
    expect(parsed.version).toBe('0.1.0');
    expect(parsed.config).toBeDefined();
  });

  it('should run doctor command and return health status info', async () => {
    const { stdout } = await execa('node', [cliBinary, 'doctor'], { cwd: root });

    expect(stdout).toContain('Project Image Audit');
    expect(stdout).toContain('Project Health Score');
    expect(stdout).toContain('Source Images:');
    expect(stdout).toContain('Existing Optimized Assets:');
    expect(stdout).toContain('Total Files Detected:');
    expect(stdout).toContain('Top 10 Largest Files');
    expect(stdout).toContain('Top 10 Savings Opportunities');
    expect(stdout).toContain('Folder Breakdown');
    expect(stdout).toContain('Recommendations');
  });

  it('should run report command and load latest statistics', async () => {
    const { stdout } = await execa('node', [cliBinary, 'report'], { cwd: root });

    expect(stdout).toContain('Last Optimization Report');
    expect(stdout).toContain('Source Images:');
    expect(stdout).toContain('Existing Optimized Assets:');
    expect(stdout).toContain('Original Total Size');
    expect(stdout).toContain('Space Saved');
    expect(stdout).toContain('Largest Saving Asset');
    expect(stdout).toContain('Average Savings Per File');
    expect(stdout).toContain('Folder-Level Savings Breakdown');
  });

  it('should run report command with --json and output raw JSON', async () => {
    const { stdout } = await execa('node', [cliBinary, 'report', '--json'], { cwd: root });

    const parsed = JSON.parse(stdout);
    expect(parsed.summary).toBeDefined();
    expect(parsed.healthScore).toBeDefined();
    expect(parsed.timestamp).toBeDefined();
  });

  it('should run init command and create config file', async () => {
    const configPath = path.join(root, 'assetflow.config.json');
    await fs.rm(configPath, { force: true });

    const { stdout } = await execa('node', [cliBinary, 'init'], { cwd: root });
    expect(stdout).toContain('Created assetflow.config.json');

    const exists = await fs.stat(configPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);

    const configContent = await fs.readFile(configPath, 'utf8');
    const parsed = JSON.parse(configContent);
    expect(parsed.format).toBe('webp');
    expect(parsed.quality).toBe(80);
  });

  it('should run watch mode and auto-optimize added images', async () => {
    // Start watch process asynchronously
    const watchProcess = execa('node', [cliBinary, 'watch'], { cwd: root });

    // Wait 3 seconds for watcher to initialize
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Copy a new file to trigger watcher
    const sourcePng = path.join(root, 'public', 'images', 'hero.png');
    const newPng = path.join(root, 'public', 'images', 'secondary.png');
    await fs.copyFile(sourcePng, newPng);

    // Wait 3 seconds for Chokidar write stability and Sharp optimization
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Verify optimized output exists
    const newWebp = path.join(root, 'public', 'images', 'secondary.webp');
    const webpExists = await fs.stat(newWebp).then(() => true).catch(() => false);

    // Stop watch process
    watchProcess.kill('SIGINT');

    expect(webpExists).toBe(true);
  }, 20000); // Set timeout of 20 seconds
});

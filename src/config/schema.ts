/*
 * Copyright (c) 2026 AssetFlow.
 *
 * Licensed under the AssetFlow Community License.
 * Commercial use requires a commercial license.
 *
 * https://flow.riish.in
 */
import { z } from 'zod';

export const ConfigSchema = z.object({
  quality: z.number().int().min(1).max(100).default(80),
  format: z.enum(['webp', 'avif', 'both']).default('webp'),
  deleteOriginal: z.boolean().default(false),
  watch: z.boolean().default(false),
  directories: z.array(z.string()).default(['src', 'public', 'assets', 'images']),
  ignore: z.array(z.string()).default([
    'node_modules',
    '.next',
    'dist',
    'build',
    'coverage',
    '.git'
  ]),
  preset: z.enum(['balanced', 'quality', 'compression']).default('balanced'),
  keepMetadata: z.boolean().default(false),
  responsive: z.boolean().default(false),
  sizes: z.array(z.number().int().positive()).default([640, 1280, 1920]),
  force: z.boolean().default(false)
});

export type AssetFlowConfig = z.infer<typeof ConfigSchema>;

// Returns default configuration values
export function getDefaultConfig(): AssetFlowConfig {
  return ConfigSchema.parse({});
}

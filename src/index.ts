#!/usr/bin/env node
/*
 * Copyright (c) 2026 AssetFlow.
 *
 * Licensed under the AssetFlow Community License.
 * Commercial use requires a commercial license.
 *
 * https://flow.riish.in
 */
import { runCli } from './cli.js';

const projectRoot = process.cwd();

runCli(process.argv, projectRoot);

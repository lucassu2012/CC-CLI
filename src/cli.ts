#!/usr/bin/env node
/**
 * IOE CLI Entry Point
 * Usage: ioe [options]
 */

import { IOEApplication } from './index';

async function main(): Promise<void> {
  const app = new IOEApplication({
    operatorName: process.env.IOE_OPERATOR_NAME ?? 'Default Operator',
    region: process.env.IOE_REGION ?? 'default',
    defaultModelId: process.env.IOE_MODEL_ID ?? 'pangu-telecom-72b',
    cliEnabled: true,
    chatEnabled: false,
  });

  try {
    await app.initialize();
    await app.startCli();
  } catch (error) {
    console.error('[IOE] Fatal error:', error);
    process.exit(1);
  }

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await app.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await app.shutdown();
    process.exit(0);
  });
}

main().catch(console.error);

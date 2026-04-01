#!/usr/bin/env node
/**
 * IOE Chat Entry Point
 * Usage: ioe-chat [--port PORT]
 */

import { IOEApplication } from './index';

async function main(): Promise<void> {
  const port = parseInt(process.env.IOE_CHAT_PORT ?? '8080', 10);

  const app = new IOEApplication({
    operatorName: process.env.IOE_OPERATOR_NAME ?? 'Default Operator',
    region: process.env.IOE_REGION ?? 'default',
    defaultModelId: process.env.IOE_MODEL_ID ?? 'pangu-telecom-72b',
    cliEnabled: false,
    chatEnabled: true,
    chatPort: port,
  });

  try {
    await app.initialize();
    await app.startChat();
  } catch (error) {
    console.error('[IOE] Fatal error:', error);
    process.exit(1);
  }

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

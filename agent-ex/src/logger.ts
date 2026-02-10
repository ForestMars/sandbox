/**
 * @file logger.ts
 * @description Centralized logging configuration using pino, with Bun compatibility.
 * Configured to use direct streams in Bun (Dev) and optimized JSON in Node (Prod).
 */
import pino from 'pino';

// Don't do this, btw: 
// const isBun = typeof Bun !== 'undefined';
// Instead, reliable Bun detection:
const isBun = process.env.BUN_RUNTIME === '1' || process.argv[0]?.includes('bun');

const MODEL_NAME = process.env.MODEL_NAME || 'qwen2.5:7b';

const logger = (() => {
  if (isBun) {
    // DEV/BUN: Main-thread stream for instant terminal feedback
    // Dynamic require prevents production crashes if pino-pretty is a devDependency
    const pretty = require('pino-pretty');
    
    return pino(
      {
        level: 'debug',
        base: { 
          model: MODEL_NAME,
          runtime: 'bun' 
        }
      },
      pretty({
        colorize: true,
        levelFirst: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname,model,runtime' // Keeps "Joe" out of your terminal
      })
    );
  } else {
    // NODE/PRODUCTION: High-performance JSON output
    return pino({
      level: 'info',
      base: { 
        model: MODEL_NAME,
        runtime: 'node'
      }
      // No transport here = direct raw JSON to stdout (best for Datadog)
    });
  }
})();

export { logger };
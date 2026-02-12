/**
 * @file logger.ts
 * @description O11y 2.0 Logger using AsyncLocalStorage for automatic context tracking.
 * Configured to use direct streams in Bun (Dev) and optimized JSON transport in Prod.
 */
import pino from 'pino';
import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * @file logger.ts
 * @description Bun-native O11y 2.0 Logger. 
 */

export const pinoStorage = new AsyncLocalStorage<Record<string, any>>();

const MODEL_NAME = process.env.MODEL_NAME || 'qwen2.5:7b';
const isTerminal = process.stdout.isTTY;

let loggerInstance: pino.Logger;

if (isTerminal) {
  // DEV/BUN: Main-thread stream for instant terminal feedback.
  // Using require here ensures pino-pretty isn't a blocking ESM import.
  const pretty = require('pino-pretty')({
    colorize: true,
    levelFirst: true,
    singleLine: false,
    translateTime: 'SYS:standard',
    ignore: 'pid,hostname',
  });

  loggerInstance = pino({
    level: 'debug',
    base: { model: MODEL_NAME, runtime: 'bun' }
  }, pretty);
} else {
  // PRODUCTION/BUN: High-performance JSON output.
  // In Bun, we omit transport here to keep it simple and blazing fast.
  loggerInstance = pino({
    level: 'info',
    base: { model: MODEL_NAME, runtime: 'bun' }
  });
}

// The Proxy ensures context-awareness across the Bun async runtime
export const logger = new Proxy(loggerInstance, {
  get(target, prop, receiver) {
    const store = pinoStorage.getStore();
    const value = Reflect.get(target, prop, receiver);

    if (typeof value === 'function' && store && typeof prop === 'string' && ['debug', 'info', 'warn', 'error', 'fatal'].includes(prop)) {
      return value.bind(target.child(store));
    }
    return value;
  }
});

export function handleRequest(ctx: { requestId: string; userId?: string }) {
  pinoStorage.run({ 
    requestId: ctx.requestId, 
    userId: ctx.userId ?? 'anonymous' 
  }, () => {
    logger.info({ component: 'http', route: '/chat' }, 'Request received');
  });
}
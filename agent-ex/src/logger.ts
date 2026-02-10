/**
 * @file logger.ts
 * @description Centralized logging configuration using Pino. 
 * Provides a consistent logging interface across the application.
 */
import pino from 'pino';
import destination from 'pino.destination';  // Note: Correct import/helper

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
}, destination('/var/log/app.log'));

// src/logger.ts
import { pino } from 'pino';
import pretty from 'pino-pretty';

// Default to development if NODE_ENV is anything other than 'production'
const isDev = process.env.NODE_ENV !== 'production';

const stream = isDev ? pretty({
  colorize: true,
  levelFirst: true,
  translateTime: 'SYS:standard',
  ignore: 'pid,hostname'
}) : pino.destination({ dest: './app.log', sync: false });

export const logger = pino({
  level: isDev ? 'debug' : 'info'
}, stream);
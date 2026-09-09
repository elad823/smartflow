import { buildApp } from './app';
import { config } from './config/env';

const app = buildApp({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname'
            }
          }
        : undefined
  }
});

const start = async (): Promise<void> => {
  try {
    const address = await app.listen({ port: config.port, host: config.host });
    app.log.info(`🚀 SmartFlow Backend Server running on ${address}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

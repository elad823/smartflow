import fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import cors from '@fastify/cors';
import { apiRoutes } from './routes';
import { errorHandler } from './utils/errors';
import { config } from './config/env';

export function buildApp(opts: FastifyServerOptions = {}): FastifyInstance {
  const app = fastify({
    logger: true,
    ...opts
  });

  // Global Error Handler
  app.setErrorHandler(errorHandler);

  // CORS support (for Next.js frontend communication)
  app.register(cors, {
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  });

  // Health check endpoint
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register API routes under /api
  app.register(apiRoutes, { prefix: '/api' });

  return app;
}

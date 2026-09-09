import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { issueRoutes } from './issue.routes';

export const apiRoutes: FastifyPluginAsync = async (fastify: FastifyInstance): Promise<void> => {
  await fastify.register(issueRoutes);
};

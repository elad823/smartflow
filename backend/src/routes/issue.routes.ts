import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { issueController } from '../controllers/issue.controller';
import {
  createIssueSchema,
  getIssueSchema,
  listIssuesSchema
} from '../schemas/issue.schema';
import { CreateIssueRequest, GetIssueParams, ListIssuesQuery } from '../types/issue.types';

export const issueRoutes: FastifyPluginAsync = async (fastify: FastifyInstance): Promise<void> => {
  // POST /api/issues - Create and analyze a new issue
  fastify.post<{ Body: CreateIssueRequest }>(
    '/issues',
    { schema: createIssueSchema },
    issueController.createIssue
  );

  // GET /api/issues - List all issues with filtering, sorting, and pagination
  fastify.get<{ Querystring: ListIssuesQuery }>(
    '/issues',
    { schema: listIssuesSchema },
    issueController.listIssues
  );

  // GET /api/issues/:id - Get issue by UUID
  fastify.get<{ Params: GetIssueParams }>(
    '/issues/:id',
    { schema: getIssueSchema },
    issueController.getIssueById
  );
};

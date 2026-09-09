import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';

describe('SmartFlow Issues API Endpoints', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('returns status ok', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.status).toBe('ok');
    });
  });

  describe('POST /api/issues', () => {
    it('successfully creates an issue with AI enrichment and smart tagging (201 Created)', async () => {
      const payload = {
        title: 'PostgreSQL database query deadlock in production',
        description: 'Multiple microservices started failing because database queries to the postgres table are stuck in a transaction deadlock.'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/issues',
        payload
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.payload);

      expect(data).toHaveProperty('id');
      expect(data.title).toBe(payload.title);
      expect(data.description).toBe(payload.description);
      expect(data.status).toBe('open');
      expect(data.severity).toBe('critical');
      // Verify smart tagging fields
      expect(data.priority).toBe('critical');
      expect(data.category).toBe('Database');
      expect(data.aiAnalysis).toBeDefined();
      expect(data.aiAnalysis.detectedCategory).toBe('Database');
      expect(data.aiAnalysis.confidenceScore).toBeGreaterThan(0.7);
      expect(data.aiAnalysis.recommendedAction).toBeDefined();
      expect(data.createdAt).toBeDefined();
      expect(data.updatedAt).toBeDefined();
    });

    it('automatically tags security issues with Security category and high priority', async () => {
      const payload = {
        title: 'Unauthorized access to user profile endpoint',
        description: 'JWT signature verification is bypassed under specific headers resulting in 401 bypass.'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/issues',
        payload
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.payload);
      expect(data.category).toBe('Security');
      expect(data.priority).toBe('high');
      expect(data.aiAnalysis.detectedCategory).toBe('Security');
    });

    it('returns 400 when title is shorter than 3 characters', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/issues',
        payload: {
          title: 'AB',
          description: 'A valid description that is long enough.'
        }
      });

      expect(response.statusCode).toBe(400);
      const error = JSON.parse(response.payload);
      expect(error.statusCode).toBe(400);
      expect(error.error).toBe('Bad Request');
      expect(error.message).toContain('Validation failed');
    });

    it('returns 400 when description is shorter than 10 characters', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/issues',
        payload: {
          title: 'Valid Title Here',
          description: 'Too short'
        }
      });

      expect(response.statusCode).toBe(400);
      const error = JSON.parse(response.payload);
      expect(error.statusCode).toBe(400);
      expect(error.error).toBe('Bad Request');
    });

    it('returns 400 when required fields are missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/issues',
        payload: {
          title: 'Only title without description'
        }
      });

      expect(response.statusCode).toBe(400);
      const error = JSON.parse(response.payload);
      expect(error.statusCode).toBe(400);
    });
  });

  describe('GET /api/issues', () => {
    it('lists issues with default pagination', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/issues'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      expect(body.pagination).toBeDefined();
      expect(body.pagination.page).toBe(1);
      expect(body.pagination.limit).toBe(20);
      expect(body.pagination.totalItems).toBeGreaterThanOrEqual(body.data.length);
      expect(body.data[0]).toHaveProperty('priority');
      expect(body.data[0]).toHaveProperty('category');
    });

    it('filters issues by status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/issues?status=open'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data.every((i: { status: string }) => i.status === 'open')).toBe(true);
    });

    it('filters issues by priority', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/issues?priority=critical'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data.every((i: { priority: string }) => i.priority === 'critical')).toBe(true);
    });

    it('filters issues by category', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/issues?category=Database'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data.every((i: { category: string }) => i.category.toLowerCase().includes('database'))).toBe(true);
    });

    it('supports custom sorting by priority and pagination limits', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/issues?limit=2&page=1&sortBy=priority&sortOrder=desc'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data.length).toBeLessThanOrEqual(2);
      expect(body.pagination.limit).toBe(2);
      expect(body.pagination.page).toBe(1);
    });

    it('returns 400 for invalid query parameter values', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/issues?status=unknown_status'
      });

      expect(response.statusCode).toBe(400);
      const error = JSON.parse(response.payload);
      expect(error.statusCode).toBe(400);
    });
  });

  describe('GET /api/issues/:id', () => {
    it('returns an existing issue by valid UUID', async () => {
      const targetId = 'a3b8c2d1-4e5f-6a7b-8c9d-0e1f2a3b4c5d';

      const response = await app.inject({
        method: 'GET',
        url: `/api/issues/${targetId}`
      });

      expect(response.statusCode).toBe(200);
      const issue = JSON.parse(response.payload);
      expect(issue.id).toBe(targetId);
      expect(issue.title).toBeDefined();
      expect(issue.priority).toBe('critical');
      expect(issue.category).toBe('Database');
      expect(issue.aiAnalysis).toBeDefined();
    });

    it('returns 404 when issue UUID does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await app.inject({
        method: 'GET',
        url: `/api/issues/${nonExistentId}`
      });

      expect(response.statusCode).toBe(404);
      const error = JSON.parse(response.payload);
      expect(error.statusCode).toBe(404);
      expect(error.error).toBe('Not Found');
      expect(error.message).toContain('not found');
    });

    it('returns 400 when ID is not a valid UUID format', async () => {
      const invalidId = 'not-a-uuid';

      const response = await app.inject({
        method: 'GET',
        url: `/api/issues/${invalidId}`
      });

      expect(response.statusCode).toBe(400);
      const error = JSON.parse(response.payload);
      expect(error.statusCode).toBe(400);
      expect(error.error).toBe('Bad Request');
    });
  });
});

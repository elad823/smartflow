import { FastifySchema } from 'fastify';

const aiAnalysisSchema = {
  type: 'object',
  required: ['summary', 'detectedCategory', 'confidenceScore', 'recommendedAction'],
  properties: {
    summary: { type: 'string' },
    detectedCategory: { type: 'string' },
    confidenceScore: { type: 'number', minimum: 0.0, maximum: 1.0 },
    recommendedAction: { type: 'string' }
  }
};

const issueSchema = {
  type: 'object',
  required: [
    'id',
    'title',
    'description',
    'status',
    'severity',
    'priority',
    'category',
    'aiAnalysis',
    'createdAt',
    'updatedAt'
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    title: { type: 'string' },
    description: { type: 'string' },
    status: {
      type: 'string',
      enum: ['open', 'in_progress', 'resolved', 'closed']
    },
    severity: {
      type: 'string',
      enum: ['low', 'medium', 'high', 'critical']
    },
    priority: {
      type: 'string',
      enum: ['low', 'medium', 'high', 'critical']
    },
    category: { type: 'string' },
    aiAnalysis: aiAnalysisSchema,
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

const paginationMetaSchema = {
  type: 'object',
  required: ['page', 'limit', 'totalItems', 'totalPages'],
  properties: {
    page: { type: 'integer' },
    limit: { type: 'integer' },
    totalItems: { type: 'integer' },
    totalPages: { type: 'integer' }
  }
};

const errorResponseSchema = {
  type: 'object',
  required: ['statusCode', 'error', 'message'],
  properties: {
    statusCode: { type: 'integer' },
    error: { type: 'string' },
    message: { type: 'string' },
    details: {
      type: 'array',
      items: { type: 'string' }
    }
  }
};

export const createIssueSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['title', 'description'],
    properties: {
      title: {
        type: 'string',
        minLength: 3,
        maxLength: 150
      },
      description: {
        type: 'string',
        minLength: 10
      }
    },
    additionalProperties: false
  },
  response: {
    201: issueSchema,
    400: errorResponseSchema,
    500: errorResponseSchema
  }
};

export const listIssuesSchema: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['open', 'in_progress', 'resolved', 'closed']
      },
      severity: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'critical']
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'critical']
      },
      category: {
        type: 'string'
      },
      sortBy: {
        type: 'string',
        enum: ['createdAt', 'updatedAt', 'severity', 'priority', 'status', 'title'],
        default: 'createdAt'
      },
      sortOrder: {
        type: 'string',
        enum: ['asc', 'desc'],
        default: 'desc'
      },
      page: {
        type: 'integer',
        minimum: 1,
        default: 1
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 20
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      required: ['data', 'pagination'],
      properties: {
        data: {
          type: 'array',
          items: issueSchema
        },
        pagination: paginationMetaSchema
      }
    },
    400: errorResponseSchema,
    500: errorResponseSchema
  }
};

export const getIssueSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        format: 'uuid'
      }
    }
  },
  response: {
    200: issueSchema,
    400: errorResponseSchema,
    404: errorResponseSchema,
    500: errorResponseSchema
  }
};

export const updateIssueStatusSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        format: 'uuid'
      }
    }
  },
  body: {
    type: 'object',
    required: ['status'],
    properties: {
      status: {
        type: 'string',
        enum: ['open', 'in_progress', 'resolved']
      }
    },
    additionalProperties: false
  },
  response: {
    200: issueSchema,
    400: errorResponseSchema,
    404: errorResponseSchema,
    500: errorResponseSchema
  }
};


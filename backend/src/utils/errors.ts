import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ErrorResponse } from '../types/issue.types';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly error: string;
  public readonly details?: string[];

  constructor(statusCode: number, error: string, message: string, details?: string[]) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.error = error;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: string[]) {
    super(400, 'Bad Request', message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, 'Not Found', message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: string[]) {
    super(400, 'Validation Error', message, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'An unexpected internal server error occurred') {
    super(500, 'Internal Server Error', message);
  }
}

export function errorHandler(
  error: FastifyError | AppError | Error,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  // Check if error is our defined AppError
  if (error instanceof AppError) {
    const responseBody: ErrorResponse = {
      statusCode: error.statusCode,
      error: error.error,
      message: error.message,
      ...(error.details && error.details.length > 0 ? { details: error.details } : {})
    };
    reply.status(error.statusCode).send(responseBody);
    return;
  }

  // Fastify schema validation error (has error.validation array)
  if ('validation' in error && Array.isArray(error.validation)) {
    const details = error.validation.map((v) => {
      const field = v.instancePath ? v.instancePath.replace('/', '') : v.params?.missingProperty || 'field';
      return `'${field}' ${v.message || 'is invalid'}`;
    });

    const responseBody: ErrorResponse = {
      statusCode: 400,
      error: 'Bad Request',
      message: `Validation failed: ${error.message}`,
      details
    };
    reply.status(400).send(responseBody);
    return;
  }

  // Fastify status code error (e.g., 404, 400)
  const statusCode = (error as FastifyError).statusCode || 500;
  const errorName = (error as FastifyError).name || 'Internal Server Error';

  request.log.error(error);

  const responseBody: ErrorResponse = {
    statusCode,
    error: statusCode === 500 ? 'Internal Server Error' : errorName,
    message: statusCode === 500 ? 'An internal server error occurred.' : error.message
  };

  reply.status(statusCode).send(responseBody);
}

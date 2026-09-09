import {
  Issue,
  CreateIssueRequest,
  IssueListResponse,
  IssueQueryParams,
  ErrorResponse,
  IssueStatus,
  IssueSeverity
} from '../types/issue';
import { INITIAL_MOCK_ISSUES } from '../lib/mockData';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// In-memory fallback store when backend server is offline
let mockIssuesStore: Issue[] = [...INITIAL_MOCK_ISSUES];

export class IssueServiceError extends Error {
  statusCode: number;
  errorResponse?: ErrorResponse;

  constructor(message: string, statusCode: number = 500, errorResponse?: ErrorResponse) {
    super(message);
    this.name = 'IssueServiceError';
    this.statusCode = statusCode;
    this.errorResponse = errorResponse;
  }
}

/**
 * Service handling all issue-related API requests and fallback management.
 */
export const issueService = {
  /**
   * Health check to detect if Fastify backend is accessible
   */
  async checkBackendHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${API_BASE_URL}/health`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * List all issues with filtering, sorting, and pagination
   */
  async getIssues(params: IssueQueryParams = {}): Promise<IssueListResponse> {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.severity) query.append('severity', params.severity);
    if (params.category) query.append('category', params.category);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const res = await fetch(`${API_BASE_URL}/api/issues?${query.toString()}`, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        let errData: ErrorResponse;
        try {
          errData = await res.json();
        } catch {
          errData = {
            statusCode: res.status,
            error: res.statusText,
            message: `Request failed with status ${res.status}`
          };
        }
        throw new IssueServiceError(errData.message, res.status, errData);
      }

      return await res.json();
    } catch (err: any) {
      if (err instanceof IssueServiceError) {
        throw err;
      }
      
      // Fallback to in-memory mock store only if backend is unreachable
      console.warn('Backend unavailable, using client-side mock store', err);
      return this.filterMockIssues(params);
    }
  },

  /**
   * Fetch single issue by ID
   */
  async getIssueById(id: string): Promise<Issue> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`${API_BASE_URL}/api/issues/${id}`, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        let errData: ErrorResponse;
        try {
          errData = await res.json();
        } catch {
          errData = {
            statusCode: res.status,
            error: res.statusText,
            message: `Issue with ID ${id} not found`
          };
        }
        throw new IssueServiceError(errData.message, res.status, errData);
      }

      return await res.json();
    } catch (err: any) {
      if (err instanceof IssueServiceError) {
        throw err;
      }
      const match = mockIssuesStore.find(i => i.id === id);
      if (!match) {
        throw new IssueServiceError(`Issue with ID ${id} not found`, 404, {
          statusCode: 404,
          error: 'Not Found',
          message: `Issue not found`
        });
      }
      return match;
    }
  },

  /**
   * Create and analyze a new issue
   */
  async createIssue(req: CreateIssueRequest): Promise<Issue> {
    // Client-side validation matching openapi.yaml
    if (!req.title || req.title.length < 3 || req.title.length > 150) {
      throw new IssueServiceError(
        "Validation failed: 'title' must be between 3 and 150 characters long.",
        400,
        {
          statusCode: 400,
          error: "Bad Request",
          message: "Validation failed: 'title' must be between 3 and 150 characters long."
        }
      );
    }
    if (!req.description || req.description.length < 10) {
      throw new IssueServiceError(
        "Validation failed: 'description' must be at least 10 characters long.",
        400,
        {
          statusCode: 400,
          error: "Bad Request",
          message: "Validation failed: 'description' must be at least 10 characters long."
        }
      );
    }

    let isTimeout = false;
    const controller = new AbortController();
    // 60-second timeout to allow Gemini AI analysis on backend to complete comfortably
    const timeoutId = setTimeout(() => {
      isTimeout = true;
      controller.abort();
    }, 60000);

    try {
      const res = await fetch(`${API_BASE_URL}/api/issues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(req),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        let errData: ErrorResponse;
        try {
          errData = await res.json();
        } catch {
          errData = {
            statusCode: res.status,
            error: res.statusText,
            message: `Failed to create issue (${res.status})`
          };
        }
        throw new IssueServiceError(errData.message, res.status, errData);
      }

      return await res.json();
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (err instanceof IssueServiceError) {
        throw err;
      }

      if (isTimeout || err.name === 'AbortError') {
        throw new IssueServiceError(
          'AI analysis request timed out. The server or Gemini AI model took longer than expected to process the request. Please try again.',
          408,
          {
            statusCode: 408,
            error: 'Request Timeout',
            message: 'AI analysis request timed out. The AI model took longer than expected. Please try again.'
          }
        );
      }

      // Check if backend is completely offline before falling back to mock store
      const isOnline = await this.checkBackendHealth();
      if (isOnline) {
        throw new IssueServiceError(
          err.message || 'Failed to create issue on backend server.',
          500,
          {
            statusCode: 500,
            error: 'Internal Error',
            message: err.message || 'Failed to create issue on backend server.'
          }
        );
      }

      // Mock AI Analysis generation for offline mode
      const now = new Date().toISOString();
      const detectedCat = inferMockCategory(req.title, req.description);
      const severity: IssueSeverity = inferMockSeverity(req.title, req.description);

      const randomId = typeof window !== 'undefined' && window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : `mock-${Date.now()}`;

      const created: Issue = {
        id: randomId,
        title: req.title,
        description: req.description,
        status: 'open',
        severity,
        category: detectedCat,
        aiAnalysis: {
          summary: `AI analyzed: ${req.title.substring(0, 80)}... Issue indicates potential ${detectedCat.toLowerCase()} bottleneck.`,
          detectedCategory: detectedCat,
          confidenceScore: 0.93,
          recommendedAction: `Inspect recent logs and trace events related to ${detectedCat}, verify error rates, and monitor response latency.`
        },
        createdAt: now,
        updatedAt: now
      };

      mockIssuesStore.unshift(created);
      return created;
    }
  },

  /**
   * Helper for filtering the in-memory mock store
   */
  filterMockIssues(params: IssueQueryParams): IssueListResponse {
    let filtered = [...mockIssuesStore];

    if (params.status) {
      filtered = filtered.filter(i => i.status === params.status);
    }
    if (params.severity) {
      filtered = filtered.filter(i => i.severity === params.severity);
    }
    if (params.category) {
      const q = params.category.toLowerCase();
      filtered = filtered.filter(i => 
        i.category.toLowerCase().includes(q) || 
        i.title.toLowerCase().includes(q)
      );
    }

    // Sort
    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';

    filtered.sort((a, b) => {
      let valA: any = a[sortBy as keyof Issue];
      let valB: any = b[sortBy as keyof Issue];

      if (sortBy === 'severity') {
        const severityRank = { low: 1, medium: 2, high: 3, critical: 4 };
        valA = severityRank[a.severity] || 0;
        valB = severityRank[b.severity] || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);

    return {
      data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages
      }
    };
  }
};

function inferMockCategory(title: string, desc: string): string {
  const text = `${title} ${desc}`.toLowerCase();
  if (text.includes('database') || text.includes('sql') || text.includes('postgres') || text.includes('query')) return 'Database';
  if (text.includes('auth') || text.includes('jwt') || text.includes('login') || text.includes('permission')) return 'Security & Auth';
  if (text.includes('css') || text.includes('ui') || text.includes('button') || text.includes('modal') || text.includes('safari')) return 'Frontend UI';
  if (text.includes('memory') || text.includes('leak') || text.includes('cpu') || text.includes('slow')) return 'Performance';
  if (text.includes('api') || text.includes('500') || text.includes('timeout') || text.includes('network')) return 'Infrastructure';
  return 'General Operations';
}

function inferMockSeverity(title: string, desc: string): IssueSeverity {
  const text = `${title} ${desc}`.toLowerCase();
  if (text.includes('production') || text.includes('down') || text.includes('critical') || text.includes('crash')) return 'critical';
  if (text.includes('fail') || text.includes('timeout') || text.includes('error') || text.includes('leak')) return 'high';
  if (text.includes('slow') || text.includes('cut off') || text.includes('warning')) return 'medium';
  return 'low';
}

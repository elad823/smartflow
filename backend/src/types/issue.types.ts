export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type UpdateableIssueStatus = 'open' | 'in_progress' | 'resolved';

export interface UpdateIssueStatusRequest {
  status: UpdateableIssueStatus;
}

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';

export interface AIAnalysis {
  summary: string;
  detectedCategory: string;
  confidenceScore: number;
  recommendedAction: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  severity: IssueSeverity;
  priority: IssuePriority;
  category: string;
  aiAnalysis: AIAnalysis;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIssueRequest {
  title: string;
  description: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface IssueListResponse {
  data: Issue[];
  pagination: PaginationMeta;
}

export interface ListIssuesQuery {
  status?: IssueStatus;
  severity?: IssueSeverity;
  priority?: IssuePriority;
  category?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'severity' | 'priority' | 'status' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface GetIssueParams {
  id: string;
}

export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  details?: string[];
}

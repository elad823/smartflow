export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type UpdateableIssueStatus = 'open' | 'in_progress' | 'resolved';

export interface UpdateIssueStatusRequest {
  status: UpdateableIssueStatus;
}

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

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

export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  details?: string[];
}

export type SortField = 'createdAt' | 'updatedAt' | 'severity' | 'status' | 'title';
export type SortOrder = 'asc' | 'desc';

export interface IssueQueryParams {
  status?: IssueStatus;
  severity?: IssueSeverity;
  category?: string;
  sortBy?: SortField;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
}

import { v4 as uuidv4 } from 'uuid';
import {
  CreateIssueRequest,
  Issue,
  IssueListResponse,
  ListIssuesQuery
} from '../types/issue.types';
import { IIssueRepository, issueRepository } from '../repositories/issue.repository';
import { AIService, aiService } from './ai.service';
import { NotFoundError } from '../utils/errors';

export class IssueService {
  constructor(
    private readonly repository: IIssueRepository = issueRepository,
    private readonly ai: AIService = aiService
  ) {}

  public async createIssue(request: CreateIssueRequest): Promise<Issue> {
    const title = request.title.trim();
    const description = request.description.trim();

    // 1. AI Analysis & automated smart tagging (category & priority)
    const { category, severity, priority, analysis } = await this.ai.analyzeIssue(title, description);

    // 2. Build full Issue entity with smart tags
    const now = new Date().toISOString();
    const newIssue: Issue = {
      id: uuidv4(),
      title,
      description,
      status: 'open',
      severity,
      priority,
      category,
      aiAnalysis: analysis,
      createdAt: now,
      updatedAt: now
    };

    // 3. Persist to database
    return this.repository.create(newIssue);
  }

  public async listIssues(query: ListIssuesQuery): Promise<IssueListResponse> {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.max(Math.min(Number(query.limit) || 20, 100), 1);

    const { issues, total } = await this.repository.findMany({
      status: query.status,
      severity: query.severity,
      priority: query.priority,
      category: query.category,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      page,
      limit
    });

    const totalPages = Math.max(Math.ceil(total / limit), total === 0 ? 0 : 1);

    return {
      data: issues,
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages
      }
    };
  }

  public async getIssueById(id: string): Promise<Issue> {
    const issue = await this.repository.findById(id);
    if (!issue) {
      throw new NotFoundError(`Issue with ID '${id}' not found.`);
    }
    return issue;
  }
}

export const issueService = new IssueService();

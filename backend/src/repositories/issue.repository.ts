import Database from 'better-sqlite3';
import { Issue, IssuePriority, IssueSeverity, IssueStatus } from '../types/issue.types';
import { getDatabase } from '../db/connection';

export interface FindManyOptions {
  status?: IssueStatus;
  severity?: IssueSeverity;
  priority?: IssuePriority;
  category?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'severity' | 'priority' | 'status' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface IIssueRepository {
  create(issue: Issue): Promise<Issue>;
  findById(id: string): Promise<Issue | null>;
  updateStatus(id: string, status: IssueStatus): Promise<Issue | null>;
  findMany(options: FindManyOptions): Promise<{ issues: Issue[]; total: number }>;
  clear(): Promise<void>;
  seed(issues: Issue[]): Promise<void>;
}


interface IssueRow {
  id: string;
  title: string;
  description: string;
  status: string;
  severity: string;
  priority: string;
  category: string;
  ai_summary: string;
  ai_detected_category: string;
  ai_confidence_score: number;
  ai_recommended_action: string;
  created_at: string;
  updated_at: string;
}

function rowToIssue(row: IssueRow): Issue {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status as IssueStatus,
    severity: row.severity as IssueSeverity,
    priority: (row.priority || row.severity || 'medium') as IssuePriority,
    category: row.category,
    aiAnalysis: {
      summary: row.ai_summary,
      detectedCategory: row.ai_detected_category,
      confidenceScore: row.ai_confidence_score,
      recommendedAction: row.ai_recommended_action
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export class SqliteIssueRepository implements IIssueRepository {
  private db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db || getDatabase();
  }

  public async create(issue: Issue): Promise<Issue> {
    const stmt = this.db.prepare(`
      INSERT INTO issues (
        id, title, description, status, severity, priority, category,
        ai_summary, ai_detected_category, ai_confidence_score, ai_recommended_action,
        created_at, updated_at
      ) VALUES (
        @id, @title, @description, @status, @severity, @priority, @category,
        @ai_summary, @ai_detected_category, @ai_confidence_score, @ai_recommended_action,
        @created_at, @updated_at
      )
    `);

    stmt.run({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      status: issue.status,
      severity: issue.severity,
      priority: issue.priority,
      category: issue.category,
      ai_summary: issue.aiAnalysis.summary,
      ai_detected_category: issue.aiAnalysis.detectedCategory,
      ai_confidence_score: issue.aiAnalysis.confidenceScore,
      ai_recommended_action: issue.aiAnalysis.recommendedAction,
      created_at: issue.createdAt,
      updated_at: issue.updatedAt
    });

    return issue;
  }

  public async findById(id: string): Promise<Issue | null> {
    const stmt = this.db.prepare('SELECT * FROM issues WHERE id = ?');
    const row = stmt.get(id) as IssueRow | undefined;
    return row ? rowToIssue(row) : null;
  }

  public async updateStatus(id: string, status: IssueStatus): Promise<Issue | null> {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      UPDATE issues
      SET status = ?, updated_at = ?
      WHERE id = ?
    `);
    const result = stmt.run(status, now, id);
    if (result.changes === 0) {
      return null;
    }
    return this.findById(id);
  }


  public async findMany(options: FindManyOptions): Promise<{ issues: Issue[]; total: number }> {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (options.status) {
      conditions.push('status = ?');
      params.push(options.status);
    }

    if (options.severity) {
      conditions.push('severity = ?');
      params.push(options.severity);
    }

    if (options.priority) {
      conditions.push('priority = ?');
      params.push(options.priority);
    }

    if (options.category) {
      conditions.push('LOWER(category) LIKE ?');
      params.push(`%${options.category.toLowerCase()}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query
    const countStmt = this.db.prepare(`SELECT COUNT(*) as total FROM issues ${whereClause}`);
    const countResult = countStmt.get(...params) as { total: number };
    const total = countResult ? countResult.total : 0;

    // Sorting
    const sortOrder = options.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    let orderByClause = `ORDER BY created_at ${sortOrder}`;

    if (options.sortBy === 'severity') {
      orderByClause = `ORDER BY CASE severity 
        WHEN 'critical' THEN 4 
        WHEN 'high' THEN 3 
        WHEN 'medium' THEN 2 
        WHEN 'low' THEN 1 
        ELSE 0 END ${sortOrder}`;
    } else if (options.sortBy === 'priority') {
      orderByClause = `ORDER BY CASE priority 
        WHEN 'critical' THEN 4 
        WHEN 'high' THEN 3 
        WHEN 'medium' THEN 2 
        WHEN 'low' THEN 1 
        ELSE 0 END ${sortOrder}`;
    } else if (options.sortBy === 'updatedAt') {
      orderByClause = `ORDER BY updated_at ${sortOrder}`;
    } else if (options.sortBy === 'status') {
      orderByClause = `ORDER BY status ${sortOrder}`;
    } else if (options.sortBy === 'title') {
      orderByClause = `ORDER BY title ${sortOrder}`;
    } else if (options.sortBy === 'createdAt') {
      orderByClause = `ORDER BY created_at ${sortOrder}`;
    }

    // Pagination
    const page = Math.max(options.page || 1, 1);
    const limit = Math.max(options.limit || 20, 1);
    const offset = (page - 1) * limit;

    const queryStmt = this.db.prepare(`
      SELECT * FROM issues
      ${whereClause}
      ${orderByClause}
      LIMIT ? OFFSET ?
    `);

    const rows = queryStmt.all(...params, limit, offset) as IssueRow[];

    return {
      issues: rows.map(rowToIssue),
      total
    };
  }

  public async clear(): Promise<void> {
    this.db.prepare('DELETE FROM issues').run();
  }

  public async seed(issues: Issue[]): Promise<void> {
    const insert = this.db.prepare(`
      INSERT OR REPLACE INTO issues (
        id, title, description, status, severity, priority, category,
        ai_summary, ai_detected_category, ai_confidence_score, ai_recommended_action,
        created_at, updated_at
      ) VALUES (
        @id, @title, @description, @status, @severity, @priority, @category,
        @ai_summary, @ai_detected_category, @ai_confidence_score, @ai_recommended_action,
        @created_at, @updated_at
      )
    `);

    const insertMany = this.db.transaction((items: Issue[]) => {
      for (const item of items) {
        insert.run({
          id: item.id,
          title: item.title,
          description: item.description,
          status: item.status,
          severity: item.severity,
          priority: item.priority,
          category: item.category,
          ai_summary: item.aiAnalysis.summary,
          ai_detected_category: item.aiAnalysis.detectedCategory,
          ai_confidence_score: item.aiAnalysis.confidenceScore,
          ai_recommended_action: item.aiAnalysis.recommendedAction,
          created_at: item.createdAt,
          updated_at: item.updatedAt
        });
      }
    });

    insertMany(issues);
  }
}

export const issueRepository = new SqliteIssueRepository();

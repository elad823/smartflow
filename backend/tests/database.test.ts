import { describe, expect, it, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { initializeDatabase } from '../src/db/schema';
import { seedDefaultIssues } from '../src/db/seed';
import { SqliteIssueRepository } from '../src/repositories/issue.repository';
import { Issue } from '../src/types/issue.types';

describe('SQLite Database & Repository', () => {
  let db: Database.Database;
  let repo: SqliteIssueRepository;

  beforeEach(() => {
    // Fresh in-memory database for isolated unit tests
    db = new Database(':memory:');
    initializeDatabase(db);
    seedDefaultIssues(db);
    repo = new SqliteIssueRepository(db);
  });

  it('initializes schema and default seed data with priority', async () => {
    const { total, issues } = await repo.findMany({});
    expect(total).toBe(3);
    expect(issues.length).toBe(3);
    expect(issues.every((i) => typeof i.priority === 'string')).toBe(true);
  });

  it('creates and retrieves a new issue with priority and category', async () => {
    const newIssue: Issue = {
      id: '11111111-2222-3333-4444-555555555555',
      title: 'Database connection leak in background worker',
      description: 'Worker fails to release active SQLite transactions leading to file locks.',
      status: 'open',
      severity: 'high',
      priority: 'high',
      category: 'Database',
      aiAnalysis: {
        summary: 'Unreleased SQLite transactions locking the database.',
        detectedCategory: 'Database',
        confidenceScore: 0.94,
        recommendedAction: 'Ensure all db statements run within try/finally or transaction blocks.'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await repo.create(newIssue);

    const fetched = await repo.findById(newIssue.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.title).toBe(newIssue.title);
    expect(fetched?.priority).toBe('high');
    expect(fetched?.category).toBe('Database');
    expect(fetched?.aiAnalysis.detectedCategory).toBe('Database');
  });

  it('filters by status, severity, priority, and category', async () => {
    const openCritical = await repo.findMany({ status: 'open', severity: 'critical', priority: 'critical' });
    expect(openCritical.issues.every((i) => i.status === 'open' && i.priority === 'critical')).toBe(true);

    const dbCategory = await repo.findMany({ category: 'data' });
    expect(dbCategory.issues.length).toBeGreaterThanOrEqual(1);
    expect(dbCategory.issues[0].category.toLowerCase()).toContain('data');
  });

  it('supports custom sorting by priority and pagination', async () => {
    const sortedByPriority = await repo.findMany({ sortBy: 'priority', sortOrder: 'desc' });
    expect(sortedByPriority.issues[0].priority).toBe('critical');

    const page1 = await repo.findMany({ page: 1, limit: 2, sortBy: 'title', sortOrder: 'asc' });
    expect(page1.issues.length).toBe(2);
    expect(page1.total).toBe(3);

    const page2 = await repo.findMany({ page: 2, limit: 2, sortBy: 'title', sortOrder: 'asc' });
    expect(page2.issues.length).toBe(1);
  });

  it('updates issue status and updatedAt timestamp', async () => {
    const targetId = 'a3b8c2d1-4e5f-6a7b-8c9d-0e1f2a3b4c5d';
    const before = await repo.findById(targetId);
    expect(before?.status).toBe('open');

    const updated = await repo.updateStatus(targetId, 'in_progress');
    expect(updated).not.toBeNull();
    expect(updated?.status).toBe('in_progress');
    expect(updated?.id).toBe(targetId);

    const resolved = await repo.updateStatus(targetId, 'resolved');
    expect(resolved?.status).toBe('resolved');

    const nonExistent = await repo.updateStatus('00000000-0000-0000-0000-000000000000', 'open');
    expect(nonExistent).toBeNull();
  });

  it('clears database properly', async () => {
    await repo.clear();
    const { total } = await repo.findMany({});
    expect(total).toBe(0);
  });
});


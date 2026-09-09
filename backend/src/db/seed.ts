import Database from 'better-sqlite3';

export function seedDefaultIssues(db: Database.Database): void {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM issues').get() as { count: number };
  if (countRow && countRow.count > 0) {
    return;
  }

  const insert = db.prepare(`
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

  const defaultIssues = [
    {
      id: 'a3b8c2d1-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
      title: 'PostgreSQL connection pool exhausted in production',
      description:
        'Multiple microservices started failing with Connection timeout errors under heavy traffic. The database pool limit was hit and queries are hanging.',
      status: 'open',
      severity: 'critical',
      priority: 'critical',
      category: 'Database',
      ai_summary:
        'Connection pool exhaustion causing cascading request timeouts across dependent microservices.',
      ai_detected_category: 'Database',
      ai_confidence_score: 0.96,
      ai_recommended_action:
        'Increase maximum connection pool size in PgBouncer, check for leaking unclosed database sessions in the auth service, and review long-running queries.',
      created_at: '2026-09-09T10:15:30.000Z',
      updated_at: '2026-09-09T10:15:32.450Z'
    },
    {
      id: 'b4c9d3e2-5f6a-7b8c-9d0e-1f2a3b4c5d6e',
      title: 'JWT authentication token expiration mismatch',
      description:
        'Users are randomly getting 401 Unauthorized responses even though refresh tokens are valid. Likely clock drift or mismatched JWT expiration configs between edge and auth servers.',
      status: 'in_progress',
      severity: 'high',
      priority: 'high',
      category: 'Security',
      ai_summary:
        'Premature session invalidation caused by asynchronous token TTL skew between edge gateway and auth authority.',
      ai_detected_category: 'Security',
      ai_confidence_score: 0.92,
      ai_recommended_action:
        'Synchronize system clocks using NTP and align access token leeway margin in the auth middleware.',
      created_at: '2026-09-08T14:22:10.000Z',
      updated_at: '2026-09-09T08:10:00.000Z'
    },
    {
      id: 'c5d0e4f3-6a7b-8c9d-0e1f-2a3b4c5d6e7f',
      title: 'High latency on dashboard analytics endpoint',
      description:
        'GET /api/analytics/summary takes upwards of 4.5 seconds to respond when requested with a 30-day date range.',
      status: 'open',
      severity: 'medium',
      priority: 'medium',
      category: 'Performance',
      ai_summary:
        'Uncached full-table aggregations causing severe latency degradation on dashboard analytics queries.',
      ai_detected_category: 'Performance',
      ai_confidence_score: 0.89,
      ai_recommended_action:
        'Implement Redis caching with a 5-minute TTL and add compound indices on the created_at and tenant_id columns.',
      created_at: '2026-09-07T09:00:00.000Z',
      updated_at: '2026-09-07T09:00:00.000Z'
    }
  ];

  const insertMany = db.transaction((issues) => {
    for (const issue of issues) {
      insert.run(issue);
    }
  });

  insertMany(defaultIssues);
}

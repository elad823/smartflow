import Database from 'better-sqlite3';

export function initializeDatabase(db: Database.Database): void {
  // Enable WAL mode for optimal concurrent performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // 1. Create issues table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS issues (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('open', 'in_progress', 'resolved', 'closed')),
      severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'critical')),
      category TEXT NOT NULL,
      ai_summary TEXT NOT NULL,
      ai_detected_category TEXT NOT NULL,
      ai_confidence_score REAL NOT NULL,
      ai_recommended_action TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 2. Migration: Ensure 'priority' column exists if table was created previously without it
  const tableInfo = db.pragma('table_info(issues)') as Array<{ name: string }>;
  const hasPriority = tableInfo.some((col) => col.name === 'priority');
  if (tableInfo.length > 0 && !hasPriority) {
    db.exec("ALTER TABLE issues ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium'");
    db.exec("UPDATE issues SET priority = severity WHERE priority IS NULL OR priority = 'medium'");
  }

  // 3. Create indices
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
    CREATE INDEX IF NOT EXISTS idx_issues_severity ON issues(severity);
    CREATE INDEX IF NOT EXISTS idx_issues_priority ON issues(priority);
    CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
    CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at);
  `);
}

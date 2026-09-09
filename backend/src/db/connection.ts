import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initializeDatabase } from './schema';
import { seedDefaultIssues } from './seed';

export interface DatabaseOptions {
  path?: string;
  seed?: boolean;
}

let dbInstance: Database.Database | null = null;

export function getDatabase(options: DatabaseOptions = {}): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath =
    options.path ||
    process.env.DB_PATH ||
    (process.env.NODE_ENV === 'test' ? ':memory:' : path.resolve(process.cwd(), 'data/smartflow.db'));

  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(dbPath);
  initializeDatabase(db);

  const shouldSeed = options.seed !== undefined ? options.seed : true;
  if (shouldSeed) {
    seedDefaultIssues(db);
  }

  dbInstance = db;
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

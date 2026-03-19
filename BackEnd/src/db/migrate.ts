import fs from 'node:fs/promises';
import path from 'node:path';
import { getDbClient } from './client';

const runMigrations = async () => {
  const db = getDbClient();
  const migrationsDir = path.resolve(process.cwd(), 'migrations');

  await db.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  );

  const files = (await fs.readdir(migrationsDir))
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort((left, right) => left.localeCompare(right));

  for (const fileName of files) {
    const version = fileName;
    const existing = await db.query<{ version: string }>(
      'SELECT version FROM schema_migrations WHERE version = $1',
      [version],
    );

    if (existing.rows.length > 0) {
      continue;
    }

    const sql = await fs.readFile(path.join(migrationsDir, fileName), 'utf8');
    await db.query('BEGIN');
    try {
      await db.query(sql);
      await db.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
      await db.query('COMMIT');
      console.log(`Applied migration: ${fileName}`);
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }

  console.log('Migrations complete');
};

void runMigrations();

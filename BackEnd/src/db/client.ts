import { Pool, QueryResult, QueryResultRow } from 'pg';
import { env } from '../config/env';

export interface DbClient {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>>;
}

let pool: Pool | undefined;

export const getDbClient = (): DbClient => {
  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL is required when PERSISTENCE_MODE=postgres');
  }

  if (!pool) {
    pool = new Pool({
      connectionString: env.databaseUrl,
      max: 10,
    });
  }

  return {
    query: <T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) =>
      pool!.query<T>(text, params),
  };
};

export const closeDbClient = async () => {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
};

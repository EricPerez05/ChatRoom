const DEFAULT_CORS_ORIGIN = 'http://localhost:5173';
type PersistenceMode = 'memory' | 'postgres';

const runtimeEnv: Record<string, string | undefined> =
  typeof globalThis !== 'undefined' && (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
    ? (globalThis as { process?: { env?: Record<string, string | undefined> } }).process!.env!
    : {};

const resolveCorsOrigins = (): string[] => {
  const raw = runtimeEnv.CORS_ORIGIN || DEFAULT_CORS_ORIGIN;
  return raw
    .split(',')
    .map((origin: string) => origin.trim())
    .filter((origin: string) => origin.length > 0);
};

const resolvePersistenceMode = (): PersistenceMode => {
  const raw = (runtimeEnv.PERSISTENCE_MODE || 'memory').toLowerCase();
  return raw === 'postgres' ? 'postgres' : 'memory';
};

export const env = {
  port: Number(runtimeEnv.PORT || 4000),
  corsOrigins: resolveCorsOrigins(),
  maxWriteRequestsPerMinute: Number(runtimeEnv.MAX_WRITE_REQUESTS_PER_MINUTE || 60),
  persistenceMode: resolvePersistenceMode(),
  databaseUrl: runtimeEnv.DATABASE_URL,
};
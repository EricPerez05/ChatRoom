"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const DEFAULT_CORS_ORIGIN = 'http://localhost:5173';
const resolvePersistenceMode = () => {
    const raw = (process.env.PERSISTENCE_MODE || 'memory').toLowerCase();
    return raw === 'postgres' ? 'postgres' : 'memory';
};
exports.env = {
    port: Number(process.env.PORT || 4000),
    corsOrigin: process.env.CORS_ORIGIN || DEFAULT_CORS_ORIGIN,
    maxWriteRequestsPerMinute: Number(process.env.MAX_WRITE_REQUESTS_PER_MINUTE || 60),
    persistenceMode: resolvePersistenceMode(),
    databaseUrl: process.env.DATABASE_URL,
};

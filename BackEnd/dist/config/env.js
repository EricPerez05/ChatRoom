"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const path_1 = __importDefault(require("path"));
const dotenv_1 = require("dotenv");
const envPath = path_1.default.resolve(__dirname, '../../.env');
(0, dotenv_1.config)({ path: envPath, override: true });
const DEFAULT_CORS_ORIGIN = 'http://localhost:5173';
const runtimeEnv = typeof globalThis !== 'undefined' && globalThis.process?.env
    ? globalThis.process.env
    : {};
const resolveCorsOrigins = () => {
    const raw = runtimeEnv.CORS_ORIGIN || DEFAULT_CORS_ORIGIN;
    return raw
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0);
};
const resolvePersistenceMode = () => {
    const raw = (runtimeEnv.PERSISTENCE_MODE || 'memory').toLowerCase();
    return raw === 'postgres' ? 'postgres' : 'memory';
};
exports.env = {
    port: Number(runtimeEnv.PORT || 4000),
    corsOrigins: resolveCorsOrigins(),
    maxWriteRequestsPerMinute: Number(runtimeEnv.MAX_WRITE_REQUESTS_PER_MINUTE || 60),
    persistenceMode: resolvePersistenceMode(),
    databaseUrl: runtimeEnv.DATABASE_URL,
    llmProvider: (runtimeEnv.LLM_PROVIDER || 'template').toLowerCase(),
    ollamaBaseUrl: runtimeEnv.OLLAMA_BASE_URL || 'http://localhost:11434',
    ollamaModel: runtimeEnv.OLLAMA_MODEL || 'llama3.1',
};

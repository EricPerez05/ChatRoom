"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const client_1 = require("./client");
const runMigrations = async () => {
    const db = (0, client_1.getDbClient)();
    const migrationsDir = node_path_1.default.resolve(process.cwd(), 'migrations');
    await db.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    const files = (await promises_1.default.readdir(migrationsDir))
        .filter((fileName) => fileName.endsWith('.sql'))
        .sort((left, right) => left.localeCompare(right));
    for (const fileName of files) {
        const version = fileName;
        const existing = await db.query('SELECT version FROM schema_migrations WHERE version = $1', [version]);
        if (existing.rows.length > 0) {
            continue;
        }
        const sql = await promises_1.default.readFile(node_path_1.default.join(migrationsDir, fileName), 'utf8');
        await db.query('BEGIN');
        try {
            await db.query(sql);
            await db.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
            await db.query('COMMIT');
            console.log(`Applied migration: ${fileName}`);
        }
        catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }
    }
    console.log('Migrations complete');
};
void runMigrations();

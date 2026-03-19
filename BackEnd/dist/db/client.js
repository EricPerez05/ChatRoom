"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDbClient = exports.getDbClient = void 0;
const pg_1 = require("pg");
const env_1 = require("../config/env");
let pool;
const getDbClient = () => {
    if (!env_1.env.databaseUrl) {
        throw new Error('DATABASE_URL is required when PERSISTENCE_MODE=postgres');
    }
    if (!pool) {
        pool = new pg_1.Pool({
            connectionString: env_1.env.databaseUrl,
            max: 10,
        });
    }
    return {
        query: (text, params) => pool.query(text, params),
    };
};
exports.getDbClient = getDbClient;
const closeDbClient = async () => {
    if (pool) {
        await pool.end();
        pool = undefined;
    }
};
exports.closeDbClient = closeDbClient;

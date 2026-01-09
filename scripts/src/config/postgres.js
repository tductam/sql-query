import { fileURLToPath } from 'url';
import path from 'path';
import { config as loadEnv } from '../utils/customEnvLoader.js';

// Load .env from scripts directory using custom loader
// This allows reading # in unquoted values (e.g., PASS=abc#123)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');
loadEnv({ path: envPath });

export const SKILL_VERSION = "2.1.0";

// Database type - mutable to allow CLI override
// Default: mysql, can be changed via setDbType() or --db=postgres/--postgres flag
let currentDbType = process.env.DB_TYPE || "mysql";

/**
 * Set the database type at runtime
 * @param {string} dbType - "mysql" or "postgres"
 */
export function setDbType(dbType) {
    const normalized = dbType.toLowerCase();
    if (normalized === "postgres" || normalized === "postgresql" || normalized === "pg") {
        currentDbType = "postgres";
    } else if (normalized === "mysql" || normalized === "mariadb") {
        currentDbType = "mysql";
    } else {
        throw new Error(`Unsupported database type: ${dbType}. Use 'mysql' or 'postgres'.`);
    }
}

// Keep DB_TYPE export for backward compatibility (but it won't reflect runtime changes)
export const DB_TYPE = currentDbType;

// Parse DATABASE_URL for PostgreSQL if provided
// Note: Passwords with special characters (#, @, !, etc.) must be URL-encoded in DATABASE_URL
// Example: password "pass#123" should be written as "pass%23123" in the URL
function parseDatabaseUrl(url) {
    if (!url) return null;
    try {
        const parsed = new URL(url);
        return {
            host: parsed.hostname,
            port: parseInt(parsed.port) || 5432,
            user: decodeURIComponent(parsed.username),
            // decodeURIComponent handles URL-encoded special characters
            // e.g., %23 -> #, %40 -> @, %21 -> !, %24 -> $
            password: decodeURIComponent(parsed.password),
            database: parsed.pathname.slice(1), // Remove leading /
        };
    } catch (e) {
        console.error("Failed to parse DATABASE_URL:", e.message);
        return null;
    }
}

// PostgreSQL config from DATABASE_URL or individual vars
const pgUrlConfig = parseDatabaseUrl(process.env.DATABASE_URL);

export const pgConfig = {
    host: pgUrlConfig?.host || process.env.PG_HOST || "127.0.0.1",
    port: pgUrlConfig?.port || Number(process.env.PG_PORT || "5432"),
    user: pgUrlConfig?.user || process.env.PG_USER || "postgres",
    password: pgUrlConfig?.password || process.env.PG_PASS || "",
    database: pgUrlConfig?.database || process.env.PG_DB || undefined,
    max: 10, // connection pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
};

// Export for easy access
export function getDbType() {
    return currentDbType.toLowerCase();
}

import pg from "pg";
import { performance } from "perf_hooks";
import { pgConfig } from "./../config/postgres.js";
import { log } from "./../utils/index.js";

const { Pool } = pg;

let pool = null;

export function getPool() {
    if (!pool) {
        pool = new Pool(pgConfig);
        log("info", "PostgreSQL pool created successfully");
    }
    return pool;
}

export async function executeQuery(sql, params = []) {
    const client = await getPool().connect();
    try {
        const result = await client.query(sql, params);
        return result.rows;
    } catch (error) {
        log("error", "Error executing query:", error);
        throw error;
    } finally {
        client.release();
    }
}

export async function executeReadOnlyQuery(sql) {
    const client = await getPool().connect();
    try {
        const startTime = performance.now();

        // PostgreSQL read-only transaction
        await client.query("BEGIN READ ONLY");

        try {
            const result = await client.query(sql);
            await client.query("COMMIT");

            const endTime = performance.now();
            const duration = endTime - startTime;

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result.rows, null, 2),
                    },
                    {
                        type: "text",
                        text: `Query execution time: ${duration.toFixed(2)} ms`,
                    },
                ],
                isError: false,
            };
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        }
    } catch (error) {
        log("error", "Error in read-only query:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error.message}`,
                },
            ],
            isError: true,
        };
    } finally {
        client.release();
    }
}

export async function closePool() {
    if (pool) {
        await pool.end();
        pool = null;
    }
}

export { pool as poolPromise };

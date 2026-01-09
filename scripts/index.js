#!/usr/bin/env node
/**
 * SQL Query CLI Script for Claude Agent Skill
 * Default: MySQL, use --db=postgres or --postgres flag for PostgreSQL
 * 
 * Usage:
 *   node index.js query "SELECT * FROM users"
 *   node index.js --db=postgres query "SELECT * FROM users"
 *   node index.js --postgres list-tables
 *   node index.js list-tables
 *   node index.js describe <table_name>
 *   node index.js test-connection
 */

import { log } from "./src/utils/index.js";
import { SKILL_VERSION, pgConfig } from "./src/config/postgres.js";
import { dbConfig as mysqlConfig } from "./src/config/index.js";
import {
    getPool,
    executeReadOnlyQuery,
    executeQuery,
    closePool,
    getDbType,
    setDbType,
} from "./src/db/index.js";

// Output JSON response
function outputJSON(success, data, error = null, executionTime = null) {
    const response = { success };
    if (data !== null) response.data = data;
    if (error !== null) response.error = error;
    if (executionTime !== null) response.executionTime = executionTime;
    console.log(JSON.stringify(response, null, 2));
}

// Get current config based on DB_TYPE
function getCurrentConfig() {
    const dbType = getDbType();
    if (dbType === "postgres" || dbType === "postgresql") {
        return {
            type: "postgres",
            host: pgConfig.host,
            port: pgConfig.port,
            database: pgConfig.database,
            user: pgConfig.user,
        };
    }
    return {
        type: "mysql",
        host: mysqlConfig.mysql.host || mysqlConfig.mysql.socketPath,
        port: mysqlConfig.mysql.port,
        database: mysqlConfig.mysql.database,
        user: mysqlConfig.mysql.user,
    };
}

// Test database connection
async function testConnection() {
    try {
        const pool = await getPool();
        const dbType = getDbType();
        const config = getCurrentConfig();

        if (dbType === "postgres" || dbType === "postgresql") {
            const client = await pool.connect();
            await client.query("SELECT 1 as connected");
            client.release();
        } else {
            const connection = await pool.getConnection();
            await connection.query("SELECT 1 as connected");
            connection.release();
        }

        outputJSON(true, {
            connected: true,
            version: SKILL_VERSION,
            dbType: config.type,
            host: config.host,
            port: config.port,
            database: config.database || "Not specified",
            user: config.user,
        });
    } catch (error) {
        outputJSON(false, null, `Connection failed: ${error.message}`);
        process.exit(1);
    }
}

// List all tables
async function listTables() {
    try {
        const dbType = getDbType();
        const config = getCurrentConfig();
        let sql;

        if (dbType === "postgres" || dbType === "postgresql") {
            // For PostgreSQL: filter by current database, default to 'public' schema
            // Note: PostgreSQL connection is always to a specific database
            sql = `
                SELECT 
                    table_schema as schema,
                    table_name as name,
                    table_type as type
                FROM information_schema.tables 
                WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
                ORDER BY table_schema, table_name
            `;
        } else {
            // For MySQL: filter by configured database if set
            const database = config.database;
            if (database) {
                sql = `
                    SELECT 
                        table_schema as 'database',
                        table_name as name,
                        table_rows as rowCount,
                        ROUND(data_length / 1024 / 1024, 2) as dataSizeMB,
                        table_comment as description
                    FROM information_schema.tables 
                    WHERE table_schema = '${database}'
                    ORDER BY table_name
                `;
            } else {
                // Multi-DB mode: list all user databases
                sql = `
                    SELECT 
                        table_schema as 'database',
                        table_name as name,
                        table_rows as rowCount,
                        ROUND(data_length / 1024 / 1024, 2) as dataSizeMB,
                        table_comment as description
                    FROM information_schema.tables 
                    WHERE table_schema NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')
                    ORDER BY table_schema, table_name
                `;
            }
        }

        const result = await executeReadOnlyQuery(sql);
        const data = JSON.parse(result.content[0].text);
        outputJSON(true, data, null, result.content[1]?.text);
    } catch (error) {
        outputJSON(false, null, `Failed to list tables: ${error.message}`);
        process.exit(1);
    }
}

// Describe table structure
async function describeTable(tableName) {
    if (!tableName) {
        outputJSON(false, null, "Table name is required");
        process.exit(1);
    }

    try {
        const dbType = getDbType();
        const config = getCurrentConfig();
        let sql, params;

        if (dbType === "postgres" || dbType === "postgresql") {
            // For PostgreSQL: filter by table_name and optionally by schema
            // Default to 'public' schema if not specified in table name
            let schema = "public";
            let table = tableName;

            // Support schema.table format
            if (tableName.includes(".")) {
                [schema, table] = tableName.split(".");
            }

            sql = `
                SELECT 
                    column_name as name,
                    data_type as type,
                    udt_name as udt_type,
                    is_nullable as nullable,
                    column_default as default_value
                FROM information_schema.columns 
                WHERE table_name = $1 AND table_schema = $2
                ORDER BY ordinal_position
            `;
            params = [table, schema];
        } else {
            // For MySQL: filter by configured database if set
            const database = config.database;

            if (database) {
                sql = `
                    SELECT 
                        column_name as name,
                        data_type as type,
                        column_type as fullType,
                        is_nullable as nullable,
                        column_key as 'key',
                        column_default as 'default',
                        extra,
                        column_comment as comment
                    FROM information_schema.columns 
                    WHERE table_name = ? AND table_schema = ?
                    ORDER BY ordinal_position
                `;
                params = [tableName, database];
            } else {
                // Multi-DB mode: search across all user databases
                sql = `
                    SELECT 
                        table_schema as 'database',
                        column_name as name,
                        data_type as type,
                        column_type as fullType,
                        is_nullable as nullable,
                        column_key as 'key',
                        column_default as 'default',
                        extra,
                        column_comment as comment
                    FROM information_schema.columns 
                    WHERE table_name = ?
                    AND table_schema NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')
                    ORDER BY table_schema, ordinal_position
                `;
                params = [tableName];
            }
        }

        const rows = await executeQuery(sql, params);

        if (rows.length === 0) {
            const dbInfo = config.database ? ` in database '${config.database}'` : "";
            outputJSON(false, null, `Table '${tableName}' not found${dbInfo}`);
            process.exit(1);
        }

        outputJSON(true, rows);
    } catch (error) {
        outputJSON(false, null, `Failed to describe table: ${error.message}`);
        process.exit(1);
    }
}

// Execute SQL query
async function runQuery(sql) {
    if (!sql) {
        outputJSON(false, null, "SQL query is required");
        process.exit(1);
    }

    try {
        const result = await executeReadOnlyQuery(sql);
        const data = JSON.parse(result.content[0].text);
        const executionTime = result.content[1]?.text;
        outputJSON(!result.isError, data, result.isError ? data : null, executionTime);
        if (result.isError) process.exit(1);
    } catch (error) {
        outputJSON(false, null, `Query failed: ${error.message}`);
        process.exit(1);
    }
}

// Show help
function showHelp() {
    const config = getCurrentConfig();
    const help = {
        skill: "sql-query",
        version: SKILL_VERSION,
        currentDb: config.type,
        commands: {
            "query <sql>": "Execute a SQL query",
            "list-tables": "List all tables in the database",
            "describe <table>": "Show table structure",
            "test-connection": "Test database connection"
        },
        flags: {
            "--db=<type>": "Set database type (mysql, postgres)",
            "--postgres": "Shortcut for --db=postgres",
            "--mysql": "Shortcut for --db=mysql (default)"
        },
        examples: [
            'node index.js query "SELECT * FROM users LIMIT 5"',
            'node index.js --postgres query "SELECT * FROM users"',
            'node index.js --db=postgres list-tables',
            'node index.js list-tables',
            'node index.js describe users',
            'node index.js test-connection'
        ],
        envVars: {
            DATABASE_URL: "PostgreSQL connection string (optional)",
            MYSQL_HOST: "MySQL host (optional, default: 127.0.0.1)",
        }
    };
    console.log(JSON.stringify(help, null, 2));
}

/**
 * Parse CLI arguments and extract db type flags
 * @param {string[]} args - Command line arguments
 * @returns {{ dbType: string|null, cleanArgs: string[] }}
 */
function parseDbFlags(args) {
    let dbType = null;
    const cleanArgs = [];

    for (const arg of args) {
        if (arg === "--postgres" || arg === "--pg") {
            dbType = "postgres";
        } else if (arg === "--mysql") {
            dbType = "mysql";
        } else if (arg.startsWith("--db=")) {
            dbType = arg.substring(5);
        } else {
            cleanArgs.push(arg);
        }
    }

    return { dbType, cleanArgs };
}

// Main
async function main() {
    const rawArgs = process.argv.slice(2);

    // Parse db flags from arguments
    const { dbType, cleanArgs } = parseDbFlags(rawArgs);

    // Set database type if specified via CLI flag
    if (dbType) {
        try {
            setDbType(dbType);
        } catch (error) {
            outputJSON(false, null, error.message);
            process.exit(1);
        }
    }

    const command = cleanArgs[0];

    if (!command || command === "help" || command === "--help" || command === "-h") {
        showHelp();
        return;
    }

    switch (command) {
        case "test-connection":
            await testConnection();
            break;
        case "list-tables":
            await listTables();
            break;
        case "describe":
            await describeTable(cleanArgs[1]);
            break;
        case "query":
            await runQuery(cleanArgs.slice(1).join(" "));
            break;
        default:
            outputJSON(false, null, `Unknown command: ${command}. Use 'help' for available commands.`);
            process.exit(1);
    }

    // Close pool after command completes
    try {
        await closePool();
    } catch (e) {
        // Ignore pool closing errors
    }
}

main().catch(error => {
    outputJSON(false, null, `Unexpected error: ${error.message}`);
    process.exit(1);
});

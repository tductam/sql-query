/**
 * Database factory - returns the appropriate driver based on DB_TYPE
 */
import { DB_TYPE, getDbType, setDbType } from "./../config/postgres.js";
import { log } from "./../utils/index.js";

let mysqlDriver = null;
let postgresDriver = null;

// Lazy load drivers
async function getMysqlDriver() {
    if (!mysqlDriver) {
        mysqlDriver = await import("./mysql.js");
    }
    return mysqlDriver;
}

async function getPostgresDriver() {
    if (!postgresDriver) {
        postgresDriver = await import("./postgres.js");
    }
    return postgresDriver;
}

export async function getDriver() {
    const dbType = getDbType();
    log("info", `Using database type: ${dbType}`);

    if (dbType === "postgres" || dbType === "postgresql") {
        return await getPostgresDriver();
    }
    return await getMysqlDriver();
}

// Export factory functions
export async function getPool() {
    const driver = await getDriver();
    return driver.getPool();
}

export async function executeQuery(sql, params = []) {
    const driver = await getDriver();
    return driver.executeQuery(sql, params);
}

export async function executeReadOnlyQuery(sql) {
    const driver = await getDriver();
    return driver.executeReadOnlyQuery(sql);
}

export async function closePool() {
    const dbType = getDbType();
    if (dbType === "postgres" || dbType === "postgresql") {
        const driver = await getPostgresDriver();
        if (driver.closePool) await driver.closePool();
    } else {
        const driver = await getMysqlDriver();
        if (driver.poolPromise) {
            const pool = await driver.poolPromise;
            await pool.end();
        }
    }
}

export { DB_TYPE, getDbType, setDbType };

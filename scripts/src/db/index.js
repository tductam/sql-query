/**
 * Database module - exports factory functions
 * Use DB_TYPE env var to select database (mysql or postgres)
 */
export {
    getPool,
    executeQuery,
    executeReadOnlyQuery,
    closePool,
    getDriver,
    DB_TYPE,
    getDbType,
} from "./factory.js";

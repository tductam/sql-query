/**
 * Database module - exports factory functions
 * Use --db=postgres flag or DB_TYPE env var to select database
 */
export {
    getPool,
    executeQuery,
    executeReadOnlyQuery,
    closePool,
    getDriver,
    DB_TYPE,
    getDbType,
    setDbType,
} from "./factory.js";

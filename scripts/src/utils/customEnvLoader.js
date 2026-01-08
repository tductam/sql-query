import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Custom .env file loader that handles # character in unquoted values
 * 
 * Standard dotenv behavior:
 * - KEY=value#comment -> KEY = "value" (# starts a comment)
 * - KEY="value#123"   -> KEY = "value#123" (# is part of value)
 * - KEY='value#123'   -> KEY = "value#123" (# is part of value)
 * 
 * This custom loader behavior:
 * - KEY=abc#123       -> KEY = "abc#123" (# is part of value if no space before it)
 * - KEY=value # comment -> KEY = "value" (# with preceding space is a comment)
 * - KEY="value#123"   -> KEY = "value#123" (quoted values work as expected)
 * - KEY='value#123'   -> KEY = "value#123" (quoted values work as expected)
 */

const LINE_REGEX = /^\s*([\w.-]+)\s*=\s*/;
const QUOTED_VALUE_REGEX = /^(['"])(.*)(\1)\s*(?:#.*)?$/;

/**
 * Parse a single line from .env file
 * @param {string} line - The line to parse
 * @returns {Object|null} - { key, value } or null if not a valid env line
 */
function parseLine(line) {
    // Skip empty lines and pure comments
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
        return null;
    }

    // Match the key
    const keyMatch = line.match(LINE_REGEX);
    if (!keyMatch) {
        return null;
    }

    const key = keyMatch[1];
    let valueStart = keyMatch[0].length;
    let value = line.slice(valueStart);

    // Check if value is quoted
    if (value.startsWith('"') || value.startsWith("'")) {
        const quote = value[0];
        let endQuoteIndex = -1;
        let escaped = false;

        // Find the closing quote, handling escape characters
        for (let i = 1; i < value.length; i++) {
            if (escaped) {
                escaped = false;
                continue;
            }
            if (value[i] === '\\') {
                escaped = true;
                continue;
            }
            if (value[i] === quote) {
                endQuoteIndex = i;
                break;
            }
        }

        if (endQuoteIndex > 0) {
            // Extract the value between quotes
            value = value.slice(1, endQuoteIndex);
            // Handle escape sequences for double quotes
            if (quote === '"') {
                value = value
                    .replace(/\\n/g, '\n')
                    .replace(/\\r/g, '\r')
                    .replace(/\\t/g, '\t')
                    .replace(/\\"/g, '"')
                    .replace(/\\\\/g, '\\');
            }
        } else {
            // No closing quote found, treat as unquoted
            value = parseUnquotedValue(value);
        }
    } else {
        // Unquoted value - our custom handling
        value = parseUnquotedValue(value);
    }

    return { key, value };
}

/**
 * Parse unquoted value with custom # handling
 * Only treat # as comment start if preceded by whitespace
 * @param {string} value - The unquoted value string
 * @returns {string} - The parsed value
 */
function parseUnquotedValue(value) {
    // Look for " #" (space followed by #) as comment indicator
    // This allows abc#123 but treats "value # comment" correctly
    const commentIndex = value.search(/\s+#/);

    if (commentIndex > -1) {
        value = value.slice(0, commentIndex);
    }

    return value.trim();
}

/**
 * Parse .env file content
 * @param {string} content - The file content
 * @returns {Object} - Object with key-value pairs
 */
export function parse(content) {
    const result = {};
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
        const parsed = parseLine(line);
        if (parsed) {
            result[parsed.key] = parsed.value;
        }
    }

    return result;
}

/**
 * Load and parse .env file, then set environment variables
 * @param {Object} options - Configuration options
 * @param {string} [options.path] - Path to .env file (default: process.cwd()/.env)
 * @param {boolean} [options.override] - Whether to override existing env vars (default: false)
 * @param {string} [options.encoding] - File encoding (default: 'utf8')
 * @param {boolean} [options.debug] - Enable debug logging (default: false)
 * @returns {Object} - { parsed: Object, error?: Error }
 */
export function config(options = {}) {
    const {
        path: envPath = path.resolve(process.cwd(), '.env'),
        override = false,
        encoding = 'utf8',
        debug = false
    } = options;

    try {
        const content = fs.readFileSync(envPath, { encoding });
        const parsed = parse(content);

        for (const [key, value] of Object.entries(parsed)) {
            if (override || process.env[key] === undefined) {
                process.env[key] = value;
                if (debug) {
                    console.log(`[customEnvLoader] Set ${key}=${value}`);
                }
            } else if (debug) {
                console.log(`[customEnvLoader] Skipped ${key} (already set)`);
            }
        }

        return { parsed };
    } catch (error) {
        if (debug) {
            console.error(`[customEnvLoader] Error loading ${envPath}:`, error.message);
        }
        return { parsed: {}, error };
    }
}

/**
 * Load .env file from a specific path relative to a module
 * @param {string} moduleUrl - import.meta.url of the calling module
 * @param {string} relativePath - Relative path to .env file
 * @param {Object} options - Additional options passed to config()
 * @returns {Object} - Result from config()
 */
export function configFromModule(moduleUrl, relativePath = '.env', options = {}) {
    const __filename = fileURLToPath(moduleUrl);
    const __dirname = path.dirname(__filename);
    const envPath = path.resolve(__dirname, relativePath);

    return config({ ...options, path: envPath });
}

export default { config, parse };

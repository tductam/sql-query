---
name: sql-query
description: Executes SQL queries against MySQL or PostgreSQL databases. Default is MySQL, use --postgres flag for PostgreSQL.
---

# SQL Query Skill

This skill allows you to interact with MySQL or PostgreSQL databases via command-line scripts.

## Database Selection

- **Default**: MySQL
- **PostgreSQL**: Add `--postgres` or `--db=postgres` flag to any command

## Available Commands

Run commands from the `scripts` directory:

```bash
# Test database connection (default: MySQL)
node <SKILL_BASE_DIR>/scripts/index.js test-connection

# Test PostgreSQL connection
node <SKILL_BASE_DIR>/scripts/index.js --postgres test-connection

# List all tables
node <SKILL_BASE_DIR>/scripts/index.js list-tables
node <SKILL_BASE_DIR>/scripts/index.js --postgres list-tables

# Get table structure
node <SKILL_BASE_DIR>/scripts/index.js describe <table_name>

# Execute SQL query
node <SKILL_BASE_DIR>/scripts/index.js query "<sql>"
node <SKILL_BASE_DIR>/scripts/index.js --postgres query "<sql>"
```

## Database Flags

| Flag | Description |
|------|-------------|
| `--postgres` | Use PostgreSQL database |
| `--pg` | Shortcut for `--postgres` |
| `--mysql` | Use MySQL database (default) |
| `--db=<type>` | Set database type (mysql, postgres) |

## Output Format

All commands return JSON with this structure:

```json
{
  "success": true,
  "data": [...],
  "executionTime": "12.34 ms"
}
```

On error:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Usage Examples

### Query MySQL (default)
```bash
node <SKILL_BASE_DIR>/scripts/index.js query "SELECT * FROM users LIMIT 10"
```

### Query PostgreSQL
```bash
node <SKILL_BASE_DIR>/scripts/index.js --postgres query "SELECT * FROM customers LIMIT 10"
```

### Explore schema
```bash
# MySQL
node <SKILL_BASE_DIR>/scripts/index.js list-tables
node <SKILL_BASE_DIR>/scripts/index.js describe users

# PostgreSQL
node <SKILL_BASE_DIR>/scripts/index.js --postgres list-tables
node <SKILL_BASE_DIR>/scripts/index.js --postgres describe customers
```

### Permissions
- `ALLOW_INSERT_OPERATION` - Enable INSERT
- `ALLOW_UPDATE_OPERATION` - Enable UPDATE
- `ALLOW_DELETE_OPERATION` - Enable DELETE
- `ALLOW_DDL_OPERATION` - Enable CREATE/ALTER/DROP

Check `test-connection` output to see current permissions.
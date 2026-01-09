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
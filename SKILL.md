---
name: sql-query
description: SQL queries for MySQL/PostgreSQL. Default MySQL, use --postgres for PostgreSQL.
triggers: [database, sql, query, table, mysql, postgres, schema, insert, select, update, delete]
---

<base>node {SKILL_BASE_DIR}/scripts/index.js</base>

## WORKFLOW
BEFORE query, if context missing → EXECUTE commands yourself, DO NOT ask user:
- Tables unknown? → execute list-tables → read output
- Columns unknown? → execute describe {table} → read output
- Then build and execute query

DO NOT ask user for table/column names. GET them via commands.

## COMMANDS
```
node {SKILL_BASE_DIR}/scripts/index.js [--postgres] test-connection     # check connection
node {SKILL_BASE_DIR}/scripts/index.js [--postgres] list-tables         # list all tables  
node {SKILL_BASE_DIR}/scripts/index.js [--postgres] describe {table}    # show columns
node {SKILL_BASE_DIR}/scripts/index.js [--postgres] query "{sql}"       # run SQL
```

## WARNINGS
- DELETE/DROP/TRUNCATE → confirm with user first
- Unknown table size → use LIMIT
- SQL strings use single quotes: 'value'
- Wrap SQL in double quotes: query "SELECT * FROM t WHERE x = 'y'"
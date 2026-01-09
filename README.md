# SQL Query Skill

A Claude agent skill for querying MySQL and PostgreSQL databases.

## Setup

### 1. Install Dependencies

```bash
cd .claude/skills/mysql/scripts
npm install
```

### 2. Configure Environment

Edit the `.env` file in the `scripts/` directory:

#### For PostgreSQL:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

#### For MySQL:
```env
DB_TYPE=mysql
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASS=your_password
MYSQL_DB=your_database
```

### 3. Test Connection

```bash
node index.js test-connection
node index.js test-connection --postgres
```

## Environment Variables

### PostgreSQL

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Connection string | `postgresql://user:pass@localhost:5432/db` |
| `PG_HOST` | PostgreSQL host (if not using DATABASE_URL) | `127.0.0.1` |
| `PG_PORT` | PostgreSQL port | `5432` |
| `PG_USER` | Username | `postgres` |
| `PG_PASS` | Password | |
| `PG_DB` | Database name | |

### MySQL

| Variable | Description | Default |
|----------|-------------|---------|
| `MYSQL_HOST` | MySQL host | `127.0.0.1` |
| `MYSQL_PORT` | MySQL port | `3306` |
| `MYSQL_USER` | Username | `root` |
| `MYSQL_PASS` | Password | (empty) |
| `MYSQL_DB` | Database name | |

## Commands

```bash
node index.js test-connection  # Test DB connection
node index.js list-tables      # List all tables
node index.js describe <table> # Show table schema
node index.js query "<sql>"    # Execute SQL query
node index.js help             # Show help
```

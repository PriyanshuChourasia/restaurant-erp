> ⚠️ **READ-ONLY:** This file is read-only documentation. Do not modify unless explicitly directed. Any changes must be explicitly requested.

# Developer Module — Help & Schema Reference

## Overview

Developer tools and database utilities: provides introspection endpoints for
exploring database tables, schema metadata, backup/restore functionality,
and database creation. Intended for development/debugging purposes only.

**Base path:** `/api/developer`

## API Endpoints

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/developer/db-info` | — | Get database connection info |
| `GET` | `/developer/tables` | — | List all database tables with stats |
| `GET` | `/developer/tables/:tableName` | — | Browse table data (paginated) |
| `GET` | `/developer/tables/:tableName/columns` | — | Get table column metadata |
| `GET` | `/developer/schema` | — | Get module schema overview |
| `POST` | `/developer/backup` | — | Create database backup |
| `GET` | `/developer/backups` | — | List available backups |
| `POST` | `/developer/restore/:filename` | — | Restore from backup |
| `POST` | `/developer/create-database` | — | Create a new database |

## Key Dependencies

- Direct database access via TypeORM (no module dependencies)
- Uses raw SQL queries for table introspection

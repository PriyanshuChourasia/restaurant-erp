> ⚠️ **READ-ONLY:** This file is read-only documentation. Do not modify unless explicitly directed. Any changes must be explicitly requested.

# Permissions Module — Help & Schema Reference

## Overview

Granular permission management. Permissions are grouped by module and assigned
to roles via many-to-many relationship. Used throughout the app via the
`@Permissions()` decorator.

**Base path:** `/api/permissions`

## Entities (Tables)

### `permissions`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `name` | `varchar(100) unique` | Permission identifier (e.g. `sales.create`) |
| `description` | `text null` | Description |
| `module` | `varchar(50)` | Module this permission belongs to |
| `created_at` | `timestamp` | Created timestamp |
| `updated_at` | `timestamp` | Updated timestamp |

## API Endpoints

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/permissions` | `permissions.read` | List all permissions |
| `GET` | `/permissions/:id` | `permissions.read` | Get permission by ID |
| `POST` | `/permissions` | `permissions.create` | Create a permission |
| `PATCH` | `/permissions/:id` | `permissions.update` | Update permission |
| `DELETE` | `/permissions/:id` | `permissions.delete` | Delete permission |

## Key Dependencies

- Used by `RolesModule` for role-to-permission mapping
- `@Permissions()` decorator used across all feature modules

> ⚠️ **READ-ONLY:** This file is read-only documentation. Do not modify unless explicitly directed. Any changes must be explicitly requested.

# Roles Module — Help & Schema Reference

## Overview

Role-based access control (RBAC). Roles aggregate permissions and are assigned
to users. System roles cannot be deleted.

**Base path:** `/api/roles`

## Entities (Tables)

### `roles`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `name` | `varchar(50) unique` | Role name |
| `description` | `text null` | Description |
| `is_system` | `boolean` | System-protected role (default: false) |
| `created_at` | `timestamp` | Created timestamp |
| `updated_at` | `timestamp` | Updated timestamp |

### `role_permissions` (join table)

Maps roles to permissions via many-to-many relationship.

| Column | Type |
|--------|------|
| `role_id` | `uuid FK → roles` |
| `permission_id` | `uuid FK → permissions` |

## API Endpoints

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/roles` | `roles.read` | List all roles |
| `GET` | `/roles/:id` | `roles.read` | Get role by ID |
| `POST` | `/roles` | `roles.create` | Create a new role |
| `PATCH` | `/roles/:id` | `roles.update` | Update role |
| `DELETE` | `/roles/:id` | `roles.delete` | Delete a role |

## Key Dependencies

- `PermissionsModule` — for permission assignment

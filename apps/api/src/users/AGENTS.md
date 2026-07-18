> ⚠️ **READ-ONLY:** This file is read-only documentation. Do not modify unless explicitly directed. Any changes must be explicitly requested.

# Users Module — Help & Schema Reference

## Overview

User management: CRUD operations for system users with role assignment, soft
delete, and activity status tracking.

**Base path:** `/api/users`

## Entities (Tables)

### `users`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `name` | `varchar(100)` | User's display name |
| `email` | `varchar(255) unique` | Login email |
| `password_hash` | `varchar(255)` | BCrypt-hashed password (hidden by default) |
| `phone` | `varchar(20) null` | Contact phone |
| `is_active` | `boolean` | Activity flag (default: true) |
| `role_id` | `uuid FK → roles null` | Assigned role |
| `created_at` | `timestamp` | Created timestamp |
| `updated_at` | `timestamp` | Updated timestamp |
| `deleted_at` | `timestamp null` | Soft-delete timestamp |

**Indexes:** Unique on `email`

## API Endpoints

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/users` | `users.read` | List all users |
| `GET` | `/users/:id` | `users.read` | Get user by ID |
| `POST` | `/users` | `users.create` | Create a new user |
| `PATCH` | `/users/:id` | `users.update` | Update user details |
| `DELETE` | `/users/:id` | `users.delete` | Soft-delete a user |
| `POST` | `/users/:id/restore` | `users.update` | Restore a soft-deleted user |

## Key Dependencies

- `RolesModule` — for role assignment

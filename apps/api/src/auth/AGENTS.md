> ⚠️ **READ-ONLY:** This file is read-only documentation. Do not modify unless explicitly directed. Any changes must be explicitly requested.

# Auth Module — Help & Schema Reference

## Overview

Handles JWT-based authentication: login, registration, token refresh, logout,
and profile retrieval. Uses Passport + JWT strategy with refresh token rotation.

**Base path:** `/api/auth`

## Entities (Tables)

### `refresh_tokens`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `user_id` | `uuid FK → users` | Owning user |
| `token` | `text` | Refresh token string |
| `expires_at` | `timestamp` | Expiry timestamp |
| `is_revoked` | `boolean` | Whether token is revoked |
| `user_agent` | `varchar(500) null` | Client user-agent |
| `ip_address` | `varchar(45) null` | Client IP address |
| `created_at` | `timestamp` | Created timestamp |

**Indexes:** `idx_refresh_token_token` (unique), `idx_refresh_token_expires`

## API Endpoints

### Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/login` | Authenticate user, returns access + refresh tokens |
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/refresh` | Exchange refresh token for new access/refresh pair |

### Authenticated Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/logout` | Revoke a refresh token |
| `POST` | `/auth/logout-all` | Revoke all refresh tokens for current user |
| `GET` | `/auth/profile` | Get current user's profile |

## Key Dependencies

- `UsersModule` — for user lookup
- `RolesModule` — for role-based access

> ⚠️ **READ-ONLY:** This file is read-only documentation. Do not modify unless explicitly directed. Any changes must be explicitly requested.

# Shared Module — Help & Schema Reference

## Overview

Shared utilities, guards, decorators, interceptors, and transformers used
across all API modules. This module does not have controllers or entities of
its own — it provides cross-cutting infrastructure.

## Components

### Decorators (`src/shared/decorators/`)

| Decorator | Description |
|-----------|-------------|
| `@Public()` | Mark a route as publicly accessible (skips JWT auth) |
| `@Roles(...roles)` | Restrict route to specific roles (e.g. `@Roles('admin')`) |
| `@Permissions(...perms)` | Restrict route to specific permissions (e.g. `@Permissions('sales.create')`) |
| `@CurrentUser()` | Inject current authenticated user into route handler |

### Guards (`src/shared/guards/`)

| Guard | Description |
|-------|-------------|
| `JwtAuthGuard` | Validates JWT access token on every protected route |
| `RolesGuard` | Checks that user has required role(s) |
| `PermissionsGuard` | Checks that user has required permission(s) |

### Filters (`src/shared/filters/`)

| Filter | Description |
|--------|-------------|
| `HttpExceptionFilter` | Global HTTP exception formatting |

### Interfaces (`src/shared/interfaces/`)

| Interface | Description |
|-----------|-------------|
| `IActiveUser` | Shape of authenticated user object (id, email, role, permissions) |

### Transformers (`src/shared/transformers/`)

| Transformer | Description |
|-------------|-------------|
| `decimalTransformer` | TypeORM value transformer for decimal columns (string ↔ number) |

### Utils (`src/shared/utils/`)

| Util | Description |
|------|-------------|
| `formatQuantity()` | Multi-unit quantity formatting (e.g. "3 kg 400 g") |

## Key Dependencies

- Used by every feature module in the API
- No external module dependencies

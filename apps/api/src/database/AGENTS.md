> ⚠️ **READ-ONLY:** This file is read-only documentation. Do not modify unless explicitly directed. Any changes must be explicitly requested.

# Database Module — Help & Schema Reference

## Overview

Database seeding and initialization module. Provides seed data for all
entities at application startup, including default permissions, roles, users,
categories, items, suppliers, and configuration data.

## Components

### `DatabaseSeedService`

Seeds the following data on first run:

| Entity | Data seeded |
|--------|-------------|
| `Permission` | All granular permissions for every module |
| `Role` | Admin, Manager, Chef, and Staff roles with assigned permissions |
| `User` | Default admin user (admin@example.com) |
| `CategoryEntity` | Sample menu categories (Starters, Main Course, etc.) |
| `Item` | Sample menu items with prices |
| `Supplier` | Sample suppliers |
| `LedgerAccount` | Chart of accounts (Cash, Bank, Sales, etc.) |
| `UnitOfMeasure` | Standard UOMs (kg, g, L, ml, pcs, dozen, etc.) |
| `StorageUnit` | Default storage unit (Main Store) |
| `VoucherType` | Voucher type definitions |
| `VoucherModuleEntity` | Voucher module definitions |

## Key Dependencies

- Depends on all entity modules for seeding
- Called from `app.module.ts` on application bootstrap

## Note

This module has no controllers or API endpoints. It is a startup module that
runs during application initialization.

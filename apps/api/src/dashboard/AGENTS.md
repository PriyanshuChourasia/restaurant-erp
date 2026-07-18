> ⚠️ **READ-ONLY:** This file is read-only documentation. Do not modify unless explicitly directed. Any changes must be explicitly requested.

# Dashboard Module — Help & Schema Reference

## Overview

Dashboard summary: provides key business metrics and summaries for the main
dashboard view. Currently serves a summary endpoint with aggregated data
from sales and seating.

**Base path:** `/api/dashboard`

## API Endpoints

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/dashboard/summary` | — | Get dashboard summary metrics |

## Key Dependencies

- `SalesModule` — for invoice/sales data
- `SeatingModule` — for table/zone data

## Note

This module is intentionally lightweight. It has no dedicated entities — it
queries across other modules to produce aggregate summary data.

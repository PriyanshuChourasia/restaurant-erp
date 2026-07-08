<div align="center">
  <br />
  <div style="width: 64px; height: 64px; background: #c62828; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(198, 40, 40, 0.3);">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
      <path d="M7 2v20"/>
      <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
    </svg>
  </div>
  <h1 style="margin-top: 16px; font-size: 2.5rem; font-weight: 800; letter-spacing: -1px;">RestaurantERP</h1>
  <p style="font-size: 1.1rem; color: #64748b; max-width: 500px;">
    A full-featured restaurant management system built with NestJS, React, and TypeScript.
  </p>
  <br />
</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [How This Project Was Created](#-how-this-project-was-created)
- [Development Commands](#development-commands)
- [Environment Configuration](#environment-configuration)
- [License](#license)

---

## Overview

**RestaurantERP** is a complete restaurant management solution built as a monorepo with a NestJS REST API backend and a React single-page application frontend. It provides tools for managing orders, menus, inventory, staff, reservations, categories, and reports — all in one place.

The project was created iteratively through AI-powered prompts using [Codebuff](https://codebuff.com), an AI coding assistant that builds software through natural language conversations. Every feature, module, and configuration was generated through a series of collaborative prompts between a developer and the AI.

---

## Features

### 🍕 Point of Sale (POS)
- Interactive menu grid with category filtering
- Real-time shopping cart with quantity controls
- Table assignment and order management
- Tax calculation and checkout flow

### 📋 Order Management
- Track orders by status (New, In Progress, Completed, Cancelled)
- Order summary with stats dashboard
- Search and filter capabilities
- View order details with payment method tracking

### 🥘 Menu Management
- Manage menu items with descriptions, pricing, and categories
- Visual card-based layout with category filtering
- Status indicators (Active / Inactive)
- Search and filter menu items

### 📦 Inventory Management
- Track stock levels with real-time status indicators (Critical, Low, Ok)
- Minimum stock level alerts
- Category-based item organization
- Quick actions: Edit stock, Reorder supplies

### 👥 Staff Management
- Employee profiles with role, department, and shift information
- Department filtering (Kitchen, Service, Front Desk, Bar, Management)
- Status tracking (Active / On Leave)
- Staff directory with quick profile access

### 📅 Reservations
- Guest reservation management with status tracking
- Table booking and party size management
- Weekly calendar overview
- Search and filter reservations

### 📊 Reports & Analytics
- Revenue dashboard with KPI metrics (MTD, averages, trends)
- Revenue trend chart (last 7 days)
- Pre-built reports: Daily Sales, Popular Items, Labor Cost, Peak Hours
- An export-ready reporting interface

### 🏷️ Category Management (Tree Structure)
- **Hierarchical tree structure** — categories organized as parent-child relationships with full nesting support
- **Drag-and-drop** — move categories between parents interactively
- **Soft delete & restore** — deleted categories can be recovered
- **Activate/deactivate** — toggle categories on or off without deleting them
- **Breadcrumb navigation** — see the full ancestor path for any category
- **Search** — find categories by name across the entire tree
- **Auto-slug generation** — URL-friendly slugs generated from category names

### 🔐 Authentication & Authorization
- **JWT-based authentication** with Passport.js strategy
- **Role-based access control** (Admin, Manager, Staff)
- **Granular permissions** — per-module permission checks (48 permissions across 6 modules)
- **Global guards** — `JwtAuthGuard`, `RolesGuard`, and `PermissionsGuard` applied application-wide
- **Demo credentials** shown on the login page for easy onboarding

### ⚙️ Settings
- Restaurant information configuration (name, address, contact)
- Business hours management
- Tax and currency settings
- Quick toggles for online orders, notifications, auto-print, and 2FA

### 👤 User Profile
- Profile editing with form validation
- Password change support
- Avatar upload

---

## Tech Stack

### Backend (`apps/api/`)

| Technology | Purpose |
|---|---|
| **NestJS 11** | Backend framework with modular architecture |
| **TypeORM** | ORM for PostgreSQL database |
| **PostgreSQL** | Primary database |
| **Passport.js** | JWT authentication strategy |
| **bcrypt** | Password hashing |
| **class-validator / class-transformer** | Request validation and transformation |
| **Jest + Supertest** | Unit and E2E testing |

### Frontend (`apps/restaurant-ui/`)

| Technology | Purpose |
|---|---|
| **React 18** | UI library |
| **TypeScript** | Type-safe development |
| **Vite 5** | Build tool and dev server |
| **TanStack Router** | File-based routing (auto-generated route tree) |
| **TanStack React Query** | Server state management (queries & mutations) |
| **Axios** | HTTP client for API communication |
| **Tailwind CSS v4** | Utility-first CSS framework |
| **@base-ui/react** | Accessible UI primitives |
| **React Hook Form + Zod** | Form handling with schema validation |
| **Lucide React** | Icon library |

### Infrastructure

| Technology | Purpose |
|---|---|
| **pnpm** | Package manager (workspace monorepo) |
| **Turborepo** | Monorepo task orchestration |
| **NestJS CLI** | Backend scaffolding and build |
| **ESLint + Prettier** | Code quality and formatting |

---

## Architecture

### Monorepo Structure

```
restaurant-erp/
├── apps/
│   ├── api/              # NestJS REST API
│   └── restaurant-ui/    # React SPA
├── packages/
│   ├── eslint-config/    # Shared ESLint configuration
│   ├── typescript-config/ # Shared TypeScript configuration
│   └── ui/               # Shared UI components
├── turbo.json            # Turborepo configuration
└── pnpm-workspace.yaml   # Workspace definition
```

### Backend Module Architecture

Each backend module follows a consistent layered pattern:

```
controller → service → repository (interface) → entity
```

**Modules:**
- **`auth/`** — JWT login, registration, token validation
- **`users/`** — User CRUD, profile management
- **`roles/`** — Role definitions and assignment
- **`permissions/`** — Granular per-module permissions (6 modules × 8 actions = 48 permissions)
- **`category/`** — Tree-structured category management with ancestry tracking
- **`shared/`** — Guards (`JwtAuthGuard`, `RolesGuard`, `PermissionsGuard`), decorators (`@Public()`, `@Roles()`, `@Permissions()`, `@CurrentUser()`), filters (`HttpExceptionFilter`)

### Frontend Module Architecture

Each feature module follows:

```
api/          → Axios API calls
hooks/        → React Query hooks (queries & mutations)
types/        → TypeScript interfaces
schemas/      → Zod validation schemas
components/   → Reusable UI components
dialogs/      → Modal dialogs
forms/        → Form components
pages/        → Page components
utils/        → Utility functions
```

**Feature Modules:**
- `auth/` — Login page with demo credentials
- `category/` — Full category CRUD with tree view, drag-and-drop, and soft delete
- `menu/` — Menu item management
- `orders/` — Order tracking and management
- `inventory/` — Stock level management
- `staff/` — Employee management
- `reservations/` — Table booking management
- `reports/` — Analytics and reporting dashboard
- `settings/` — Restaurant configuration
- `user/` — Profile management
- `pos/` — Point of Sale terminal
- `layout/` — App layout and sidebar

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **pnpm** >= 8.15 (install: `npm install -g pnpm@8.15.6`)
- **PostgreSQL** running locally

### Setup

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd restaurant-erp

# 2. Install dependencies
pnpm install

# 3. Configure environment
# The API auto-loads .env.development or .env.production based on NODE_ENV
# .env.example is available as a reference template
cp apps/api/.env.example apps/api/.env.development

# Edit .env.development with your PostgreSQL credentials
# Default: postgres@localhost:5432, database: restaurant_erp_dev

# 4. Create the database
createdb restaurant_erp_dev

# 5. Start both API and UI in development mode
pnpm dev
```

The API server will start on `http://localhost:3000` and the UI on `http://localhost:5173`.

### Demo Login

| Email | Password |
|---|---|
| `admin@restaurant.com` | `Admin@123456` |

The demo credentials are shown on the login page. The backend auto-seeds demo data (permissions, roles, users, and categories) on first startup when the database is empty.

> **Note:** There are 3 seeded users: `admin@restaurant.com` (admin), `manager@restaurant.com` (manager), and `staff@restaurant.com` (staff). All use the same password `Admin@123456`.

---

## Project Structure

```
restaurant-erp/
├── .project/                        # Project documentation & task history
│   ├── knowledge.md                 # Durable project knowledge
│   ├── memory.md                    # Running log of decisions & gotchas
│   ├── prompt.md                    # LLM/agent workflow instructions
│   └── tasks/                       # Per-prompt task logs (YYYY-MM-DD-*.md)
│
├── apps/
│   ├── api/                         # NestJS REST API
│   │   ├── src/
│   │   │   ├── auth/                # Authentication module
│   │   │   ├── users/               # User management module
│   │   │   ├── roles/               # Role-based access control module
│   │   │   ├── permissions/         # Granular permissions module
│   │   │   ├── category/            # Tree-structured category module
│   │   │   ├── database/            # Database config & seed service
│   │   │   ├── shared/              # Guards, decorators, filters, interfaces
│   │   │   ├── app.module.ts        # Root module with global guards & DB config
│   │   │   ├── app.controller.ts    # Health check endpoint
│   │   │   └── main.ts              # Bootstrap: CORS, validation, global prefix
│   │   └── test/                    # E2E tests
│   │
│   └── restaurant-ui/               # React SPA
│       ├── src/
│       │   ├── components/          # Shared UI primitives (Button, Input, Sidebar, etc.)
│       │   │   ├── ui/              # shadcn-style UI primitives
│       │   │   └── layout/          # AppSidebar, DashboardHeader
│       │   ├── layouts/             # Page layouts (DashboardLayout, POSLayout)
│       │   ├── modules/             # Feature modules (auth, category, pos, orders, etc.)
│       │   ├── routes/              # TanStack Router file-based routes
│       │   ├── styles/              # Global CSS with Tailwind theme
│       │   ├── hooks/               # Shared hooks (use-mobile)
│       │   ├── lib/                 # Utilities (cn)
│       │   ├── routeTree.gen.ts     # Auto-generated route tree
│       │   └── main.tsx             # Application entry point
│       └── vite.config.ts           # Vite configuration with proxy & aliases
│
└── packages/
    ├── eslint-config/               # Shared ESLint config
    ├── typescript-config/           # Shared TypeScript configs
    └── ui/                          # Shared UI components (deprecated)
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | Public |
| `POST` | `/api/auth/login` | Login and receive JWT | Public |

### Users

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/users` | List all users | JWT |
| `GET` | `/api/users/:id` | Get user by ID | JWT |
| `POST` | `/api/users` | Create a new user | JWT |
| `PATCH` | `/api/users/:id` | Update user | JWT |
| `DELETE` | `/api/users/:id` | Delete user | JWT |

### Categories

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/categories` | List categories (paginated, filterable) | JWT |
| `GET` | `/api/categories/tree` | Get full category tree | JWT |
| `GET` | `/api/categories/roots` | Get root categories only | JWT |
| `GET` | `/api/categories/:id` | Get category by ID | JWT |
| `GET` | `/api/categories/:id/children` | Get direct children | JWT |
| `GET` | `/api/categories/:id/descendants` | Get all descendants | JWT |
| `GET` | `/api/categories/:id/ancestors` | Get all ancestors (breadcrumb) | JWT |
| `GET` | `/api/categories/:id/breadcrumb` | Get breadcrumb path | JWT |
| `POST` | `/api/categories` | Create a category | JWT |
| `PATCH` | `/api/categories/:id` | Update a category | JWT |
| `DELETE` | `/api/categories/:id` | Soft-delete a category | JWT |
| `POST` | `/api/categories/:id/restore` | Restore a deleted category | JWT |
| `PATCH` | `/api/categories/:id/move` | Move category to new parent | JWT |
| `PATCH` | `/api/categories/:id/activate` | Activate a category | JWT |
| `PATCH` | `/api/categories/:id/deactivate` | Deactivate a category | JWT |

### Roles

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/roles` | List all roles | JWT |
| `GET` | `/api/roles/:id` | Get role by ID | JWT |
| `POST` | `/api/roles` | Create a role | JWT |
| `PATCH` | `/api/roles/:id` | Update a role | JWT |
| `DELETE` | `/api/roles/:id` | Delete a role | JWT |

### Permissions

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/permissions` | List all permissions | JWT |
| `GET` | `/api/permissions/:id` | Get permission by ID | JWT |
| `POST` | `/api/permissions` | Create a permission | JWT |
| `PATCH` | `/api/permissions/:id` | Update a permission | JWT |
| `DELETE` | `/api/permissions/:id` | Delete a permission | JWT |

> **Note:** The API prefix is `/api`. All endpoints except `auth/register` and `auth/login` require a valid JWT token in the `Authorization: Bearer <token>` header.

---

## 🤖 How This Project Was Created

This project was built entirely through natural language conversations with **Codebuff** — an AI coding assistant that writes, edits, and refactors code in real time. Here's the sequence of prompts that shaped the project:

### Phase 1: Foundation

1. **"Create a NestJS API with PostgreSQL and JWT auth"** — Scaffolded the initial backend with NestJS modules for auth, users, roles, and permissions. Set up TypeORM with PostgreSQL, JWT authentication with Passport.js, and role/permission guards.

2. **"Create a React SPA with TanStack Router"** — Built the frontend with React 18, Vite, TanStack Router (file-based routing), TanStack React Query, and Tailwind CSS v4. Created the sidebar navigation, dashboard layout, and route structure.

3. **"Add category management with tree structure"** — Implemented the category module with a hierarchical tree structure (parent-child relationships using `materializedPath`), supporting CRUD, move, soft-delete, restore, and activate/deactivate. Built the frontend with tree view, drag-and-drop, search, breadcrumbs, and data tables.

### Phase 2: Features

4. **"Fix all the errors in the project"** — Ran typecheck, lint, build, and tests across all apps. Fixed ~20+ issues including missing type definitions, unused imports, async type mismatches, lint script glob patterns, and a real bug in the drag-and-drop category move logic.

5. **"Create POS dashboard, orders, inventory, staff, reservations, menu, reports, and settings pages"** — Built out all feature pages with rich UIs, state management, and navigation integration. Each module was designed with a consistent layout pattern.

6. **"Seed data to backend"** — Created `DatabaseSeedService` that auto-seeds demo data (48 permissions, 3 roles, 3 users, 11 categories). Fixed a real TypeORM bug where nullable columns without explicit `type:` crashed at DB connect time (only surfaces with a live database — invisible to `tsc`/`eslint`).

### Phase 3: Polish & Documentation

7. **"Always put a demo login password on sign in"** — Updated the login page to show the real demo password instead of masking it.

8. **"Create dev and prod envs for backend"** — Set up environment-specific `.env.development` and `.env.production` files, configured `NODE_ENV`-based loading in the NestJS `ConfigModule`, and gitignored real env files.

9. **"Set up project documentation system"** — Created `.project/knowledge.md`, `.project/memory.md`, and `.project/tasks/` to track project knowledge, decisions, and prompt history. Documented the convention in `AGENTS.md`.

10. **"Write README.md"** — And here we are! This README was itself generated through a Codebuff prompt.

> Every task in this project has a detailed log in `.project/tasks/` — you can trace the full evolution of the codebase through those files.

---

## Development Commands

```bash
# Run both API + UI in development mode
pnpm dev

# Build all packages
pnpm build

# Lint all packages
pnpm lint

# Format code
pnpm format

# --- API-specific ---
cd apps/api

pnpm start:dev            # Watch mode (NODE_ENV=development)
pnpm start:prod           # Production mode (NODE_ENV=production)
pnpm test                 # Unit tests (Jest)
pnpm test:e2e             # End-to-end tests

# --- UI-specific ---
cd apps/restaurant-ui

pnpm dev                  # Vite dev server (port 5173)
pnpm build                # Type-check + production build
```

---

## Environment Configuration

The API loads environment-specific files based on `NODE_ENV`:

| File | NODE_ENV | Purpose |
|---|---|---|
| `.env.development` | `development` | Local development config |
| `.env.production` | `production` | Production config (template) |
| `.env.example` | — | Safe-to-commit reference template |

Required environment variables:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=restaurant_erp
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h
FRONTEND_URL=http://localhost:5173
PORT=3000
```

---

## Color Theme

The UI uses a warm red-and-white theme inspired by Italian restaurant aesthetics:

- **Primary:** `#c62828` (rich red) — buttons, active states, links
- **Sidebar:** `#1a1a2e` (dark navy) — sidebar navigation
- **Background:** `#ffffff` with `#f1f5f9` muted variants
- **Semantic:** Green (success), amber (warning), red (error), blue (info)

---

## License

This project is private and not licensed for public use.

---

<div align="center">
  <p>
    Built with <a href="https://codebuff.com">Codebuff</a> — AI-powered software development through natural language.
  </p>
  <p>
    <sub>© 2026 RestaurantERP. All rights reserved.</sub>
  </p>
</div>

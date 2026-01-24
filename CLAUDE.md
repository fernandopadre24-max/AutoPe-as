# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Loja2026 is a Point of Sale (PDV) retail application for clothing stores in Brazil. It's a hybrid web/desktop application built with Next.js 16 + Tauri 2, featuring SQLite database with Drizzle ORM and AI-powered features via Genkit/Google Gemini.

**Key domains**: Products, Customers, Employees, Suppliers, Sales, Inventory, Cash Flow

## Development Commands

```bash
# Development
npm run dev              # Next.js dev server on port 9002 (turbopack)
npm run tauri            # Tauri desktop dev mode (wraps Next.js)

# Build
npm run build            # Production web build
npm run build:tauri      # Full desktop app build
npm run dist             # Alias for tauri build

# Quality
npm run typecheck        # TypeScript type checking
npm run lint             # ESLint

# Database
npm run db:init          # Initialize SQLite database
npm run db:reset         # Delete and reinitialize database

# AI Development
npm run genkit:dev       # Start Genkit dev server for AI flows
npm run genkit:watch     # Genkit with file watching
```

## Architecture

### Data Flow: Client → API → Service → Repository → SQLite

```
Client Components
    ↓ useData() hook (React Context)
    ↓ fetch('/api/...')
API Routes (src/app/api/*)
    ↓ Zod validation (src/lib/schemas/validation.ts)
    ↓ Service layer call
Services (src/lib/services/*)
    ↓ Business logic, validation, SKU generation
Repositories (src/lib/repositories/*)
    ↓ Drizzle ORM queries
SQLite Database (better-sqlite3)
```

### Key Directories

- `src/app/` - Next.js App Router pages and API routes
- `src/app/api/` - REST API endpoints (products, customers, employees, suppliers, sales, config)
- `src/app/pdv/` - Main POS interface with cart, payments, customer search
- `src/app/vendas/` - Sales management views
- `src/components/ui/` - shadcn/ui components (Radix primitives)
- `src/components/pdv/` - PDV-specific components (cart, product search)
- `src/lib/database/` - SQLite setup, schema (Drizzle), initialization
- `src/lib/repositories/` - Data access layer with base repository pattern
- `src/lib/services/` - Business logic layer
- `src/lib/schemas/` - Zod validation schemas
- `src/lib/data.tsx` - DataProvider context for client-side state
- `src/ai/` - Genkit AI flows (product descriptions, price suggestions)
- `src-tauri/` - Tauri desktop app configuration (Rust)

### Database Schema (src/lib/database/schema.ts)

Tables: `stores`, `categories`, `suppliers`, `customers`, `employees`, `products`, `sales`, `sale_items`, `inventory_movements`, `cash_flow`

All IDs are UUIDs (text). Timestamps use integer mode with Date conversion.

### Repository Pattern

Base repository in `src/lib/repositories/base.repository.ts`:
- `IBaseRepository<T>` - Generic CRUD interface
- `BaseSQLiteRepository<T>` - Drizzle-based implementation
- Custom error types: `RepositoryError`, `NotFoundError`, `ValidationError`

Entity-specific repositories extend the base with specialized queries (e.g., `findByBarcode`, `findBySku`, `findLowStock`).

### Client State Management

`DataProvider` in `src/lib/data.tsx` wraps the app and provides:
- Fetches data from all API endpoints on mount
- Exposes CRUD operations that call APIs and update local state
- Tracks `authenticatedEmployee` via sessionStorage
- Access via `useData()` hook

### API Response Format

```typescript
// Success
{ success: true, data: T, pagination?: {...} }

// Error
{ error: string, details?: ZodError }
```

## Code Conventions

### Brazilian Portuguese

- UI text, error messages, and comments are in Portuguese
- Currency: `value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })`
- Status enums: `'Pago' | 'Pendente' | 'Cancelado'`, `'Masculino' | 'Feminino' | 'Unissex'`

### TypeScript

- Strict mode enabled
- Use `@/` path alias for imports from `src/`
- Prefer `type` over `interface` for object shapes
- Use `unknown` in catch blocks, not `any`

### Components

- `'use client'` for client components (most pages)
- `'use server'` for server actions
- shadcn/ui components via `@/components/ui/`
- Icons from `lucide-react`
- Forms: React Hook Form + Zod + shadcn Form components

### Services

Services validate business rules before repository operations:
- Check for duplicate SKU/barcode
- Validate foreign key references exist
- Generate SKUs if not provided

## Tauri Integration

Desktop app wraps the Next.js frontend. Dev server runs on `localhost:9002`.

Configuration in `src-tauri/tauri.conf.json`. Database location differs between dev (`./loja2026.db`) and production (`$RESOURCE_DIR/loja2026.db`).

## AI Features (Genkit)

- `src/ai/genkit.ts` - Genkit setup with Google Gemini (2.5 Flash)
- `src/ai/flows/generate-product-description.ts` - AI product description generation
- `src/ai/flows/suggest-optimal-price.ts` - AI pricing suggestions

Requires `GOOGLE_GENAI_API_KEY` environment variable.

# Loja2026 Agent Guidelines

## Development Commands

### Build & Development
- `npm run dev` - Start development server on port 9002 with turbopack
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint

### AI Development
- `npm run genkit:dev` - Start Genkit dev server
- `npm run genkit:watch` - Start Genkit in watch mode

### Testing
No test framework is currently configured. When adding tests, follow standard Next.js testing patterns (Jest/React Testing Library) and add test commands to package.json.

## Code Style & Conventions

### File Structure
```
src/
├── app/                 # Next.js App Router pages
│   └── [route]/
│       ├── page.tsx     # Route component
│       ├── components/  # Route-specific components
│       └── actions.ts   # Server actions
├── components/          # Reusable components
│   └── ui/             # shadcn/ui components
├── lib/                # Utilities, types, helpers
├── hooks/              # Custom React hooks
└── ai/                 # AI flows and functions
```

### Imports & Aliases
Use path aliases defined in tsconfig.json:
- `@/` - Maps to `src/`
- `@/components` - Components directory
- `@/lib` - Library utilities
- `@/hooks` - Custom hooks
- `@/components/ui` - shadcn/ui components

Example imports:
```typescript
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/lib/types';
```

### Naming Conventions
- **Components**: PascalCase (`PageHeader`, `PartsTable`)
- **Functions/Variables**: camelCase (`formatPhoneNumber`, `isLoading`)
- **Types/Interfaces**: PascalCase (`Product`, `SaleItem`)
- **Constants**: SCREAMING_SNAKE_CASE for globals, camelCase for locals
- **Files**: kebab-case for components (`page-header.tsx`), camelCase for utilities (`utils.ts`)
- **Route params**: Use `id` for entity IDs in dynamic routes

### TypeScript
- Use strict mode (already configured)
- Prefer `type` over `interface` for object shapes
- Use `unknown` instead of `any` in catch blocks
- Always type function parameters and return types
- Use union types for fixed string values (`'Pago' | 'Pendente' | 'Cancelado'`)

### Components
- Use functional components with hooks
- Add `'use client'` directive at top for client components
- `'use server'` for server actions
- Props interface: `type ComponentProps = { title: string; children?: React.ReactNode }`
- Destructure props in function signature

### Forms & Validation
- Use React Hook Form with Zod validation
- Use shadcn/ui Form components for consistent styling
- Define schema with Zod: `const formSchema = z.object({...})`
- Use `zodResolver` with useForm hook
- Server actions: define in separate `actions.ts` files

### Styling
- Use Tailwind CSS classes
- Utility function: `cn(...classes)` for conditional styling (merges clsx + tailwind-merge)
- shadcn/ui components follow CSS variables for theming
- Responsive design: mobile-first with `md:`, `lg:` breakpoints

### Error Handling
Server actions should return structured responses:
```typescript
try {
  const result = await operation();
  return { data: result, error: null };
} catch (error) {
  console.error(error);
  return { data: null, error: 'Error message' };
}
```

### UI Components
Use shadcn/ui components (Radix UI primitives):
- Dialog for modals/confirmations
- Toast for notifications (use `useToast` hook)
- Form for consistent form styling
- Table for data display
- Card for grouped content
- Skeleton for loading states

### Client-Side Data
- Use `useData` hook for Firebase data fetching
- Use `useRouter` and `useSearchParams` from `next/navigation`
- Manage loading states with `isLoading` flags

### Internationalization
- UI text in Portuguese
- Currency formatting: `toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })`

### Build Configuration
- TypeScript build errors ignored in `next.config.ts` (temporary)
- ESLint ignored during builds (temporary)
- Image domains allowed: `placehold.co`, `images.unsplash.com`, `picsum.photos`

### Server Actions
Mark with `'use server'` at file top
Define in `actions.ts` files within route directories
Return type-safe responses with error handling

### Styling Patterns
- Cards: Use color-coded cards for statistics (blue, purple, amber, emerald, red)
- Icons: Use `lucide-react` icon library
- Spacing: `flex flex-col gap-8` for vertical layouts, `gap-2` for tight spacing
- Text: `text-2xl font-bold` for headings, `text-sm` for labels

### Configuration Files
- `components.json` - shadcn/ui configuration
- `tailwind.config.ts` - Tailwind CSS setup
- `next.config.ts` - Next.js configuration

## Development Workflow
1. Run `npm run dev` for development
2. Run `npm run typecheck` before committing
3. Run `npm run lint` to check code quality
4. Build with `npm run build` to verify production readiness

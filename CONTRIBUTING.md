# MarineOS - Contributing Guide

## Project Overview

MarineOS is a boat management app (web + mobile) built as a **Turborepo monorepo** with **pnpm workspaces**. The app helps boat owners track maintenance, engine hours, inventory, rigging, checklists, documents, and more.

```
marineos/
├── apps/
│   ├── web/          # Next.js 15 (App Router, React 19, Tailwind CSS v4)
│   └── mobile/       # Expo (Expo Router, React Native)
├── packages/
│   ├── ui/           # Design tokens (colors, spacing, typography, shadows, borderRadius)
│   ├── validation/   # Zod schemas for form/API validation
│   ├── hooks/        # React hooks (auth, data fetching)
│   ├── types/        # TypeScript types and DB types (planned)
│   ├── utils/        # Pure utility functions (planned)
│   └── api/          # Supabase client configuration (planned)
├── supabase/         # Migrations, seed data, Edge Functions
└── docs/             # Architecture docs (DATABASE_SCHEMA, OFFLINE_STRATEGY, BUSINESS_MODEL)
```

---

## Dev Setup

### Prerequisites

- Node.js 20+
- pnpm 10+ (`corepack enable && corepack prepare pnpm@latest --activate`)
- For mobile: Android Studio (emulator) or Xcode (simulator), or Expo Go on a physical device

### Install and Run

```bash
pnpm install                # Install all workspace dependencies

pnpm dev                    # Start web + mobile in parallel
pnpm dev:web                # Start only the web app (Next.js on :3000)
pnpm dev:mobile             # Start only the mobile Metro bundler
                            # Press 'a' for Android, 'i' for iOS
```

All commands run from the **project root**. Turborepo handles running the correct scripts in each workspace.

### Environment Variables

**Web** (`apps/web/.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

**Mobile** (`apps/mobile/.env`):

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## Architecture

### Core Principles

1. **Shared packages over duplicated logic** -- validation, tokens, hooks, types, and utilities live in `packages/` and are consumed by both apps.
2. **Platform-agnostic packages** -- code in `packages/` must NOT import from `react-native`, `next/*`, or `expo-*`.
3. **Business logic in packages** -- domain rules, calculations, and data transformations live in `packages/hooks` and `packages/utils`, not in components or Edge Functions.
4. **Supabase as a smart database** -- Auth, RLS, storage, and realtime are provided by Supabase. All domain logic stays in TypeScript for future NestJS migration.

### Dependency Graph

```
apps/web        → @marineos/ui, @marineos/validation, @marineos/hooks
apps/mobile     → @marineos/ui, @marineos/validation, @marineos/hooks

@marineos/hooks      → react (peer), @supabase/supabase-js (peer)
@marineos/validation → zod
@marineos/ui         → (zero dependencies)
@marineos/types      → (zero dependencies, planned)
@marineos/utils      → date-fns (planned)
```

### Language & Naming

- All code in **English** (variables, functions, comments)
- User-facing strings in **Spanish + English** via i18n translation files
- `camelCase` for variables/functions, `PascalCase` for components/types, `SCREAMING_SNAKE` for constants
- TypeScript strict mode everywhere
- `interface` for object shapes, `type` for unions/intersections
- `as const` objects for enums (not TypeScript `enum`)

---

## Shared Packages

### @marineos/ui (implemented)

Exports **design tokens only** as plain JavaScript objects. No React components -- each platform builds its own components using these shared tokens.

```typescript
import { colors, spacing, typography, shadows, borderRadius } from "@marineos/ui";
```

**Exports:**

- `colors` -- Nautical palette: primary (ocean blue 50-900), secondary (teal 50-900), neutral (slate 50-950), status, background, text, border. All hex values.
- `spacing` -- xs:4, sm:8, md:16, lg:24, xl:32, 2xl:48, 3xl:64
- `typography` -- fontSize (xs:12 through 4xl:36), lineHeight, fontWeight
- `shadows` -- sm/md/lg with React Native-compatible shape
- `borderRadius` -- sm:4, md:8, lg:12, xl:16, full:9999

**Web consumption:** Token values are mapped to CSS custom properties in `apps/web/app/globals.css`. The `@theme` block registers palette shades as Tailwind utilities (`bg-primary-500`, `text-neutral-700`). Shadcn semantic variables (`--primary`, `--background`, etc.) use token values.

**Mobile consumption:** Tokens are used directly in `StyleSheet.create()`.

### @marineos/validation (implemented)

Zod schemas for all forms and data mutations. One schema file per domain entity.

```typescript
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@marineos/validation";
import { emailSchema, passwordSchema, uuidSchema } from "@marineos/validation";
```

**Pattern:** Schemas use error codes as messages (`required`, `invalid`, `tooShort`, `tooLong`, `mismatch`). Each app maps these codes to localized strings via its i18n system.

```typescript
const result = loginSchema.safeParse(data);
if (!result.success) {
  for (const issue of result.error.issues) {
    // issue.path[0] = "email", issue.message = "required"
    // Map to: t(`auth.validation.email.required`)
  }
}
```

**Rules:**

- Always export both schema and inferred type (`z.infer<>`)
- Use `.refine()` for cross-field validations
- Reuse common fragments from `shared/common.ts`
- All schemas exported from `src/index.ts`

### @marineos/hooks (implemented -- auth only)

Platform-agnostic React hooks. Currently provides auth hooks; data hooks (useBoats, etc.) will be added as features are built.

```typescript
import { AuthProvider, useAuth } from "@marineos/hooks";
```

**AuthProvider** receives a `SupabaseClient` as prop (injected by each app):

- Subscribes to `onAuthStateChange` for reactive state
- Provides `user`, `session`, `loading`, `signIn()`, `signUp()`, `signOut()`

**Rules:**

- No platform-specific imports
- Data source injected via context (Supabase on web, PowerSync on mobile in the future)
- Heavy logic delegated to `@marineos/utils`

### @marineos/types (planned)

- `database.types.ts` -- auto-generated from Supabase (`supabase gen types`)
- Domain models in `models/` -- extend DB types with computed/joined shapes
- Enums as `as const` objects
- Zero runtime dependencies

### @marineos/utils (planned)

- Pure, side-effect-free functions
- Nautical/marine calculations (e.g. `calculateNextDueDate`, `formatRelativeDate`)
- Uses `date-fns` for date logic
- Every function tested with Vitest

### @marineos/api (planned)

- Supabase client configuration and storage helpers
- Note: currently, each app creates its own Supabase client locally because the server client needs `next/headers` (platform-specific)

---

## Web App (`apps/web`)

### Stack

- **Next.js 15** with App Router, React 19
- **Tailwind CSS v4** (configured via CSS `@theme`, not `tailwind.config.ts`)
- **shadcn/ui** components
- **next-intl** for i18n (Spanish + English)
- **@supabase/ssr** for cookie-based auth
- Deployed on **Vercel**

### Component Model

- **Server Components by default** -- only add `'use client'` when the component needs interactivity
- Keep client components small and leaf-level
- Use `async` components for data fetching in Server Components

### Routing

- All routes under `app/[locale]/` for i18n support
- Route groups: `(auth)` for login/register, `(dashboard)` for authenticated pages
- Middleware handles locale detection and auth session refresh

### Auth

- Server actions with `loginSchema.safeParse()` / `registerSchema.safeParse()` from `@marineos/validation`
- Returns `fieldErrors` mapped to i18n codes
- Forms display per-field errors via `auth.validation.*` translation keys

### Styling

- Tailwind CSS exclusively (no inline styles, no CSS modules)
- Design tokens from `@marineos/ui` mapped to CSS custom properties in `globals.css`
- Palette utilities: `bg-primary-500`, `text-neutral-700`, `border-secondary-200`
- Semantic variables: `bg-primary`, `text-foreground`, `bg-destructive` (used by shadcn components)

### File Structure

```
apps/web/
├── app/[locale]/(auth)/          # Login, register (server actions + forms)
├── app/[locale]/(dashboard)/     # Authenticated pages
├── components/ui/                # shadcn/ui components
├── components/auth/              # Auth form components
├── components/features/          # Feature-specific components
├── lib/supabase/                 # server.ts, client.ts (local Supabase clients)
├── messages/                     # es.json, en.json (next-intl translations)
└── app/globals.css               # Tailwind config + design token mapping
```

---

## Mobile App (`apps/mobile`)

### Stack

- **Expo** (managed workflow, SDK 54)
- **Expo Router** for file-based navigation
- **React Native** 0.81
- **i18next** + **expo-localization** for i18n
- **react-native-mmkv** for session storage and preferences
- Targets **Android + iOS**

### Auth

- `AuthProvider` from `@marineos/hooks` wraps the app in root layout
- Login/register screens use `loginSchema` / `registerSchema` from `@marineos/validation`
- Same error code -> i18n translation pattern as web
- Supabase client with MMKV storage adapter for persistent sessions

### Styling

- `StyleSheet.create()` with tokens from `@marineos/ui`
- Never hardcode color values -- always use `colors`, `spacing`, `typography` from tokens

### Navigation

- Expo Router (file-based routing in `app/`)
- `(auth)` group for login/register
- `(tabs)` group for main tab navigation
- Auth guard in root layout redirects based on session state

### Offline-First (future)

- PowerSync (`@powersync/react-native`) for local SQLite + sync with Supabase
- MMKV for user preferences, theme, and session
- Offline file queue for photos/documents

### File Structure

```
apps/mobile/
├── app/_layout.tsx               # Root layout (providers, auth guard)
├── app/(auth)/                   # Login, register screens
├── app/(tabs)/                   # Tab-based main navigation
├── lib/supabase.ts               # Supabase client with MMKV adapter
├── i18n/                         # i18next config + es.json, en.json
└── babel.config.js
```

---

## Database

- **Supabase** (PostgreSQL) with Row-Level Security (RLS)
- All DB access through typed Supabase client
- Migrations in `supabase/migrations/`
- Seed data in `supabase/seed.sql` (engine models catalog, checklist templates)
- Run `supabase gen types typescript --project-id <id> > packages/types/src/database.types.ts` after every migration

### Migrations Workflow

```bash
pnpm supabase migration new <name>    # Create migration
pnpm supabase db reset                # Apply locally
pnpm supabase db push                 # Push to production
```

### RLS Policies

- Users can only access boats they are members of
- Actions restricted by role: owner > crew > viewer
- See `docs/DATABASE_SCHEMA.md` for policy details

---

## Git Workflow

### Commit Messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/). All commit messages are validated automatically by a `commit-msg` hook via **commitlint**.

**Format:**

```
type(scope): description
```

**Allowed types:**

| Type       | When to use                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | A new feature                                           |
| `fix`      | A bug fix                                               |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test`     | Adding or updating tests                                |
| `docs`     | Documentation only changes                              |
| `chore`    | Build process, tooling, or dependency changes           |
| `style`    | Code style (formatting, missing semicolons, etc.)       |
| `perf`     | A performance improvement                               |
| `ci`       | CI/CD configuration changes                             |
| `revert`   | Reverts a previous commit                               |

**Scope** is optional and refers to the affected area: `auth`, `mobile`, `web`, `validation`, `hooks`, `ui`, `db`, etc.

**Examples:**

```
feat(auth): add password reset flow
fix(mobile): correct error banner color
refactor(validation): use ValidationError constants
test(hooks): add AuthProvider unit tests
docs: update CONTRIBUTING guide
chore: configure pre-commit hooks
```

**Invalid examples** (will be rejected):

```
fixed stuff
WIP
update code
```

### Git Hooks

The project uses **Husky** to run automated checks:

| Hook         | What it runs                                     | When          |
| ------------ | ------------------------------------------------ | ------------- |
| `pre-commit` | `lint-staged` (Prettier + ESLint) + `turbo lint` | Before commit |
| `commit-msg` | `commitlint` (Conventional Commits validation)   | Before commit |
| `pre-push`   | `turbo test` (full test suite)                   | Before push   |

To skip hooks temporarily (e.g., WIP branches): `git commit --no-verify` / `git push --no-verify`.

---

## Testing

- **Shared packages:** Vitest for unit tests
- **Web:** Next.js built-in testing / Playwright for E2E
- **Mobile:** React Native Testing Library for components, Detox for E2E

---

## Deployment

- **Web:** Vercel (automatic deploys from main branch)
- **Mobile:** EAS Build (development, preview, and production profiles)

```bash
eas build --platform all --profile development    # Dev build
eas build --platform all --profile preview        # Internal testing
eas build --platform all --profile production     # Store release
eas submit --platform ios                         # Submit to App Store
eas submit --platform android                     # Submit to Play Store
```

---

## i18n

Both apps support **Spanish** (default) and **English**.

- **Web:** `next-intl` with `messages/es.json` and `messages/en.json`
- **Mobile:** `i18next` + `expo-localization` with `i18n/es.json` and `i18n/en.json`

Translation key structure is shared across both apps (same keys, same nesting). When adding new keys, update both web and mobile translation files.

Validation error messages use error codes from Zod schemas, translated via `auth.validation.<field>.<code>` keys.

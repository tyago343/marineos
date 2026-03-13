# @marineos/api - Supabase API Layer Guide

## Purpose

This package contains the **Supabase client configuration**, **Edge Functions**, and serves as the reference point for database-related concerns. The actual SQL migrations live in the `supabase/` directory at the project root (managed by Supabase CLI), but this package provides the TypeScript client and any API abstraction needed.

## Package Structure

```
packages/api/src/
├── index.ts              # Public API
├── client/
│   ├── browser.ts        # Client-side Supabase client (for mobile + web client components)
│   └── server.ts         # Server-side Supabase client (for Next.js server components/actions)
├── storage/
│   ├── upload.ts          # Upload file to Supabase Storage
│   ├── download.ts        # Get signed URL or public URL
│   └── buckets.ts         # Bucket names and config
└── helpers/
    └── queries.ts         # Common query patterns (get boats for user, etc.)
```

Supabase project files (at project root):

```
supabase/
├── config.toml            # Supabase CLI config
├── migrations/
│   ├── 00001_initial_schema.sql
│   ├── 00002_rls_policies.sql
│   └── ...
├── seed.sql               # Seed data (engine models, checklist templates)
└── functions/
    └── ...                # Edge Functions (minimal use)
```

## Client Configuration

### Browser Client (Web client-side + Mobile)

```typescript
// client/browser.ts
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@marineos/types";

export function createBrowserClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Server Client (Next.js only)

```typescript
// client/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@marineos/types";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookies) =>
          cookies.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );
}
```

## Storage Helpers

```typescript
// storage/upload.ts
import type { SupabaseClient } from "@supabase/supabase-js";

export async function uploadDocument(
  supabase: SupabaseClient,
  file: File | Blob,
  bucket: "documents" | "photos" | "avatars",
  path: string
) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });

  if (error) throw error;
  return data.path;
}

export function getPublicUrl(supabase: SupabaseClient, bucket: string, path: string) {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
```

## Migrations Workflow

```bash
# Create a new migration
pnpm supabase migration new <migration_name>

# Apply migrations locally
pnpm supabase db reset

# Push migrations to remote (production)
pnpm supabase db push

# Generate TypeScript types after schema changes
pnpm supabase gen types typescript --project-id <id> > packages/types/src/database.types.ts
```

## Seed Data

The `supabase/seed.sql` file contains initial data:

- **Engine models catalog**: Volvo Penta 2002, Yanmar 3GM30F, etc. with their service intervals
- **Checklist templates**: "Before sailing", "At anchor", "Winterization"
- **Material lifespan data**: for rope/rigging calculations

## RLS Policies

All RLS policies follow the authorization model:

- Users can only access boats they are members of
- Actions are restricted by role (owner > crew > viewer)
- See `docs/DATABASE_SCHEMA.md` for policy guidelines

## Edge Functions (Minimal)

Keep Edge Functions minimal. Use only for:

- **Webhooks**: receiving external events
- **Cron jobs**: scheduled tasks (check maintenance due dates, send notifications)
- **OCR/AI pipeline**: future - processing uploaded PDFs

Complex business logic stays in `@marineos/hooks` and `@marineos/utils`.

## Local Development

```bash
# Start local Supabase (requires Docker)
pnpm supabase start

# Stop
pnpm supabase stop

# View local dashboard
# http://localhost:54323
```

## Rules

- Client creation functions must be typed with `Database` from `@marineos/types`
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client-side code
- All database mutations should go through RLS (use anon key, not service role)
- Regenerate types after every migration
- Keep Edge Functions thin - delegate logic to shared packages

# Supabase Setup with CLI

This project uses Supabase CLI for database migrations, making it easy to version control and deploy schema changes.

## Prerequisites

1. Create a Supabase project at https://supabase.com
2. Install Supabase CLI (or use via npx):
   ```bash
   npm install -g supabase
   # OR use npx (no installation needed)
   ```

## Initial Setup

1. **Link to your Supabase project:**
   ```bash
   npx supabase link --project-ref your-project-ref
   ```
   You can find your project ref in your Supabase dashboard URL or project settings.

2. **Set environment variables** in `.env`:
   ```env
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
   Get these from Project Settings → API in your Supabase dashboard.

3. **Push migrations to your remote database:**
   ```bash
   npx supabase db push
   ```
   This will apply all migrations in `supabase/migrations/` to your remote database.

## Working with Migrations

### Create a new migration
```bash
npx supabase migration new migration_name
```

### Apply migrations locally (if using local dev)
```bash
npx supabase db reset  # Resets local DB and applies all migrations
```

### Push migrations to remote
```bash
npx supabase db push
```

### Check migration status
```bash
npx supabase migration list
```

## Local Development (Optional)

If you want to run Supabase locally:

1. **Start local Supabase:**
   ```bash
   npx supabase start
   ```

2. **Apply migrations locally:**
   ```bash
   npx supabase db reset
   ```

3. **Stop local Supabase:**
   ```bash
   npx supabase stop
   ```

## Authentication

Ensure email/password authentication is enabled in your Supabase dashboard:
- Go to Authentication → Providers
- Enable Email provider

## Notes

- All migrations are stored in `supabase/migrations/`
- The initial migration creates the `habits` and `habit_entries` tables with RLS policies
- Schema changes should always be done via migrations, not directly in the dashboard
- The `schema.sql` file is kept as a reference but migrations are the source of truth

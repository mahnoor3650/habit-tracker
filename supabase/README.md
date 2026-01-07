# Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. In Project Settings → API, copy:
   - Project URL → set in `.env` as `VITE_SUPABASE_URL`
   - anon public key → set as `VITE_SUPABASE_ANON_KEY`
3. Open the SQL editor and run the script in `supabase/schema.sql`
4. Ensure Row Level Security is enabled (the script does this and adds policies)
5. (Optional) Add email auth settings in Authentication → Providers

Environment variables (.env):
```
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```



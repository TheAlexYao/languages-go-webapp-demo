# How to Run the Multi-Language Migration

Since the migration requires database access, you'll need to run it through one of these methods:

## Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase SQL Editor:
   https://supabase.com/dashboard/project/jdmzqrbabxnaarihvwfp/sql/new

2. Copy the entire contents of `docs/migration_add_all_translations.sql`

3. Paste it into the SQL editor

4. Click "Run" to execute the migration

## Option 2: Using Supabase CLI with Password

If you have your database password:

```bash
cat docs/migration_add_all_translations.sql | npx supabase db push --password YOUR_PASSWORD
```

## Option 3: Using psql

If you have PostgreSQL client installed:

```bash
psql "YOUR_DATABASE_URL" -f docs/migration_add_all_translations.sql
```

## What This Migration Does

- Adds a `supported_languages` table with 8 languages
- Creates a `translations` JSONB column in `master_vocabulary`
- Adds translations for all existing vocabulary words in all 8 languages:
  - Spanish 🇪🇸
  - French 🇫🇷
  - German 🇩🇪
  - Italian 🇮🇹
  - Portuguese 🇵🇹
  - Japanese 🇯🇵
  - Korean 🇰🇷
  - Chinese 🇨🇳
- Adds new technology vocabulary (laptop, keyboard, mouse, etc.)
- Creates helper functions for easy translation access

## After Running the Migration

1. Refresh your app
2. You should see all 8 languages in the language selector
3. Try switching between languages - the vocabulary cards should show different translations
4. Take a photo to test that new vocabulary is generated with all translations

## Troubleshooting

If you encounter any errors:

1. Check that you're connected to the correct database
2. Ensure you have the necessary permissions
3. The migration is idempotent (safe to run multiple times)
4. If a table/column already exists, it will be skipped
# ChronoLuna

A personal mobile Event Countdown (ChronoLuna) that syncs to a Supabase database.

---

## Setup

### Step 1 — Create a Supabase Integration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/organizations) and open your workspace.
2. Click your organization name or create a new organization.
3. Create a new project
4. On the Project main page, you will be able to see ur project name, under it is ur **Supabase - Project URL**
5. Click the dropdown beside the url, you will be able to find **Supabase - Publishable Key** 

---

### Step 2 — Create the Event Table

1. On the left navigation, redirect to **SQL Editor**
2. **Paste** the following SQL query and run it to create the **Events Table**
   ```
   #SQL Query

   CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    category TEXT DEFAULT '⭐',
    repeat TEXT DEFAULT 'none',
    cal_type TEXT DEFAULT 'gregorian',
    lunar_meta TEXT,
    notes TEXT,
    notifs TEXT,
    color TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

[Optional - Low Security]

1. On the left navigation, redirect to **Table Editor**
2. Enable "RLS policies" 
3. On the left navigation, redirect to **Authentication > Policies > Create Policy > Enable Read Access for all Users**
4. On the left navigation, redirect to **SQL Editor**
5. **Paste** the following SQL query and run it to create the **Insert Policy**
   ```
   #SQL Query
   
   CREATE POLICY "Enable insert for anon and authenticated"
   on "public"."events"
   to public
   with check (
     (auth.role() = ANY (ARRAY['anon'::text, 'authenticated'::text]))
   );

   CREATE POLICY "Enable delete for anon and authenticated"
   ON "public"."events"
   FOR DELETE
   TO public
   USING (
     (auth.role() = ANY (ARRAY['anon'::text, 'authenticated'::text]))
   );
   
   ```
---

### Step 3 — Configure the App

Open the app in your browser. On first launch you'll see a setup screen with these fields:

| Field                        | Value                                              |
|------------------------------|----------------------------------------------------|
| **SUPABASE URL**             | Your Project URL (https://xxxxxxx.supabase.co)     |
| **SUPABASE PUBLISHABLE KEY** | Public key (sb_publishable_xxxxxxxxx)              |
| **Currency Symbol**          | e.g. `$`, `£`, `€`, `S$`                           |
| **Your Name**                | Used for the greeting (optional)                   |

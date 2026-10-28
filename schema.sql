-- Chop Campus Marketplace: starter schema for Supabase.
-- Review and adapt columns to the exact fields used by your frontend before production.
-- Run in Supabase Dashboard -> SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'student' check (role in ('student','seller','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  category text,
  price numeric(12,2) not null default 0 check (price >= 0),
  currency text not null default 'GHS',
  image_url text,
  contact_phone text,
  contact_whatsapp text,
  status text not null default 'pending' check (status in ('pending','published','rejected','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.reports enable row level security;

-- Profiles: signed-in users may read public profile fields; users may update their own profile.
create policy "profiles readable by authenticated users"
on public.profiles for select to authenticated using (true);
create policy "users insert own profile"
on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "users update own profile"
on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Public can see published listings. Authenticated sellers can create/update their own listings.
create policy "published listings are public"
on public.listings for select to anon, authenticated using (status = 'published' or seller_id = auth.uid());
create policy "seller creates own listing"
on public.listings for insert to authenticated with check (seller_id = auth.uid());
create policy "seller updates own listing"
on public.listings for update to authenticated using (seller_id = auth.uid()) with check (seller_id = auth.uid());
create policy "seller deletes own listing"
on public.listings for delete to authenticated using (seller_id = auth.uid());

-- Reports can be submitted by signed-in users and viewed by their reporter.
create policy "signed-in users submit reports"
on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy "reporter sees own reports"
on public.reports for select to authenticated using (reporter_id = auth.uid());

-- IMPORTANT:
-- Admin moderation policies are intentionally NOT granted based on a client-editable role field.
-- Implement admin authorization with trusted app_metadata/custom claims and server-side checks,
-- or use a protected Edge Function. Do not trust user_metadata for admin permissions.

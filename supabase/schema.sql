-- RevizUp : schéma de la base de données.
-- À coller une seule fois dans Supabase > SQL Editor > New query, puis "Run".

-- 1. Profils : un par utilisateur, créé automatiquement à l'inscription.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  generations_used integer not null default 0,
  stripe_customer_id text unique,
  stripe_subscription_id text,
  created_at timestamptz not null default now()
);

-- 2. Cours importés.
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  source text,
  content text not null,
  topics jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists courses_user_idx on public.courses (user_id, created_at desc);

-- 3. Fiches et quiz générés.
create table if not exists public.outputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  kind text not null check (kind in ('fiche', 'quiz')),
  topic text not null default 'Tout le cours',
  options jsonb not null default '{}'::jsonb,
  body jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists outputs_course_idx on public.outputs (course_id, created_at desc);
create index if not exists outputs_user_idx on public.outputs (user_id, created_at desc);

-- 4. Sécurité : chacun ne voit que ses propres données.
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.outputs enable row level security;

drop policy if exists "profil lisible par son propriétaire" on public.profiles;
create policy "profil lisible par son propriétaire" on public.profiles
  for select using (auth.uid() = id);
-- Pas de politique update/insert sur profiles : le plan et le quota ne se modifient que côté serveur.

drop policy if exists "cours du propriétaire" on public.courses;
create policy "cours du propriétaire" on public.courses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "fiches du propriétaire" on public.outputs;
create policy "fiches du propriétaire" on public.outputs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 5. Création automatique du profil à l'inscription.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. Quota : consomme une génération si l'utilisateur y a droit (appelée uniquement par le serveur).
create or replace function public.consume_generation(p_user uuid, p_free_limit integer, p_pro_monthly_limit integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_plan text;
  v_month_count integer;
begin
  select plan into v_plan from public.profiles where id = p_user for update;
  if v_plan is null then
    return false;
  end if;
  if v_plan = 'pro' then
    select count(*) into v_month_count from public.outputs
      where user_id = p_user and created_at > now() - interval '30 days';
    if v_month_count >= p_pro_monthly_limit then
      return false;
    end if;
    update public.profiles set generations_used = generations_used + 1 where id = p_user;
    return true;
  end if;
  update public.profiles set generations_used = generations_used + 1
    where id = p_user and generations_used < p_free_limit;
  return found;
end;
$$;

create or replace function public.refund_generation(p_user uuid)
returns void language sql security definer set search_path = public as $$
  update public.profiles set generations_used = greatest(generations_used - 1, 0) where id = p_user;
$$;

revoke all on function public.consume_generation(uuid, integer, integer) from public, anon, authenticated;
revoke all on function public.refund_generation(uuid) from public, anon, authenticated;
grant execute on function public.consume_generation(uuid, integer, integer) to service_role;
grant execute on function public.refund_generation(uuid) to service_role;

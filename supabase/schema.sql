-- BabyCare Plus schema for Supabase
-- 1) Activar UUID extension
create extension if not exists "uuid-ossp";

-- 2) Tabla de perfiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  username text not null unique,
  email text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3) Tabla de citas
create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  type text not null,
  doctor text not null,
  notes text,
  created_at timestamptz default now()
);

-- 4) Tabla de estudios
create table if not exists public.studies (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  date date not null,
  category text not null,
  file_name text,
  file_data text,
  created_at timestamptz default now()
);

-- 5) Tabla de medicamentos
create table if not exists public.medications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  dosage text not null,
  frequency text not null,
  schedule_time text not null,
  notes text,
  active boolean default true,
  created_at timestamptz default now()
);

-- 6) Tabla de crecimiento
create table if not exists public.growth (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  weight numeric not null,
  height numeric not null,
  head numeric not null,
  created_at timestamptz default now()
);

-- 7) Row Level Security
alter table public.profiles enable row level security;
alter table public.appointments enable row level security;
alter table public.studies enable row level security;
alter table public.medications enable row level security;
alter table public.growth enable row level security;

-- 8) Políticas:
-- Los usuarios solo ven sus propios registros.
create policy "profiles_self" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "appointments_self" on public.appointments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "studies_self" on public.studies
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "medications_self" on public.medications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "growth_self" on public.growth
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 9) Trigger para actualizar profiles.updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
before update on public.profiles
for each row execute procedure public.update_updated_at();

-- 10) Función para crear perfil automático al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, username, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    username = excluded.username,
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Esquema de la app de fichas de plantas.
-- Ejecutar completo en Supabase → SQL Editor → New query → Run.

-- Colecciones: cada una tiene dos links secretos (edición y solo lectura).
-- Solo se guarda el hash SHA-256 de cada token, nunca el token en sí.
create table if not exists public.colecciones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(nombre) between 1 and 120),
  token_edicion_hash text not null unique,
  token_lectura_hash text not null unique,
  creado_en timestamptz not null default now()
);

create table if not exists public.fichas (
  id uuid primary key default gen_random_uuid(),
  coleccion_id uuid not null references public.colecciones(id) on delete cascade,
  nombre_cientifico text not null check (char_length(nombre_cientifico) between 1 and 200),
  nombre_comun text check (char_length(nombre_comun) <= 200),
  lugar_texto text not null check (char_length(lugar_texto) between 1 and 300),
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  fecha_recoleccion date not null,
  autor text check (char_length(autor) <= 80),
  numero_semilla text check (char_length(numero_semilla) <= 50),
  comentario text check (char_length(comentario) <= 1000),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  -- null = ficha activa; con fecha = en la papelera
  eliminado_en timestamptz
);

-- Columnas agregadas después de la primera versión: para bases ya creadas.
alter table public.fichas
  add column if not exists numero_semilla text check (char_length(numero_semilla) <= 50),
  add column if not exists comentario text check (char_length(comentario) <= 1000);

create index if not exists fichas_coleccion_idx
  on public.fichas (coleccion_id, eliminado_en, fecha_recoleccion desc);

create table if not exists public.fotos (
  id uuid primary key default gen_random_uuid(),
  ficha_id uuid not null references public.fichas(id) on delete cascade,
  tipo text not null check (tipo in ('planta', 'flor', 'fruto')),
  ruta text not null,
  ruta_miniatura text not null,
  creado_en timestamptz not null default now(),
  unique (ficha_id, tipo)
);

-- Mantener actualizado_en al día en cada edición.
create or replace function public.tocar_actualizado_en()
returns trigger language plpgsql as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

drop trigger if exists fichas_actualizado_en on public.fichas;
create trigger fichas_actualizado_en
  before update on public.fichas
  for each row execute function public.tocar_actualizado_en();

-- RLS activado SIN políticas: las claves públicas (anon/publishable) no pueden
-- leer ni escribir nada. Solo el servidor de la app, con la clave secreta, accede.
alter table public.colecciones enable row level security;
alter table public.fichas enable row level security;
alter table public.fotos enable row level security;

-- Bucket privado para las fotos: máximo 1 MB por archivo, solo JPEG/WebP.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 1048576, array['image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

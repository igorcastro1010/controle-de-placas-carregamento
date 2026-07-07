create extension if not exists pgcrypto;

create table if not exists public.veiculos_motoristas (
  id uuid primary key default gen_random_uuid(),
  tipo_veiculo text,
  placa text,
  placa_normalizada text,
  placa_cavalo text,
  placa_cavalo_normalizada text,
  placa_carreta text,
  placa_carreta_normalizada text,
  motorista text,
  telefone text,
  rota_1 text,
  rota_2 text,
  rota_3 text,
  observacao_padrao text,
  ultimo_uso_em timestamp with time zone,
  criado_por text,
  criado_por_id uuid references auth.users(id) on delete set null,
  atualizado_por text,
  atualizado_por_id uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.veiculos_motoristas add column if not exists placa_normalizada text;
alter table public.veiculos_motoristas add column if not exists placa_cavalo_normalizada text;
alter table public.veiculos_motoristas add column if not exists placa_carreta_normalizada text;

update public.veiculos_motoristas
set
  placa_normalizada = nullif(regexp_replace(upper(coalesce(placa, '')), '[^A-Z0-9]', '', 'g'), ''),
  placa_cavalo_normalizada = nullif(regexp_replace(upper(coalesce(placa_cavalo, '')), '[^A-Z0-9]', '', 'g'), ''),
  placa_carreta_normalizada = nullif(regexp_replace(upper(coalesce(placa_carreta, '')), '[^A-Z0-9]', '', 'g'), '')
where placa_normalizada is null
   or placa_cavalo_normalizada is null
   or placa_carreta_normalizada is null;

create index if not exists veiculos_motoristas_placa_idx on public.veiculos_motoristas (placa);
create index if not exists veiculos_motoristas_placa_cavalo_idx on public.veiculos_motoristas (placa_cavalo);
create index if not exists veiculos_motoristas_placa_carreta_idx on public.veiculos_motoristas (placa_carreta);
create index if not exists veiculos_motoristas_motorista_idx on public.veiculos_motoristas (motorista);
create index if not exists veiculos_motoristas_ultimo_uso_idx on public.veiculos_motoristas (ultimo_uso_em);
create index if not exists idx_veiculos_placa_normalizada on public.veiculos_motoristas (placa_normalizada);
create index if not exists idx_veiculos_placa_cavalo_normalizada on public.veiculos_motoristas (placa_cavalo_normalizada);
create index if not exists idx_veiculos_placa_carreta_normalizada on public.veiculos_motoristas (placa_carreta_normalizada);

create or replace function public.set_veiculos_motoristas_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists veiculos_motoristas_updated_at on public.veiculos_motoristas;
create trigger veiculos_motoristas_updated_at
before update on public.veiculos_motoristas
for each row
execute function public.set_veiculos_motoristas_updated_at();

alter table public.veiculos_motoristas enable row level security;

drop policy if exists "Usuarios autenticados podem ler veiculos motoristas" on public.veiculos_motoristas;
drop policy if exists "Usuarios autenticados podem inserir veiculos motoristas" on public.veiculos_motoristas;
drop policy if exists "Usuarios autenticados podem atualizar veiculos motoristas" on public.veiculos_motoristas;
drop policy if exists "usuarios autenticados podem ler veiculos" on public.veiculos_motoristas;
drop policy if exists "usuarios autenticados podem inserir veiculos" on public.veiculos_motoristas;
drop policy if exists "usuarios autenticados podem atualizar veiculos" on public.veiculos_motoristas;

create policy "usuarios autenticados podem ler veiculos"
on public.veiculos_motoristas for select
to authenticated
using (true);

create policy "usuarios autenticados podem inserir veiculos"
on public.veiculos_motoristas for insert
to authenticated
with check (auth.uid() = criado_por_id);

create policy "usuarios autenticados podem atualizar veiculos"
on public.veiculos_motoristas for update
to authenticated
using (true)
with check (true);

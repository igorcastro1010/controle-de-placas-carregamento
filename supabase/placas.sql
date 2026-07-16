create extension if not exists pgcrypto;

create table if not exists public.placas (
  id uuid primary key default gen_random_uuid(),
  data date not null default current_date,
  hora time without time zone not null default localtime(0),
  ordem integer not null,
  placa text not null,
  tipo_veiculo text default 'Truck',
  tipo_carroceria text default 'BAU',
  carroceria text,
  placa_cavalo text,
  placa_carreta text,
  entrega_local boolean default false,
  retorno_local boolean default false,
  prioridade_local boolean default false,
  prioridade_motivo text,
  prioridade_por text,
  prioridade_em timestamp with time zone,
  motorista text not null,
  telefone text,
  rota_1 text,
  rota_2 text,
  rota_3 text,
  cidade_destino text,
  valor_frete_carreteiro numeric(12,2),
  primeira_ligacao time without time zone,
  segunda_ligacao time without time zone,
  terceira_ligacao time without time zone,
  status text not null default 'Aguardando',
  responsavel_id uuid references auth.users(id) on delete set null,
  responsavel_email text,
  ocorrido text,
  finalizado_por text,
  finalizado_em timestamp with time zone,
  cancelado_por text,
  cancelado_em timestamp with time zone,
  carregado_outro_local_por text,
  carregado_outro_local_em timestamp with time zone,
  carregado_outro_local_motivo text,
  carregado_outro_local_local text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint placas_status_check check (
    status in (
      'Aguardando',
      '1ª ligação feita',
      '2ª ligação feita',
      '3ª ligação feita',
      'Não atendeu',
      'Chamado',
      'Chegou',
      'Carregando',
      'Finalizado',
      'Cancelado',
      'Carregado em outro local'
    )
  )
);

create index if not exists placas_ordem_idx on public.placas (ordem);
create index if not exists placas_status_idx on public.placas (status);
create index if not exists placas_data_idx on public.placas (data);
create index if not exists placas_responsavel_id_idx on public.placas (responsavel_id);
create index if not exists placas_responsavel_email_idx on public.placas (responsavel_email);

alter table public.placas add column if not exists tipo_carroceria text default 'BAU';
alter table public.placas add column if not exists carroceria text;
alter table public.placas add column if not exists carregado_outro_local_por text;
alter table public.placas add column if not exists carregado_outro_local_em timestamp with time zone;
alter table public.placas add column if not exists carregado_outro_local_motivo text;
alter table public.placas add column if not exists carregado_outro_local_local text;
update public.placas set tipo_carroceria = 'BAU' where tipo_carroceria is null;
update public.placas
set carroceria = case
  when upper(coalesce(tipo_carroceria, carroceria, 'BAU')) in ('SIDER', 'SYDER') then 'Sider'
  else 'Baú'
end
where carroceria is null;

alter table public.placas drop constraint if exists placas_status_check;
alter table public.placas
add constraint placas_status_check check (
  status in (
    'Aguardando',
    '1ª ligação feita',
    '2ª ligação feita',
    '3ª ligação feita',
    'Não atendeu',
    'Chamado',
    'Chegou',
    'Carregando',
    'Finalizado',
    'Cancelado',
    'Carregado em outro local'
  )
);

create or replace function public.set_placas_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists placas_updated_at on public.placas;
create trigger placas_updated_at
before update on public.placas
for each row
execute function public.set_placas_updated_at();

alter table public.placas enable row level security;

drop policy if exists "Usuarios autenticados podem ler placas" on public.placas;
create policy "Usuarios autenticados podem ler placas"
on public.placas for select
to authenticated
using (true);

drop policy if exists "Usuarios autenticados podem inserir placas" on public.placas;
create policy "Usuarios autenticados podem inserir placas"
on public.placas for insert
to authenticated
with check (auth.uid() = responsavel_id);

drop policy if exists "Usuarios autenticados podem atualizar placas" on public.placas;
create policy "Usuarios autenticados podem atualizar placas"
on public.placas for update
to authenticated
using (true)
with check (true);

drop policy if exists "Usuarios autenticados podem remover placas" on public.placas;
create policy "Usuarios autenticados podem remover placas"
on public.placas for delete
to authenticated
using (true);

create table if not exists public.placas_auditoria (
  id uuid primary key default gen_random_uuid(),
  placa_id uuid references public.placas(id) on delete cascade,
  acao text not null,
  status_anterior text,
  status_novo text,
  ordem_anterior integer,
  ordem_nova integer,
  alterado_por text,
  alterado_por_id uuid references auth.users(id) on delete set null,
  detalhes text,
  created_at timestamp with time zone default now()
);

create index if not exists placas_auditoria_placa_id_idx on public.placas_auditoria (placa_id);
create index if not exists placas_auditoria_created_at_idx on public.placas_auditoria (created_at);

alter table public.placas_auditoria enable row level security;

drop policy if exists "Usuarios autenticados podem inserir auditoria" on public.placas_auditoria;
create policy "Usuarios autenticados podem inserir auditoria"
on public.placas_auditoria for insert
to authenticated
with check (auth.uid() = alterado_por_id);

drop policy if exists "Gerencia pode visualizar auditoria" on public.placas_auditoria;
create policy "Gerencia pode visualizar auditoria"
on public.placas_auditoria for select
to authenticated
using (
  auth.jwt() ->> 'email' in (
    'gerencia.ce@grupodago.com.br',
    'operacional3.ce@grupodago.com.br'
  )
);

create table if not exists public.veiculos_motoristas (
  id uuid primary key default gen_random_uuid(),
  tipo_veiculo text,
  tipo_carroceria text,
  carroceria text,
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
alter table public.veiculos_motoristas add column if not exists tipo_carroceria text;
alter table public.veiculos_motoristas add column if not exists carroceria text;
update public.veiculos_motoristas set tipo_carroceria = 'BAU' where tipo_carroceria is null;
update public.veiculos_motoristas
set carroceria = case
  when upper(coalesce(tipo_carroceria, carroceria, 'BAU')) in ('SIDER', 'SYDER') then 'Sider'
  else 'Baú'
end
where carroceria is null;

create or replace function public.sync_carroceria_from_tipo()
returns trigger
language plpgsql
as $$
begin
  new.carroceria := case
    when upper(coalesce(new.tipo_carroceria, new.carroceria, 'BAU')) in ('SIDER', 'SYDER') then 'Sider'
    else 'Baú'
  end;
  return new;
end;
$$;

drop trigger if exists placas_sync_carroceria_before_write on public.placas;
create trigger placas_sync_carroceria_before_write
before insert or update of tipo_carroceria, carroceria on public.placas
for each row
execute function public.sync_carroceria_from_tipo();

drop trigger if exists veiculos_motoristas_sync_carroceria_before_write on public.veiculos_motoristas;
create trigger veiculos_motoristas_sync_carroceria_before_write
before insert or update of tipo_carroceria, carroceria on public.veiculos_motoristas
for each row
execute function public.sync_carroceria_from_tipo();

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

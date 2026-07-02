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

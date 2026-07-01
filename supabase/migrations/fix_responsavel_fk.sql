alter table public.placas add column if not exists responsavel_id uuid;
alter table public.placas add column if not exists responsavel_email text;

create index if not exists placas_responsavel_id_idx on public.placas (responsavel_id);
create index if not exists placas_responsavel_email_idx on public.placas (responsavel_email);

do $$
declare
  responsavel_type text;
begin
  select data_type
  into responsavel_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'placas'
    and column_name = 'responsavel';

  if responsavel_type = 'uuid' then
    execute '
      update public.placas
      set responsavel_id = responsavel
      where responsavel_id is null
        and responsavel is not null
    ';
  elsif responsavel_type is not null then
    execute '
      update public.placas
      set responsavel_email = responsavel::text
      where responsavel_email is null
        and responsavel is not null
        and responsavel::text like ''%@%''
    ';

    execute '
      update public.placas
      set responsavel_id = responsavel::uuid
      where responsavel_id is null
        and responsavel is not null
        and responsavel::text ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$''
    ';
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'placas'
      and column_name = 'responsavel'
  ) then
    alter table public.placas alter column responsavel drop not null;
  end if;
end $$;

update public.placas p
set responsavel_email = u.email
from auth.users u
where p.responsavel_email is null
  and p.responsavel_id = u.id;

alter table public.placas drop constraint if exists placas_responsavel_fkey;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'placas_responsavel_id_fkey'
      and conrelid = 'public.placas'::regclass
  ) then
    alter table public.placas
      add constraint placas_responsavel_id_fkey
      foreign key (responsavel_id)
      references auth.users(id)
      on delete set null;
  end if;
end $$;

drop policy if exists "Usuarios autenticados podem inserir placas" on public.placas;
create policy "Usuarios autenticados podem inserir placas"
on public.placas for insert
to authenticated
with check (auth.uid() = responsavel_id);

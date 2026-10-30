-- Nao apaga nem altera duplicidades existentes.
-- Bloqueia novas duplicidades por placa, cavalo e carreta, inclusive concorrentes.
create or replace function public.check_active_plate_duplicates()
returns trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  plate_key text;
  plate_keys text[];
  old_keys text[];
begin
  if lower(btrim(coalesce(new.status, ''))) in ('finalizado', 'cancelado', 'carregado em outro local') then
    return new;
  end if;

  plate_keys := array[
    regexp_replace(upper(coalesce(new.placa, '')), '[^A-Z0-9]', '', 'g'),
    regexp_replace(upper(coalesce(new.placa_cavalo, '')), '[^A-Z0-9]', '', 'g'),
    regexp_replace(upper(coalesce(new.placa_carreta, '')), '[^A-Z0-9]', '', 'g')
  ];

  if tg_op = 'UPDATE' then
    old_keys := array[
      regexp_replace(upper(coalesce(old.placa, '')), '[^A-Z0-9]', '', 'g'),
      regexp_replace(upper(coalesce(old.placa_cavalo, '')), '[^A-Z0-9]', '', 'g'),
      regexp_replace(upper(coalesce(old.placa_carreta, '')), '[^A-Z0-9]', '', 'g')
    ];
    -- Permite operar/cancelar registros duplicados antigos sem prende-los na fila.
    if old_keys = plate_keys and lower(btrim(coalesce(old.status, ''))) not in
      ('finalizado', 'cancelado', 'carregado em outro local') then
      return new;
    end if;
  end if;

  -- Ordem deterministica evita deadlock ao conferir cavalo/carreta cruzados.
  for plate_key in select distinct k from unnest(plate_keys) as k where k <> '' order by k loop
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('placas-ativa:' || plate_key, 0));
  end loop;

  if exists (
    select 1 from public.placas p
    where p.id is distinct from new.id
      and lower(btrim(coalesce(p.status, ''))) not in ('finalizado', 'cancelado', 'carregado em outro local')
      and exists (
        select 1 from unnest(plate_keys) k
        where k <> '' and k in (
          regexp_replace(upper(coalesce(p.placa, '')), '[^A-Z0-9]', '', 'g'),
          regexp_replace(upper(coalesce(p.placa_cavalo, '')), '[^A-Z0-9]', '', 'g'),
          regexp_replace(upper(coalesce(p.placa_carreta, '')), '[^A-Z0-9]', '', 'g')
        )
      )
  ) then
    raise exception using errcode = '23505', message = 'Essa placa já está cadastrada na fila.';
  end if;
  return new;
end;
$$;

revoke all on function public.check_active_plate_duplicates() from public;
drop trigger if exists placas_block_duplicate_active on public.placas;
create trigger placas_block_duplicate_active
before insert or update of placa, placa_cavalo, placa_carreta, status
on public.placas for each row execute function public.check_active_plate_duplicates();

-- Necessario para receber alteracoes do cadastro em outros computadores.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication p
       where p.pubname = 'supabase_realtime' and p.puballtables
     )
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public' and tablename = 'veiculos_motoristas'
     ) then
    alter publication supabase_realtime add table public.veiculos_motoristas;
  end if;
end $$;

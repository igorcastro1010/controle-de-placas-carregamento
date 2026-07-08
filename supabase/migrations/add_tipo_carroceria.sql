alter table public.placas add column if not exists tipo_carroceria text default 'BAU';
alter table public.veiculos_motoristas add column if not exists tipo_carroceria text;

update public.placas set tipo_carroceria = 'BAU' where tipo_carroceria is null;
update public.veiculos_motoristas set tipo_carroceria = 'BAU' where tipo_carroceria is null;

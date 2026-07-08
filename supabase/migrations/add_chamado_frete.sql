alter table public.placas add column if not exists cidade_destino text;
alter table public.placas add column if not exists valor_frete_carreteiro numeric(12,2);

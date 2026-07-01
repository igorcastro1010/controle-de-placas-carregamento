alter table placas add column if not exists finalizado_por text;
alter table placas add column if not exists finalizado_em timestamp with time zone;
alter table placas add column if not exists cancelado_por text;
alter table placas add column if not exists cancelado_em timestamp with time zone;

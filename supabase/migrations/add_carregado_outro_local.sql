alter table public.placas add column if not exists carregado_outro_local_por text;
alter table public.placas add column if not exists carregado_outro_local_em timestamp with time zone;
alter table public.placas add column if not exists carregado_outro_local_motivo text;
alter table public.placas add column if not exists carregado_outro_local_local text;

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

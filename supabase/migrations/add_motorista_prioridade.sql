-- Classificacao por parceria antiga; nao altera prioridade_local nem ordem.
alter table public.placas
  add column if not exists motorista_prioridade boolean not null default false;

notify pgrst, 'reload schema';

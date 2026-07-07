ALTER TABLE public.placas
ADD COLUMN IF NOT EXISTS entrega_local boolean DEFAULT false;

ALTER TABLE public.placas
ADD COLUMN IF NOT EXISTS retorno_local boolean DEFAULT false;

ALTER TABLE public.placas
ADD COLUMN IF NOT EXISTS prioridade_local boolean DEFAULT false;

ALTER TABLE public.placas
ADD COLUMN IF NOT EXISTS prioridade_motivo text;

ALTER TABLE public.placas
ADD COLUMN IF NOT EXISTS prioridade_por text;

ALTER TABLE public.placas
ADD COLUMN IF NOT EXISTS prioridade_em timestamp with time zone;

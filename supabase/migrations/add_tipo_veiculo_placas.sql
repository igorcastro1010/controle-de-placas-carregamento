ALTER TABLE public.placas ADD COLUMN IF NOT EXISTS tipo_veiculo text DEFAULT 'Truck';
ALTER TABLE public.placas ADD COLUMN IF NOT EXISTS placa_cavalo text;
ALTER TABLE public.placas ADD COLUMN IF NOT EXISTS placa_carreta text;

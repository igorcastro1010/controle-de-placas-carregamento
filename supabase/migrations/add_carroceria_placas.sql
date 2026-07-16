ALTER TABLE public.placas
ADD COLUMN IF NOT EXISTS carroceria text;

ALTER TABLE public.veiculos_motoristas
ADD COLUMN IF NOT EXISTS carroceria text;

UPDATE public.placas
SET carroceria = CASE
  WHEN upper(coalesce(tipo_carroceria, carroceria, 'BAU')) IN ('SIDER', 'SYDER') THEN 'Sider'
  ELSE 'Baú'
END
WHERE carroceria IS NULL;

UPDATE public.veiculos_motoristas
SET carroceria = CASE
  WHEN upper(coalesce(tipo_carroceria, carroceria, 'BAU')) IN ('SIDER', 'SYDER') THEN 'Sider'
  ELSE 'Baú'
END
WHERE carroceria IS NULL;

CREATE OR REPLACE FUNCTION public.sync_carroceria_from_tipo()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.carroceria := CASE
    WHEN upper(coalesce(NEW.tipo_carroceria, NEW.carroceria, 'BAU')) IN ('SIDER', 'SYDER') THEN 'Sider'
    ELSE 'Baú'
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS placas_sync_carroceria_before_write ON public.placas;
CREATE TRIGGER placas_sync_carroceria_before_write
BEFORE INSERT OR UPDATE OF tipo_carroceria, carroceria ON public.placas
FOR EACH ROW
EXECUTE FUNCTION public.sync_carroceria_from_tipo();

DROP TRIGGER IF EXISTS veiculos_motoristas_sync_carroceria_before_write ON public.veiculos_motoristas;
CREATE TRIGGER veiculos_motoristas_sync_carroceria_before_write
BEFORE INSERT OR UPDATE OF tipo_carroceria, carroceria ON public.veiculos_motoristas
FOR EACH ROW
EXECUTE FUNCTION public.sync_carroceria_from_tipo();

-- Agrega configuración del banner superior (sitewide, encima del navbar)
-- al singleton site_settings.
--
-- Campos:
--   banner_image_url   : URL de la creatividad (recomendado 950×75)
--   banner_link_url    : URL destino al hacer clic (opcional)
--   banner_alt_text    : Alt text para accesibilidad
--   is_banner_active   : Si está activo o no
--
-- Idempotente: usa ADD COLUMN IF NOT EXISTS.

BEGIN;

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS banner_image_url TEXT,
  ADD COLUMN IF NOT EXISTS banner_link_url  TEXT,
  ADD COLUMN IF NOT EXISTS banner_alt_text  TEXT,
  ADD COLUMN IF NOT EXISTS is_banner_active BOOLEAN NOT NULL DEFAULT FALSE;

COMMIT;

-- Verificación
DO $$
DECLARE
  col_count INT;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'site_settings'
    AND column_name IN ('banner_image_url', 'banner_link_url', 'banner_alt_text', 'is_banner_active');

  RAISE NOTICE 'Columnas banner agregadas: % de 4', col_count;
END $$;

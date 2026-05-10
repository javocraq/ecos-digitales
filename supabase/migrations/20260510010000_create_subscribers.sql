-- ============================================================
-- Migration: subscribers + email_events
-- Sistema de newsletter con doble opt-in para Ecos Digitales.
-- Diseñado para Resend como proveedor de email transaccional.
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────
-- 1. Tabla: subscribers
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'unsubscribed', 'bounced', 'complained')),

  -- Doble opt-in
  confirmation_token UUID DEFAULT gen_random_uuid(),
  confirmed_at TIMESTAMPTZ,

  -- Unsubscribe
  unsubscribe_token UUID DEFAULT gen_random_uuid(),
  unsubscribed_at TIMESTAMPTZ,
  unsubscribe_reason TEXT,

  -- Attribution
  source TEXT,           -- 'footer', 'prensa', 'manual', etc.
  referrer_url TEXT,
  ip_address INET,

  -- Engagement tracking (actualizado vía webhooks de Resend)
  last_email_sent_at TIMESTAMPTZ,
  last_email_opened_at TIMESTAMPTZ,
  total_emails_sent INTEGER DEFAULT 0,
  total_emails_opened INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_subscribers_status
  ON public.subscribers(status);
CREATE INDEX IF NOT EXISTS idx_subscribers_confirmation_token
  ON public.subscribers(confirmation_token);
CREATE INDEX IF NOT EXISTS idx_subscribers_unsubscribe_token
  ON public.subscribers(unsubscribe_token);
CREATE INDEX IF NOT EXISTS idx_subscribers_created_at
  ON public.subscribers(created_at DESC);

-- Trigger updated_at (function ya existe en create_site_settings migration)
DROP TRIGGER IF EXISTS trg_subscribers_updated_at ON public.subscribers;
CREATE TRIGGER trg_subscribers_updated_at
  BEFORE UPDATE ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ────────────────────────────────────────────────────────────
-- 2. RLS para subscribers
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public subscribe" ON public.subscribers;
CREATE POLICY "Allow public subscribe" ON public.subscribers
  FOR INSERT TO anon
  WITH CHECK (status = 'pending');

-- Solo service_role puede SELECT/UPDATE/DELETE (policies default = deny)

-- ────────────────────────────────────────────────────────────
-- 3. Vista: suscriptores activos (para queries de envío)
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.v_active_subscribers AS
SELECT id, email, source, created_at, confirmed_at,
       total_emails_sent, total_emails_opened
FROM public.subscribers
WHERE status = 'confirmed';

-- ────────────────────────────────────────────────────────────
-- 4. Tabla: email_events (tracking de Resend webhooks)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES public.subscribers(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed')),
  resend_email_id TEXT,
  campaign_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_events_subscriber
  ON public.email_events(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_email_events_type
  ON public.email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_created
  ON public.email_events(created_at DESC);

ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
-- Solo service_role accede (policies default = deny para anon/authenticated)

COMMIT;

-- ────────────────────────────────────────────────────────────
-- Verificación
-- ────────────────────────────────────────────────────────────

DO $$
DECLARE
  sub_count INTEGER;
  evt_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO sub_count FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'subscribers';
  SELECT COUNT(*) INTO evt_count FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'email_events';

  RAISE NOTICE '✓ subscribers table: % (1 = ok)', sub_count;
  RAISE NOTICE '✓ email_events table: % (1 = ok)', evt_count;
END $$;

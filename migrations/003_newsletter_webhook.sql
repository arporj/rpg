-- Módulo de Webhook para Newsletter
-- Este script configura o gatilho que dispara a Edge Function quando uma sessão é publicada.

-- 1. Garante que a extensão de rede HTTP está disponível
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";

-- 2. Função que realiza a chamada HTTP para a Edge Function
CREATE OR REPLACE FUNCTION public.handle_session_publish_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Disparar apenas se a sessão mudou de rascunho para publicado
  IF (NEW.is_published = true AND (OLD.is_published = false OR OLD.is_published IS NULL)) THEN
    PERFORM
      extensions.http_post(
        'https://utgwqhorbbsmhgilyaub.supabase.co/functions/v1/send-new-session-email',
        jsonb_build_object(
          'type', 'UPDATE',
          'table', 'sessions',
          'record', row_to_json(NEW),
          'old_record', row_to_json(OLD)
        )::text,
        'application/json',
        jsonb_build_object(
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0Z3dxaG9yYmJzbWhnaWx5YXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NjU3MDMsImV4cCI6MjA5MTE0MTcwM30.Tmbf5GkndZ6uuT1w5byxHl9u5zLFzHjLAKtiDA1E_3U',
          'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0Z3dxaG9yYmJzbWhnaWx5YXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NjU3MDMsImV4cCI6MjA5MTE0MTcwM30.Tmbf5GkndZ6uuT1w5byxHl9u5zLFzHjLAKtiDA1E_3U'
        )::text
      );
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Criação do Gatilho (Trigger) na tabela sessions
DROP TRIGGER IF EXISTS on_session_published ON public.sessions;
CREATE TRIGGER on_session_published
  AFTER UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_session_publish_webhook();

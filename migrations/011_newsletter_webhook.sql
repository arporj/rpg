-- Migration: 011_newsletter_webhook
-- Configura o webhook automático para disparar a Edge Function quando uma sessão for publicada.
-- Utiliza uma estratégia dinâmica para ler os headers HTTP de autorização ou usar o fallback correto.

-- 1. Garante que a extensão de rede HTTP está disponível
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";

-- 2. Função que realiza a chamada HTTP para a Edge Function
CREATE OR REPLACE FUNCTION rpg.handle_session_publish_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = rpg, public
AS $$
DECLARE
  v_headers jsonb;
  v_auth_header text;
  v_apikey_header text;
BEGIN
  -- Tentar pegar os cabeçalhos HTTP da requisição ativa (PostgREST)
  v_headers := COALESCE(current_setting('request.headers', true)::jsonb, '{}'::jsonb);
  v_auth_header := v_headers ->> 'authorization';
  v_apikey_header := v_headers ->> 'apikey';

  -- Fallbacks seguros usando a chave anon íntegra do .env
  IF v_auth_header IS NULL THEN
    v_auth_header := 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHdlenRpbHNveHhjZ3VkdHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMzI2NzcsImV4cCI6MjA1OTcwODY3N30.IJY1Ol_xmL7Y-GJMqjuCCglDq9H-K4RhxxZK0pqKDMo';
  END IF;

  IF v_apikey_header IS NULL THEN
    v_apikey_header := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHdlenRpbHNveHhjZ3VkdHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMzI2NzcsImV4cCI6MjA1OTcwODY3N30.IJY1Ol_xmL7Y-GJMqjuCCglDq9H-K4RhxxZK0pqKDMo';
  END IF;

  -- Disparar apenas se a sessão mudou de rascunho para publicado
  IF (NEW.is_published = true AND (OLD.is_published = false OR OLD.is_published IS NULL)) THEN
    PERFORM
      extensions.http((
        'POST',
        'https://kwdweztilsoxxcgudtsz.supabase.co/functions/v1/send-new-session-email',
        ARRAY[
          extensions.http_header('Authorization', v_auth_header),
          extensions.http_header('apikey', v_apikey_header)
        ],
        'application/json',
        jsonb_build_object(
          'type', 'UPDATE',
          'table', 'sessions',
          'record', row_to_json(NEW),
          'old_record', row_to_json(OLD)
        )::text
      )::extensions.http_request);
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Criação do Gatilho (Trigger) na tabela sessions
DROP TRIGGER IF EXISTS on_session_published ON rpg.sessions;
CREATE TRIGGER on_session_published
  AFTER UPDATE ON rpg.sessions
  FOR EACH ROW
  EXECUTE FUNCTION rpg.handle_session_publish_webhook();

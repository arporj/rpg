-- Módulo de Webhook para Newsletter (Corrigido)
-- Este script configura o gatilho que dispara a Edge Function quando uma sessão é publicada.

-- 1. Garante que a extensão de rede HTTP está disponível
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";

-- 2. Função que realiza a chamada HTTP para a Edge Function
CREATE OR REPLACE FUNCTION rpg.handle_session_publish_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = rpg, public
AS $$
BEGIN
  -- Disparar apenas se a sessão mudou de rascunho para publicado
  IF (NEW.is_published = true AND (OLD.is_published = false OR OLD.is_published IS NULL)) THEN
    PERFORM
      extensions.http((
        'POST',
        'https://kwdweztilsoxxcgudtsz.supabase.co/functions/v1/send-new-session-email',
        ARRAY[
          extensions.http_header('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHdlenRpbHNveHhjZ3VkdHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMzI2NzcsImV4cCI6MjA5OTcwODY3N30.IJY1Ol_xmL7Y-GJMqjuCCglDq9H-K4RhxxZK0pqKDMo'),
          extensions.http_header('apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHdlenRpbHNveHhjZ3VkdHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMzI2NzcsImV4cCI6MjA5OTcwODY3N30.IJY1Ol_xmL7Y-GJMqjuCCglDq9H-K4RhxxZK0pqKDMo')
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

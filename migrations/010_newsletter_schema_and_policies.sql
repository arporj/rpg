-- Migration: 010_newsletter_schema_and_policies
-- Configura RLS, políticas de acesso, e funções para o módulo de newsletter no esquema rpg.

-- 1. Habilitar RLS em ambas as tabelas (já presentes no esquema rpg)
ALTER TABLE rpg.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpg.newsletter_chronicle_subscriptions ENABLE ROW LEVEL SECURITY;

-- 2. Limpar políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir tudo para usuários autenticados" ON rpg.newsletter_subscribers;
DROP POLICY IF EXISTS "Permitir inserção pública para anonimos" ON rpg.newsletter_subscribers;
DROP POLICY IF EXISTS "Permitir tudo para usuários autenticados" ON rpg.newsletter_chronicle_subscriptions;
DROP POLICY IF EXISTS "Permitir inserção pública para anonimos" ON rpg.newsletter_chronicle_subscriptions;

-- 3. Criar políticas para a tabela newsletter_subscribers
-- Acesso total (visualizar, editar, deletar) para o administrador autenticado
CREATE POLICY "Permitir tudo para usuários autenticados" 
  ON rpg.newsletter_subscribers 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Permissão apenas para inserção por usuários anônimos (ou autenticados) para novos cadastros
CREATE POLICY "Permitir inserção pública para anonimos" 
  ON rpg.newsletter_subscribers 
  FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

-- 4. Criar políticas para a tabela newsletter_chronicle_subscriptions
-- Acesso total para o administrador autenticado
CREATE POLICY "Permitir tudo para usuários autenticados" 
  ON rpg.newsletter_chronicle_subscriptions 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Permissão de inserção para vincular usuários às crônicas seguidas
CREATE POLICY "Permitir inserção pública para anonimos" 
  ON rpg.newsletter_chronicle_subscriptions 
  FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

-- 5. Recriar a função de inscrição no esquema rpg (substituindo qualquer versão antiga)
CREATE OR REPLACE FUNCTION rpg.subscribe_to_newsletter(
  p_email text,
  p_chronicle_id uuid DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_sub_id uuid;
BEGIN
  -- Insere ou atualiza o assinante
  INSERT INTO rpg.newsletter_subscribers (email, subscribe_all, created_at)
  VALUES (p_email, CASE WHEN p_chronicle_id IS NULL THEN true ELSE false END, now())
  ON CONFLICT (email) DO UPDATE 
  SET subscribe_all = CASE 
                        WHEN p_chronicle_id IS NULL THEN true 
                        ELSE rpg.newsletter_subscribers.subscribe_all 
                      END
  RETURNING id INTO v_sub_id;

  -- Insere a vinculação com a crônica se fornecida
  IF p_chronicle_id IS NOT NULL THEN
    INSERT INTO rpg.newsletter_chronicle_subscriptions (subscriber_id, chronicle_id, created_at)
    VALUES (v_sub_id, p_chronicle_id, now())
    ON CONFLICT (subscriber_id, chronicle_id) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Criar a RPC de envio manual individual de e-mails
CREATE OR REPLACE FUNCTION rpg.manual_send_session_email(
  p_email text,
  p_session_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_response extensions.http_response;
  v_payload jsonb;
BEGIN
  -- Construir o payload do disparo manual
  v_payload := jsonb_build_object(
    'type', 'MANUAL',
    'email', p_email,
    'session_id', p_session_id
  );

  -- Fazer a chamada HTTP para a Edge Function de envio de e-mails
  SELECT * INTO v_response FROM extensions.http((
    'POST',
    'https://kwdweztilsoxxcgudtsz.supabase.co/functions/v1/send-new-session-email',
    ARRAY[
      extensions.http_header('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHdlenRpbHNveHhjZ3VkdHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMzI2NzcsImV4cCI6MjA5OTcwODY3N30.IJY1Ol_xmL7Y-GJMqjuCCglDq9H-K4RhxxZK0pqKDMo'),
      extensions.http_header('apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHdlenRpbHNveHhjZ3VkdHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMzI2NzcsImV4cCI6MjA5OTcwODY3N30.IJY1Ol_xmL7Y-GJMqjuCCglDq9H-K4RhxxZK0pqKDMo')
    ],
    'application/json',
    v_payload::text
  )::extensions.http_request);

  -- Tratar a resposta da chamada HTTP
  IF v_response.status = 200 THEN
    RETURN jsonb_build_object('success', true, 'data', v_response.content::jsonb);
  ELSE
    RETURN jsonb_build_object('success', false, 'error', v_response.content);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

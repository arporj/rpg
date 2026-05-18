-- Migração 006: Cria políticas RLS de segurança para o bucket de armazenamento "media"
-- Isso permite o upload, atualização e exclusão de ilustrações pelos administradores (autenticados)
-- e a visualização pública por todos os jogadores.

-- 1. Permitir leitura pública dos objetos no bucket "media"
CREATE POLICY "Permitir leitura pública no bucket media"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- 2. Permitir inserção de objetos por usuários autenticados no bucket "media"
CREATE POLICY "Permitir inserção para usuários autenticados no bucket media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- 3. Permitir atualização de objetos por usuários autenticados no bucket "media"
CREATE POLICY "Permitir atualização para usuários autenticados no bucket media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'media');

-- 4. Permitir exclusão de objetos por usuários autenticados no bucket "media"
CREATE POLICY "Permitir exclusão para usuários autenticados no bucket media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media');

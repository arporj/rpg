# Comandos de Banco de Dados - Cronicas do Codice RPG

Este documento reúne todas as migrações e comandos SQL necessários para organizar e configurar o seu banco de dados de produção do Supabase.

Acesse o painel do seu **Supabase de Produção**, vá no menu **SQL Editor**, crie uma **New Query**, copie os blocos de comandos abaixo e execute-os.

---

## 🟢 PASSO 1: Criar Políticas de Acesso do Bucket de Storage (Migração 006)

Este bloco de comandos habilita as políticas RLS para o bucket de armazenamento de mídia chamado `media` no Supabase Storage. Ele permite leitura pública por qualquer jogador e controle total (inserção, atualização e deleção) apenas para você que está autenticado como administrador:

```sql
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
```

---

## 🟢 PASSO 2: Habilitar e Configurar RLS nas Tabelas do Banco (Migração 007)

Este bloco de comandos ativa a segurança de Row Level Security (RLS) em todas as tabelas principais do esquema `rpg`. Ele garante que todos os jogadores (anônimos e autenticados) consigam carregar e ver as crônicas, sessões e capítulos normalmente, mas que apenas você (autenticado) consiga criar, editar ou deletar as informações pelo painel de controle administrativo:

```sql
-- 1. Habilitar RLS em todas as tabelas principais
ALTER TABLE rpg.chronicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpg.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpg.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpg.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpg.systems ENABLE ROW LEVEL SECURITY;

-- 2. Limpar políticas antigas equivalentes para evitar conflitos de nomenclatura
DROP POLICY IF EXISTS "Permitir leitura pública de chronicles" ON rpg.chronicles;
DROP POLICY IF EXISTS "Permitir gerenciamento total de chronicles para autenticados" ON rpg.chronicles;

DROP POLICY IF EXISTS "Permitir leitura pública de sessions" ON rpg.sessions;
DROP POLICY IF EXISTS "Permitir gerenciamento total de sessions para autenticados" ON rpg.sessions;

DROP POLICY IF EXISTS "Permitir leitura pública de chapters" ON rpg.chapters;
DROP POLICY IF EXISTS "Permitir gerenciamento total de chapters para autenticados" ON rpg.chapters;

DROP POLICY IF EXISTS "Permitir leitura pública de players" ON rpg.players;
DROP POLICY IF EXISTS "Permitir gerenciamento total de players para autenticados" ON rpg.players;

DROP POLICY IF EXISTS "Permitir leitura pública de systems" ON rpg.systems;

-- 3. Definir políticas para rpg.chronicles
CREATE POLICY "Permitir leitura pública de chronicles"
ON rpg.chronicles FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Permitir gerenciamento total de chronicles para autenticados"
ON rpg.chronicles FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Definir políticas para rpg.sessions
CREATE POLICY "Permitir leitura pública de sessions"
ON rpg.sessions FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Permitir gerenciamento total de sessions para autenticados"
ON rpg.sessions FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. Definir políticas para rpg.chapters
CREATE POLICY "Permitir leitura pública de chapters"
ON rpg.chapters FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Permitir gerenciamento total de chapters para autenticados"
ON rpg.chapters FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 6. Definir políticas para rpg.players
CREATE POLICY "Permitir leitura pública de players"
ON rpg.players FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Permitir gerenciamento total de players para autenticados"
ON rpg.players FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 7. Definir políticas para rpg.systems (Somente leitura para todos por enquanto)
CREATE POLICY "Permitir leitura pública de systems"
ON rpg.systems FOR SELECT
TO anon, authenticated
USING (true);
```

---

## 🟢 PASSO 3: Atualizar URLs de Capítulos para o Formato Estruturado (Migração 008)

Este bloco de comandos atualiza as ilustrações do "dia001" antigas para usarem o caminho de pastas completo do storage (`codex/dia001/...`). Desta forma, o frontend de produção consegue encontrar e carregar as imagens perfeitamente:

```sql
-- Atualiza as URLs das ilustrações de capítulos da Sessão 1 para usar os caminhos completos estruturados no Supabase Storage.
UPDATE rpg.chapters
SET image_url = 'codex/dia001/cap001_tempestade.png'
WHERE image_url = '/assets/illustrations/cap1_tempestade.png' OR image_url = 'dia001_cap001_tempestade.png';

UPDATE rpg.chapters
SET image_url = 'codex/dia001/cap002_morte.png'
WHERE image_url = '/assets/illustrations/cap2_morte.png' OR image_url = 'dia001_cap002_morte.png';

UPDATE rpg.chapters
SET image_url = 'codex/dia001/cap003_despertar.png'
WHERE image_url = '/assets/illustrations/cap3_despertar.png' OR image_url = 'dia001_cap003_despertar.png';

UPDATE rpg.chapters
SET image_url = 'codex/dia001/cap004_naga.png'
WHERE image_url = '/assets/illustrations/cap4_naga.png' OR image_url = 'dia001_cap004_naga.png';

UPDATE rpg.chapters
SET image_url = 'codex/dia001/cap005_pedra_oculta.png'
WHERE image_url = '/assets/illustrations/cap5_pedra_oculta.png' OR image_url = 'dia001_cap005_pedra_oculta.png';

UPDATE rpg.chapters
SET image_url = 'codex/dia001/cap006_mimico.png'
WHERE image_url = '/assets/illustrations/cap6_mimico.png' OR image_url = 'dia001_cap006_mimico.png';

UPDATE rpg.chapters
SET image_url = 'codex/dia001/cap007_amuleto.png'
WHERE image_url = '/assets/illustrations/cap7_amuleto.png' OR image_url = 'dia001_cap007_amuleto.png';

UPDATE rpg.chapters
SET image_url = 'codex/dia001/cap008_golem.png'
WHERE image_url = '/assets/illustrations/cap8_golem.png' OR image_url = 'dia001_cap008_golem.png';

UPDATE rpg.chapters
SET image_url = 'codex/dia001/cap009_mosca.png'
WHERE image_url = '/assets/illustrations/cap9_mosca.png' OR image_url = 'dia001_cap009_mosca.png';

UPDATE rpg.chapters
SET image_url = 'codex/dia001/cap010_rei.png'
WHERE image_url = '/assets/illustrations/cap10_rei.png' OR image_url = 'dia001_cap010_rei.png';

UPDATE rpg.chapters
SET image_url = 'codex/dia001/cap011_planicie.png'
WHERE image_url = '/assets/illustrations/cap11_planicie.png' OR image_url = 'dia001_cap011_planicie.png';
```

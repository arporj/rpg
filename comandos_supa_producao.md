# Instruções e Comandos SQL do Supabase - Produção

Este guia reúne todas as migrações e comandos SQL necessários para organizar e configurar as tabelas e o storage no seu painel do **Supabase de Produção** para o perfeito funcionamento de upload de imagens.

Acesse o painel do seu **Supabase de Produção**, vá no menu **SQL Editor**, crie uma **New Query**, copie os blocos de comandos abaixo e execute-os.

---

## 🟢 PASSO 1: Criar o Bucket "media" e Configurar Leitura Pública

Execute o comando abaixo para garantir que o bucket de armazenamento chamado `media` existe e está configurado para acesso público de leitura:

```sql
-- Garante a criação do bucket "media" se ele não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;
```

---

## 🟢 PASSO 2: Habilitar Políticas de RLS para o Bucket "media" (Storage)

Este bloco de comandos limpa e recria as políticas de Row Level Security (RLS) para o bucket de armazenamento `media`. Ele permite que qualquer visitante (público) visualize as imagens e que usuários autenticados (administradores) possam inserir, atualizar e deletar fotos:

```sql
-- 1. Remover políticas antigas para evitar duplicidades
DROP POLICY IF EXISTS "Permitir leitura pública no bucket media" ON storage.objects;
DROP POLICY IF EXISTS "Permitir inserção para usuários autenticados no bucket media" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualização para usuários autenticados no bucket media" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão para usuários autenticados no bucket media" ON storage.objects;

-- 2. Permitir leitura pública dos objetos no bucket "media"
CREATE POLICY "Permitir leitura pública no bucket media"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- 3. Permitir inserção de objetos por usuários autenticados no bucket "media"
CREATE POLICY "Permitir inserção para usuários autenticados no bucket media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- 4. Permitir atualização de objetos por usuários autenticados no bucket "media"
CREATE POLICY "Permitir atualização para usuários autenticados no bucket media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'media');

-- 5. Permitir exclusão de objetos por usuários autenticados no bucket "media"
CREATE POLICY "Permitir exclusão para usuários autenticados no bucket media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media');
```

---

## 🟢 PASSO 3: Habilitar e Configurar RLS nas Tabelas do Banco de Dados

Este bloco ativa a segurança a nível de linha (RLS) nas tabelas principais do esquema `rpg`. Ele garante que todos os jogadores possam ler as crônicas, sessões e capítulos, mas que apenas administradores autenticados consigam gerenciar os dados:

```sql
-- 1. Habilitar RLS nas tabelas
ALTER TABLE rpg.chronicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpg.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpg.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpg.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpg.systems ENABLE ROW LEVEL SECURITY;

-- 2. Limpar políticas antigas equivalentes para evitar conflitos
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

-- 7. Definir políticas para rpg.systems (Leitura pública geral)
CREATE POLICY "Permitir leitura pública de systems"
ON rpg.systems FOR SELECT
TO anon, authenticated
USING (true);
```

---

## 🟢 PASSO 4: Sincronizar e Corrigir Nomes Físicos Antigos de Capítulos

Este script ajusta as URLs das ilustrações de capítulos antigos para apontarem para o caminho correto de pastas estruturadas no Supabase Storage:

```sql
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

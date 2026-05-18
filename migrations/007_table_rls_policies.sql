-- Migração 007: Estabelece políticas de Row Level Security (RLS) para as tabelas do esquema rpg.
-- Isso permite o gerenciamento completo (INSERT, UPDATE, DELETE) por administradores autenticados,
-- e leitura pública aberta (SELECT) para todos os jogadores anônimos e autenticados.

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

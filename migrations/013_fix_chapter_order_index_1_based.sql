-- Migração para ajustar a numeração dos capítulos para 1-based e sem lacunas
UPDATE rpg.chapters c1
SET order_index = (
  SELECT count(*)
  FROM rpg.chapters c2
  WHERE c2.session_id = c1.session_id AND c2.order_index <= c1.order_index
);

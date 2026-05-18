-- Migração 008: Atualiza as URLs das ilustrações de capítulos da Sessão 1 para usar os caminhos completos estruturados no Supabase Storage.
-- Isso permite que a função getStorageUrl no frontend resolva o caminho exato incluindo as subpastas organizadas.

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

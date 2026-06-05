-- Migration: 015_add_id_default_to_newsletter_subscribers
-- Define gen_random_uuid() como valor padrão para a coluna id na tabela newsletter_subscribers do esquema rpg.

ALTER TABLE rpg.newsletter_subscribers ALTER COLUMN id SET DEFAULT gen_random_uuid();

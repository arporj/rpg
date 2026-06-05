-- Migration: 014_add_unique_constraint_to_newsletter_subscribers
-- Adiciona restrição de unicidade ao e-mail na tabela newsletter_subscribers do esquema rpg para suportar a operação de UPSERT (ON CONFLICT) na RPC.

ALTER TABLE rpg.newsletter_subscribers ADD CONSTRAINT newsletter_subscribers_email_key UNIQUE (email);

-- Migration: 002_session_publishing

ALTER TABLE "public"."sessions" 
ADD COLUMN IF NOT EXISTS "is_published" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "session_date" date;

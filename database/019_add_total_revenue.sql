-- Migration: Add total_revenue column to events table
-- Created: 2026-04-17

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(12, 2) NOT NULL DEFAULT 0.00;

COMMENT ON COLUMN public.events.total_revenue IS 'Total money received from voters';

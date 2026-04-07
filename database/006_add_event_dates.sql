-- Migration: Add voting and nomination date fields to events table
-- Created: 2026-04-07

-- Add new columns for voting and nomination dates
ALTER TABLE events
ADD COLUMN IF NOT EXISTS nomination_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS nomination_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS voting_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS voting_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Update existing events to set dates based on created_at
UPDATE events
SET 
    nomination_start_date = created_at,
    nomination_end_date = created_at + INTERVAL '7 days',
    voting_start_date = created_at,
    voting_end_date = created_at + INTERVAL '7 days'
WHERE nomination_start_date IS NULL;

-- Create or replace the function to set default dates on insert
CREATE OR REPLACE FUNCTION set_default_event_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Set default dates to current date if not provided
    IF NEW.nomination_start_date IS NULL THEN
        NEW.nomination_start_date := NOW();
    END IF;
    
    IF NEW.nomination_end_date IS NULL THEN
        NEW.nomination_end_date := NOW() + INTERVAL '7 days';
    END IF;
    
    IF NEW.voting_start_date IS NULL THEN
        NEW.voting_start_date := NOW();
    END IF;
    
    IF NEW.voting_end_date IS NULL THEN
        NEW.voting_end_date := NOW() + INTERVAL '7 days';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to automatically set dates on insert
DROP TRIGGER IF EXISTS set_default_event_dates_trigger ON events;
CREATE TRIGGER set_default_event_dates_trigger
    BEFORE INSERT ON events
    FOR EACH ROW
    EXECUTE FUNCTION set_default_event_dates();

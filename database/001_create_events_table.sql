-- Migration: Create events table with approval workflow
-- Created: 2026-04-06

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum type for event approval status
CREATE TYPE event_approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Creator reference (links to auth.users)
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Step 1: Basic Information
    event_name VARCHAR(100) NOT NULL,
    event_description TEXT NOT NULL,
    event_image_url TEXT, -- URL to stored image in Supabase Storage
    
    -- Step 2: Event Tools
    enable_nominations BOOLEAN DEFAULT FALSE,
    enable_voting BOOLEAN DEFAULT TRUE,
    
    -- Step 3: Pricing
    amount_per_vote DECIMAL(10, 2) NOT NULL CHECK (amount_per_vote >= 0.10 AND amount_per_vote <= 1000),
    service_fee INTEGER NOT NULL CHECK (service_fee IN (10, 12)) DEFAULT 10,
    
    -- Approval workflow (admin must approve events)
    approval_status event_approval_status DEFAULT 'pending',
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT, -- Reason if event is rejected
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for common queries
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_approval_status ON events(approval_status);
CREATE INDEX idx_events_is_active ON events(is_active);
CREATE INDEX idx_events_created_at ON events(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies
-- 1. Organizers can view their own events
CREATE POLICY "Users can view their own events"
    ON events
    FOR SELECT
    USING (auth.uid() = created_by);

-- 2. Admins can view all events
CREATE POLICY "Admins can view all events"
    ON events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 3. Organizers can create events
CREATE POLICY "Users can create events"
    ON events
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- 4. Organizers can update their own pending events
CREATE POLICY "Users can update their own pending events"
    ON events
    FOR UPDATE
    USING (
        auth.uid() = created_by 
        AND approval_status = 'pending'
        AND is_active = TRUE
    );

-- 5. Admins can update any event (for approval/rejection)
CREATE POLICY "Admins can update any event"
    ON events
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 6. Organizers can soft delete their own pending events
CREATE POLICY "Users can soft delete their own pending events"
    ON events
    FOR DELETE
    USING (
        auth.uid() = created_by 
        AND approval_status = 'pending'
    );

-- Create view for approved events (public facing)
CREATE OR REPLACE VIEW public_approved_events AS
SELECT 
    id,
    event_name,
    event_description,
    event_image_url,
    enable_nominations,
    enable_voting,
    amount_per_vote,
    service_fee,
    created_at,
    updated_at
FROM events
WHERE approval_status = 'approved'
AND is_active = TRUE;

-- Add comments for documentation
COMMENT ON TABLE events IS 'Events created by organizers, requires admin approval';
COMMENT ON COLUMN events.approval_status IS 'Event approval status: pending, approved, or rejected';
COMMENT ON COLUMN events.approved_by IS 'Admin user ID who approved/rejected the event';
COMMENT ON COLUMN events.rejection_reason IS 'Reason provided by admin if event is rejected';

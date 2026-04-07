-- Migration: Fix RLS policies to use JWT claims instead of auth.users
-- Created: 2026-04-06

-- Drop existing admin policies that use auth.users
DROP POLICY IF EXISTS "Admins can view all events" ON events;
DROP POLICY IF EXISTS "Admins can update any event" ON events;

-- Create helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  );
$$;

-- Fixed policy: Admins can view all events
CREATE POLICY "Admins can view all events"
    ON events
    FOR SELECT
    USING (is_admin());

-- Fixed policy: Admins can update any event (for approval/rejection)
CREATE POLICY "Admins can update any event"
    ON events
    FOR UPDATE
    USING (is_admin());

-- Also need to fix the functions in 003_create_admin_functions.sql
-- Drop and recreate them with SECURITY DEFINER

-- Drop existing functions
DROP FUNCTION IF EXISTS approve_event(UUID, UUID);
DROP FUNCTION IF EXISTS reject_event(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS get_pending_events();
DROP FUNCTION IF EXISTS get_organizer_events(UUID);

-- Recreate approve_event function
CREATE OR REPLACE FUNCTION approve_event(
    p_event_id UUID,
    p_admin_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is admin using the helper function
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Only admins can approve events';
    END IF;
    
    -- Update event status
    UPDATE events
    SET 
        approval_status = 'approved',
        approved_by = p_admin_id,
        approved_at = NOW(),
        updated_at = NOW()
    WHERE id = p_event_id;
    
    RETURN FOUND;
END;
$$;

-- Recreate reject_event function
CREATE OR REPLACE FUNCTION reject_event(
    p_event_id UUID,
    p_admin_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is admin
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Only admins can reject events';
    END IF;
    
    -- Update event status
    UPDATE events
    SET 
        approval_status = 'rejected',
        approved_by = p_admin_id,
        approved_at = NOW(),
        rejection_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_event_id;
    
    RETURN FOUND;
END;
$$;

-- Recreate get_pending_events function
CREATE OR REPLACE FUNCTION get_pending_events()
RETURNS TABLE (
    id UUID,
    event_name VARCHAR,
    event_description TEXT,
    event_image_url TEXT,
    created_by UUID,
    creator_name TEXT,
    creator_email TEXT,
    amount_per_vote DECIMAL,
    service_fee INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is admin
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Only admins can view pending events';
    END IF;
    
    RETURN QUERY
    SELECT 
        e.id,
        e.event_name,
        e.event_description,
        e.event_image_url,
        e.created_by,
        u.raw_user_meta_data->>'first_name' || ' ' || u.raw_user_meta_data->>'last_name' as creator_name,
        u.email as creator_email,
        e.amount_per_vote,
        e.service_fee,
        e.created_at
    FROM events e
    JOIN auth.users u ON u.id = e.created_by
    WHERE e.approval_status = 'pending'
    AND e.is_active = TRUE
    ORDER BY e.created_at DESC;
END;
$$;

-- Recreate get_organizer_events function
CREATE OR REPLACE FUNCTION get_organizer_events(p_organizer_id UUID)
RETURNS TABLE (
    id UUID,
    event_name VARCHAR,
    event_description TEXT,
    event_image_url TEXT,
    approval_status event_approval_status,
    rejection_reason TEXT,
    amount_per_vote DECIMAL,
    service_fee INTEGER,
    enable_nominations BOOLEAN,
    enable_voting BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.event_name,
        e.event_description,
        e.event_image_url,
        e.approval_status,
        e.rejection_reason,
        e.amount_per_vote,
        e.service_fee,
        e.enable_nominations,
        e.enable_voting,
        e.created_at,
        e.approved_at
    FROM events e
    WHERE e.created_by = p_organizer_id
    AND e.is_active = TRUE
    ORDER BY e.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION approve_event(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_event(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_events() TO authenticated;
GRANT EXECUTE ON FUNCTION get_organizer_events(UUID) TO authenticated;

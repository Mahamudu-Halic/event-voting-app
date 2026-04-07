-- Migration: Fix RLS policy for soft delete
-- Issue: UPDATE policy was checking is_active = TRUE, preventing soft deletes

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can update their own pending events" ON events;

-- Recreate with proper WITH CHECK that allows is_active updates
CREATE POLICY "Users can update their own pending events"
    ON events
    FOR UPDATE
    USING (
        auth.uid() = created_by 
        AND approval_status = 'pending'
    )
    WITH CHECK (
        auth.uid() = created_by 
        AND approval_status = 'pending'
        -- Note: is_active check removed from WITH CHECK to allow soft deletes
    );

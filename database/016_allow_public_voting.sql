-- Allow public (unauthenticated) users to view approved events and cast votes

-- ============================================================================
-- EVENTS TABLE: Allow public to view approved events
-- ============================================================================

-- Drop existing SELECT policies that restrict access
DROP POLICY IF EXISTS "Users can view their own events" ON public.events;
DROP POLICY IF EXISTS "Admins can view all events" ON public.events;
DROP POLICY IF EXISTS "Allow public to view approved events" ON public.events;

-- Create a unified SELECT policy that handles all cases
CREATE POLICY "Allow public to view approved events"
  ON public.events FOR SELECT
  USING (
    -- Allow public to see approved, active events (no auth required)
    (approval_status = 'approved' AND is_active = true)
    -- Allow organizers to see their own events (any status)
    OR (auth.uid() IS NOT NULL AND auth.uid() = created_by)
    -- Allow admins to see all events
    OR (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    ))
  );

-- ============================================================================
-- NOMINEES TABLE: Allow public viewing and voting
-- ============================================================================

-- First, drop the existing UPDATE policies if they exist
DROP POLICY IF EXISTS "Allow organizers to update nominees for their events" ON public.nominees;
DROP POLICY IF EXISTS "Allow public voting on approved events" ON public.nominees;

-- Create a new UPDATE policy that allows anyone to update votes_count
-- This is specifically for public voting functionality
CREATE POLICY "Allow public voting on approved events"
  ON public.nominees FOR UPDATE
  USING (
    -- Allow if user owns the event (organizer)
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = nominees.event_id
        AND e.created_by = auth.uid()
    )
    OR nominees.created_by = auth.uid()
    -- Allow if the event is approved and voting is enabled
    OR EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = nominees.event_id
        AND e.approval_status = 'approved'
        AND e.is_active = true
        AND e.enable_voting = true
    )
  )
  WITH CHECK (
    -- Same checks for the new row
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = nominees.event_id
        AND e.created_by = auth.uid()
    )
    OR nominees.created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = nominees.event_id
        AND e.approval_status = 'approved'
        AND e.is_active = true
        AND e.enable_voting = true
    )
  );

-- Also allow anyone to SELECT nominees for approved events
DROP POLICY IF EXISTS "Allow organizers to view nominees for their events" ON public.nominees;
DROP POLICY IF EXISTS "Allow public to view nominees for approved events" ON public.nominees;

CREATE POLICY "Allow public to view nominees for approved events"
  ON public.nominees FOR SELECT
  USING (
    -- Allow organizers to see their nominees
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = nominees.event_id
        AND e.created_by = auth.uid()
    )
    OR nominees.created_by = auth.uid()
    -- Allow public to see nominees for approved, active events
    OR EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = nominees.event_id
        AND e.approval_status = 'approved'
        AND e.is_active = true
    )
  );

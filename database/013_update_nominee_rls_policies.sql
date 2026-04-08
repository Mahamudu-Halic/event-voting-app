-- Update RLS policies for nominees to use event_id column directly
-- This migration updates policies to work with the new event_id column

-- Drop existing policies
DROP POLICY IF EXISTS "Allow organizers to view nominees for their categories" ON public.nominees;
DROP POLICY IF EXISTS "Allow organizers to insert nominees for their categories" ON public.nominees;
DROP POLICY IF EXISTS "Allow organizers to update nominees for their categories" ON public.nominees;
DROP POLICY IF EXISTS "Allow organizers to delete nominees for their categories" ON public.nominees;

-- Updated policy for SELECT - check event ownership via event_id
CREATE POLICY "Allow organizers to view nominees for their events"
  ON public.nominees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = nominees.event_id
        AND e.created_by = auth.uid()
    )
    OR nominees.created_by = auth.uid()
  );

-- Updated policy for INSERT
CREATE POLICY "Allow organizers to insert nominees for their events"
  ON public.nominees FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = nominees.event_id
        AND e.created_by = auth.uid()
    )
  );

-- Updated policy for UPDATE
CREATE POLICY "Allow organizers to update nominees for their events"
  ON public.nominees FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = nominees.event_id
        AND e.created_by = auth.uid()
    )
  );

-- Updated policy for DELETE
CREATE POLICY "Allow organizers to delete nominees for their events"
  ON public.nominees FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = nominees.event_id
        AND e.created_by = auth.uid()
    )
  );

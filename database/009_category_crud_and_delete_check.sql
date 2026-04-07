-- SQL for Category CRUD Operations and Nominee Count Check

-- Function to get nominee count for a category
CREATE OR REPLACE FUNCTION get_category_nominee_count(category_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count
  FROM nominees
  WHERE category_id = category_uuid
    AND is_active = true;
  
  RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely delete a category (only if no nominees)
CREATE OR REPLACE FUNCTION delete_category_if_no_nominees(
  category_id UUID,
  user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  nominee_count INTEGER;
  category_owner UUID;
  event_owner UUID;
BEGIN
  -- Get category info and verify ownership
  SELECT c.created_by, e.created_by
  INTO category_owner, event_owner
  FROM categories c
  JOIN events e ON c.event_id = e.id
  WHERE c.id = category_id;
  
  -- Check if user has permission (category creator or event creator)
  IF category_owner IS NULL THEN
    RAISE EXCEPTION 'Category not found';
  END IF;
  
  IF category_owner != user_id AND event_owner != user_id THEN
    RAISE EXCEPTION 'Unauthorized: You do not have permission to delete this category';
  END IF;
  
  -- Check nominee count
  SELECT get_category_nominee_count(category_id) INTO nominee_count;
  
  IF nominee_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete category: It has % nominee(s)', nominee_count;
  END IF;
  
  -- Soft delete the category
  UPDATE categories
  SET is_active = false,
      updated_at = now()
  WHERE id = category_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy: Organizers can update their own categories
CREATE POLICY "Organizers can update their categories"
  ON public.categories
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = categories.event_id
        AND events.created_by = auth.uid()
    )
    OR categories.created_by = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = categories.event_id
        AND events.created_by = auth.uid()
    )
    OR categories.created_by = auth.uid()
  );

-- Policy: Organizers can delete their own categories (via soft delete)
CREATE POLICY "Organizers can delete their categories"
  ON public.categories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = categories.event_id
        AND events.created_by = auth.uid()
    )
    OR categories.created_by = auth.uid()
  );

-- Index for faster category lookups by event
CREATE INDEX IF NOT EXISTS idx_categories_event_id ON public.categories(event_id);

-- Index for active categories only
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(is_active) WHERE is_active = true;

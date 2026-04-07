-- Create categories table for event award categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  category_description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Create RLS policies for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policy: Allow organizers to view categories for their own events
CREATE POLICY "Allow organizers to view their event categories"
  ON public.categories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = categories.event_id
      AND events.created_by = auth.uid()
    )
  );

-- Policy: Allow admins to view all categories
CREATE POLICY "Allow admins to view all categories"
  ON public.categories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Policy: Allow organizers to insert categories for their own events
CREATE POLICY "Allow organizers to insert their event categories"
  ON public.categories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = categories.event_id
      AND events.created_by = auth.uid()
    )
  );

-- Policy: Allow organizers to update categories for their own events
CREATE POLICY "Allow organizers to update their event categories"
  ON public.categories
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = categories.event_id
      AND events.created_by = auth.uid()
    )
  );

-- Policy: Allow admins to manage all categories
CREATE POLICY "Allow admins to manage all categories"
  ON public.categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to count nominees per category
CREATE OR REPLACE FUNCTION get_category_nominee_count(category_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_result
  FROM public.nominees
  WHERE category_id = category_uuid
  AND is_active = true;
  
  RETURN count_result;
END;
$$ LANGUAGE plpgsql;

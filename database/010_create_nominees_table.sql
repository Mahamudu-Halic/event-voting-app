-- Create nominees table
CREATE TABLE IF NOT EXISTS public.nominees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  nominee_name TEXT NOT NULL,
  nominee_description TEXT,
  nominee_image_url TEXT,
  votes_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.nominees ENABLE ROW LEVEL SECURITY;

-- Policies for nominees
CREATE POLICY "Allow organizers to view nominees for their categories"
  ON public.nominees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.categories c
      JOIN public.events e ON c.event_id = e.id
      WHERE c.id = nominees.category_id
        AND e.created_by = auth.uid()
    )
    OR nominees.created_by = auth.uid()
  );

CREATE POLICY "Allow organizers to insert nominees for their categories"
  ON public.nominees FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.categories c
      JOIN public.events e ON c.event_id = e.id
      WHERE c.id = nominees.category_id
        AND e.created_by = auth.uid()
    )
  );

CREATE POLICY "Allow organizers to update nominees for their categories"
  ON public.nominees FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.categories c
      JOIN public.events e ON c.event_id = e.id
      WHERE c.id = nominees.category_id
        AND e.created_by = auth.uid()
    )
  );

CREATE POLICY "Allow organizers to delete nominees for their categories"
  ON public.nominees FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.categories c
      JOIN public.events e ON c.event_id = e.id
      WHERE c.id = nominees.category_id
        AND e.created_by = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_nominees_updated_at
  BEFORE UPDATE ON public.nominees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index for category lookups
CREATE INDEX IF NOT EXISTS idx_nominees_category_id ON public.nominees(category_id);

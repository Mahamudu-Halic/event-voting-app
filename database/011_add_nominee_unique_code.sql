-- Add unique_code column to nominees table for QR code voting
ALTER TABLE public.nominees ADD COLUMN IF NOT EXISTS unique_code TEXT UNIQUE;

-- Add event_id column to nominees table for direct event reference
ALTER TABLE public.nominees ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

-- Create index for event lookups
CREATE INDEX IF NOT EXISTS idx_nominees_event_id ON public.nominees(event_id);

-- Create function to auto-populate event_id from category
CREATE OR REPLACE FUNCTION set_nominee_event_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get event_id from the category
  SELECT event_id INTO NEW.event_id
  FROM public.categories
  WHERE id = NEW.category_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-set event_id before insert
DROP TRIGGER IF EXISTS set_nominee_event_id_trigger ON public.nominees;
CREATE TRIGGER set_nominee_event_id_trigger
  BEFORE INSERT ON public.nominees
  FOR EACH ROW
  EXECUTE FUNCTION set_nominee_event_id();

-- Create function to generate unique code for nominees
CREATE OR REPLACE FUNCTION generate_nominee_unique_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  -- Only generate code if not provided
  IF NEW.unique_code IS NULL OR NEW.unique_code = '' THEN
    LOOP
      -- Generate random 8-character alphanumeric code
      new_code := upper(substring(md5(random()::text) from 1 for 8));
      
      -- Check if code exists
      SELECT EXISTS(
        SELECT 1 FROM public.nominees WHERE unique_code = new_code
      ) INTO code_exists;
      
      -- Exit loop if code is unique
      EXIT WHEN NOT code_exists;
    END LOOP;
    
    NEW.unique_code := new_code;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate unique code
DROP TRIGGER IF EXISTS generate_nominee_code_trigger ON public.nominees;
CREATE TRIGGER generate_nominee_code_trigger
  BEFORE INSERT ON public.nominees
  FOR EACH ROW
  EXECUTE FUNCTION generate_nominee_unique_code();

-- Create index for unique code lookups
CREATE INDEX IF NOT EXISTS idx_nominees_unique_code ON public.nominees(unique_code);

-- Add comment explaining the unique code
COMMENT ON COLUMN public.nominees.unique_code IS 'Unique 8-character alphanumeric code for QR code voting. Auto-generated if not provided.';

-- Add comment explaining event_id
COMMENT ON COLUMN public.nominees.event_id IS 'Reference to the event this nominee belongs to. Auto-populated from category.';

-- Update existing nominees to populate event_id from their categories
UPDATE public.nominees n
SET event_id = c.event_id
FROM public.categories c
WHERE n.category_id = c.id AND n.event_id IS NULL;

-- Migration: Update nominee unique code length to 6 characters
-- Created: 2026-04-20
-- Description: Modify the nominee unique code generation to create 6-character codes instead of 8

-- Drop and recreate the function with 6-character code generation
DROP FUNCTION IF EXISTS public.generate_nominee_unique_code();

CREATE OR REPLACE FUNCTION generate_nominee_unique_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  -- Only generate code if not provided
  IF NEW.unique_code IS NULL OR NEW.unique_code = '' THEN
    LOOP
      -- Generate random 6-character alphanumeric code
      new_code := upper(substring(md5(random()::text) from 1 for 6));
      
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

-- Update comment to reflect new code length
COMMENT ON COLUMN public.nominees.unique_code IS 'Unique 6-character alphanumeric code for QR code voting. Auto-generated if not provided.';

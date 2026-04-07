-- Migration: Create storage bucket for event images
-- Created: 2026-04-06

-- Create the event-images bucket (run this in Supabase Dashboard SQL Editor)
-- Note: Bucket creation is typically done via API or Dashboard, but this documents the setup

-- Policy for event images bucket (to be applied after bucket creation):

-- 1. Allow authenticated users to upload their own event images
CREATE POLICY "Authenticated users can upload event images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'event-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Allow users to update their own images
CREATE POLICY "Users can update their own event images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'event-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Allow users to delete their own images
CREATE POLICY "Users can delete their own event images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'event-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Allow public read access to event images
CREATE POLICY "Public can view event images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-images');

-- Create the bucket via Supabase API or Dashboard:
-- Bucket name: event-images
-- Public: true
-- Allowed MIME types: image/jpeg, image/png, image/webp
-- Max file size: 5242880 (5MB)

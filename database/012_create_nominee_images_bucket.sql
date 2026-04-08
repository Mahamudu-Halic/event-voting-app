-- Migration: Create storage bucket for nominee images
-- Created: 2026-04-07

-- Note: Bucket creation is typically done via API or Dashboard, but this documents the setup
-- Run these policies in Supabase Dashboard SQL Editor after creating the bucket

-- 1. Allow authenticated users to upload their own nominee images
CREATE POLICY "Authenticated users can upload nominee images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'nominee-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Allow users to update their own images
CREATE POLICY "Users can update their own nominee images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'nominee-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Allow users to delete their own images
CREATE POLICY "Users can delete their own nominee images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'nominee-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Allow public read access to nominee images
CREATE POLICY "Public can view nominee images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'nominee-images');

-- Create the bucket via Supabase API or Dashboard:
-- Bucket name: nominee-images
-- Public: true
-- Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
-- Max file size: 5242880 (5MB)

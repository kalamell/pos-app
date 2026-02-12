-- Create storage bucket for menu images
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-images', 'menu-images', true);

-- Anyone can read (public menu images)
CREATE POLICY "Public can read menu images" ON storage.objects FOR SELECT USING (bucket_id = 'menu-images');

-- Authenticated users can upload
CREATE POLICY "Auth users can upload menu images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'menu-images' AND auth.role() = 'authenticated');

-- Users can update their own uploads
CREATE POLICY "Users can update own images" ON storage.objects FOR UPDATE USING (bucket_id = 'menu-images' AND auth.role() = 'authenticated');

-- Users can delete their own uploads
CREATE POLICY "Users can delete own images" ON storage.objects FOR DELETE USING (bucket_id = 'menu-images' AND auth.role() = 'authenticated');

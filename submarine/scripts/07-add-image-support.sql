-- Add image support to questions and answers tables

-- Add image_url column to questions table
ALTER TABLE questions
ADD COLUMN image_url TEXT DEFAULT NULL;

-- Add image_url column to answers table
ALTER TABLE answers
ADD COLUMN image_url TEXT DEFAULT NULL;

-- Create storage buckets for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('quiz_images', 'Quiz Images', true);

-- Set up storage policies for authenticated users
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'quiz_images'
);

CREATE POLICY "Images are publicly accessible"
ON storage.objects FOR SELECT TO public USING (
  bucket_id = 'quiz_images'
);

CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'quiz_images' AND (auth.uid() = owner)
);

CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'quiz_images' AND (auth.uid() = owner)
); 
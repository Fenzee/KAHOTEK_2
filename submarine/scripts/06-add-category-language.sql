-- Menambahkan kolom category dan language ke tabel quizzes
ALTER TABLE public.quizzes
ADD COLUMN category TEXT DEFAULT 'general',
ADD COLUMN language TEXT DEFAULT 'id';

-- Membuat indeks untuk mempercepat pencarian berdasarkan kategori dan bahasa
CREATE INDEX idx_quizzes_category ON public.quizzes (category);
CREATE INDEX idx_quizzes_language ON public.quizzes (language);

-- Update tipe Database di supabase.ts
-- Tambahkan kolom ini ke tipe Database di lib/supabase.ts:
--
-- quizzes: {
--   Row: {
--     ...
--     category: string
--     language: string
--     ...
--   }
--   Insert: {
--     ...
--     category?: string
--     language?: string
--     ...
--   }
--   Update: {
--     ...
--     category?: string
--     language?: string
--     ...
--   }
-- }

-- Membuat fungsi untuk mencari quiz berdasarkan kategori dan bahasa
CREATE OR REPLACE FUNCTION public.search_quizzes(
  search_term TEXT DEFAULT '',
  category_filter TEXT DEFAULT NULL,
  language_filter TEXT DEFAULT NULL,
  is_public_only BOOLEAN DEFAULT TRUE
)
RETURNS SETOF public.quizzes
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM public.quizzes
  WHERE 
    (search_term = '' OR 
     title ILIKE '%' || search_term || '%' OR 
     description ILIKE '%' || search_term || '%')
    AND (category_filter IS NULL OR category = category_filter)
    AND (language_filter IS NULL OR language = language_filter)
    AND (NOT is_public_only OR is_public = TRUE)
  ORDER BY created_at DESC;
$$; 
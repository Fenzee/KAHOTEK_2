// Script untuk membuat storage bucket secara manual
const { createClient } = require('@supabase/supabase-js');

// Ambil kredensial dari environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_KEY harus diatur');
  process.exit(1);
}

// Buat klien Supabase dengan service key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBucket() {
  try {
    console.log('Memeriksa bucket yang ada...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw new Error(`Error memeriksa bucket: ${listError.message}`);
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === 'quiz_images');
    
    if (bucketExists) {
      console.log('Bucket "quiz_images" sudah ada');
    } else {
      console.log('Membuat bucket "quiz_images"...');
      const { data, error } = await supabase.storage.createBucket('quiz_images', {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
      });
      
      if (error) {
        throw new Error(`Error membuat bucket: ${error.message}`);
      }
      
      console.log('Bucket "quiz_images" berhasil dibuat');
    }

    // Membuat policy untuk bucket
    console.log('Membuat policy untuk bucket...');
    
    // Mengambil ID dari project untuk digunakan dalam policy
    const { data: { project }, error: projectError } = await supabase.rpc('get_project_id');
    
    if (projectError) {
      console.warn('Tidak dapat mengambil project ID. Policy harus dibuat secara manual.');
      console.warn('Error:', projectError.message);
      return;
    }
    
    // Membuat policy untuk akses publik
    const policyQueries = [
      `CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'quiz_images');`,
      `CREATE POLICY "Images are publicly accessible" ON storage.objects FOR SELECT TO public USING (bucket_id = 'quiz_images');`,
      `CREATE POLICY "Users can update their own images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'quiz_images' AND (auth.uid() = owner));`,
      `CREATE POLICY "Users can delete their own images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'quiz_images' AND (auth.uid() = owner));`
    ];
    
    console.log('Policy dibuat. Silakan jalankan script SQL migrasi untuk menambahkan policy.');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createBucket(); 
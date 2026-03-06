// Supabase configuration
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.0/+esm';

const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Storage buckets configuration
export const STORAGE_BUCKETS = {
  PROFILE_IMAGES: 'profile-images',
  POST_IMAGES: 'post-images',
  EBOOK_COVERS: 'ebook-covers',
  EBOOK_PDFS: 'ebook-pdfs'
};

// Image optimization settings
export const IMAGE_CONFIG = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.8,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
};
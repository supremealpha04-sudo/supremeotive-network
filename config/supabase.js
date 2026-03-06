// config/supabase.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// Replace with your actual Supabase credentials
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Single bucket for all uploads
export const STORAGE_BUCKET = 'suprememotive-assets';

// Folder paths within the single bucket
export const STORAGE_PATHS = {
  PROFILE_IMAGES: 'profile-images',
  POST_IMAGES: 'post-images',
  EBOOK_COVERS: 'ebook-covers',
  EBOOK_PDFS: 'ebook-pdfs'
};

// Admin emails list
export const ADMIN_EMAILS = [
  'supremealpha04@gmail.com',
  'suprememotive43@gmail.com',
  'sandrakukk055@gmail.com',
  'emmanuelamer6@gmail.com'
];

// Check if user is admin by email
export function isAdminEmail(email) {
  return ADMIN_EMAILS.includes(email?.toLowerCase());
}

// Image optimization settings
export const IMAGE_CONFIG = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.8,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
};

// Get public URL for stored file
export function getPublicUrl(bucket, path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
// config/supabase.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// Replace with your actual Supabase credentials
const SUPABASE_URL = 'https://dzcykpbfykajhoutzhpf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6Y3lrcGJmeWthamhvdXR6aHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MDcxNjQsImV4cCI6MjA4ODE4MzE2NH0.IcuAZj89hwpeRGokawx-V-6BAQtwsiOTBIS_E5-TSMg';

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
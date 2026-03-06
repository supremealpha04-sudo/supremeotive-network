// Supabase configuration
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.0/+esm';

const SUPABASE_URL = 'https://dzcykpbfykajhoutzhpf.supabase.co',
const SUPABASE_ANON_KEY =   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6Y3lrcGJmeWthamhvdXR6aHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MDcxNjQsImV4cCI6MjA4ODE4MzE2NH0.IcuAZj89hwpeRGokawx-V-6BAQtwsiOTBIS_E5-TSMg'

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
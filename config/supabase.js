// Supabase configuration
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.0/+esm';

const SUPABASE_URL = 'https://dzcykpbfykajhoutzhpf.supabase.co',
const SUPABASE_ANON_KEY =   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6Y3lrcGJmeWthamhvdXR6aHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MDcxNjQsImV4cCI6MjA4ODE4MzE2NH0.IcuAZj89hwpeRGokawx-V-6BAQtwsiOTBIS_E5-TSMg'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// // config/supabase.js
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

// Storage buckets
export const STORAGE_BUCKETS = {
  PROFILE_IMAGES: 'profile-images',
  POST_IMAGES: 'post-images',
  EBOOK_COVERS: 'ebook-covers',
  EBOOK_PDFS: 'ebook-pdfs'
};
// Configuration and Constants

const CONFIG = {
    SUPABASE_URL: 'https://dzcykpbfykajhoutzhpf.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6Y3lrcGJmeWthamhvdXR6aHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MDcxNjQsImV4cCI6MjA4ODE4MzE2NH0.IcuAZj89hwpeRGokawx-V-6BAQtwsiOTBIS_E5-TSMg'
};

// Role enums
const ROLES = {
    USER: 'user',
    POST_ADMIN: 'postAdmin',
    EBOOK_ADMIN: 'ebookAdmin',
    UNLOCK_ADMIN: 'unlockAdmin',
    SUPER_ADMIN: 'superAdmin'
};

// App state
let currentUser = null;
let currentProfile = null;
let supabaseClient = null; // Will be set by supabase-client.js

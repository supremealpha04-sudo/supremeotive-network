// Initialize Supabase Client

// This runs immediately when script loads
(function() {
    if (typeof CONFIG === 'undefined') {
        console.error('CONFIG not loaded! Load config.js first');
        return;
    }

    // Create Supabase client
    supabaseClient = supabase.createClient(
        CONFIG.SUPABASE_URL,
        CONFIG.SUPABASE_ANON_KEY
    );

    console.log('Supabase client initialized');
})();

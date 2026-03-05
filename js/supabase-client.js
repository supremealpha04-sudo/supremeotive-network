// js/supabase-client.js - Initialize Supabase Client

console.log('Loading supabase-client.js...');

(function() {
    try {
        // Check if Supabase library loaded from CDN
        if (typeof window.supabase === 'undefined') {
            console.error('❌ ERROR: Supabase library not loaded from CDN!');
            updateInitStatus('Error: Supabase library not loaded');
            return;
        }

        console.log('✅ Supabase library found');

        // Check config
        if (typeof CONFIG === 'undefined') {
            console.error('❌ ERROR: CONFIG not found! Load config.js first.');
            updateInitStatus('Error: Configuration not found');
            return;
        }

        // Validate URL
        if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_URL.startsWith('https://')) {
            console.error('❌ ERROR: Invalid SUPABASE_URL:', CONFIG.SUPABASE_URL);
            updateInitStatus('Error: Invalid Supabase URL');
            return;
        }

        // Create client
        console.log('Creating Supabase client...');
        
        supabaseClient = window.supabase.createClient(
            CONFIG.SUPABASE_URL,
            CONFIG.SUPABASE_ANON_KEY,
            {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true
                }
            }
        );

        console.log('✅ Supabase client created successfully!');
        updateInitStatus('Connecting to database...');

    } catch (error) {
        console.error('❌ ERROR creating Supabase client:', error);
        updateInitStatus('Error: ' + error.message);
    }
})();

function updateInitStatus(message) {
    const statusEl = document.getElementById('init-status');
    if (statusEl) {
        statusEl.textContent = message;
    }
}

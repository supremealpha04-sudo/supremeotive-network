// Main Application Entry Point

console.log('Loading app.js...');

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, starting initialization...');
    
    // Ensure splash is visible
    const splash = document.getElementById('splash-screen');
    if (splash) {
        splash.style.display = 'flex';
        splash.classList.add('active');
    }
    
    // Wait a moment for all scripts to initialize
    setTimeout(async () => {
        try {
            if (!supabaseClient) {
                throw new Error('Supabase client not initialized');
            }

            console.log('✅ Supabase ready, checking auth...');
            updateInitStatus('Checking authentication...');

            await initAuth();
            
        } catch (error) {
            console.error('❌ Failed to initialize:', error);
            updateInitStatus('Error: ' + error.message);
            showToast('Failed to initialize. Please refresh.', 'error');
        }
    }, 1500);
});

// Global error handlers
window.onerror = (msg, url, line) => {
    console.error('Global error:', msg, 'at', url, ':', line);
    return false;
};

window.onunhandledrejection = (event) => {
    console.error('Unhandled rejection:', event.reason);
};

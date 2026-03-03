// Main Application Entry Point

document.addEventListener('DOMContentLoaded', async () => {
    // Show splash screen
    showSplash();
    
    // Initialize auth after splash
    setTimeout(async () => {
        await initAuth();
    }, 2000);
});

// Global error handler
window.onerror = (msg, url, line) => {
    console.error('Error:', msg, 'at', url, ':', line);
    showToast('An error occurred', 'error');
    return false;
};

// Prevent form resubmission on page refresh
if (window.history.replaceState) {
    window.history.replaceState(null, null, window.location.href);
}

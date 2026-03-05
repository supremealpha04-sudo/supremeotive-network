// Screen Management - FIXED

function setScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none'; // Force hide
    });
    
    // Show target screen
    const target = document.getElementById(screenId);
    if (target) {
        target.style.display = 'block';
        // Small delay to ensure display:block applies before adding active class
        setTimeout(() => {
            target.classList.add('active');
        }, 10);
    }
    
    console.log('Switched to screen:', screenId);
}

function setContentScreen(screenId) {
    // Hide all content screens
    document.querySelectorAll('.content-screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    
    // Show target content screen
    const target = document.getElementById(screenId);
    if (target) {
        target.style.display = 'block';
        setTimeout(() => {
            target.classList.add('active');
        }, 10);
    }
    
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    const navMap = {
        'feed-screen': 0,
        'ebooks-screen': 1,
        'profile-screen': 2,
        'admin-screen': 3
    };
    const navIndex = navMap[screenId];
    if (navIndex !== undefined) {
        const navLinks = document.querySelectorAll('.nav-link');
        if (navLinks[navIndex]) navLinks[navIndex].classList.add('active');
    }
    
    console.log('Switched to content screen:', screenId);
}

function showAuth() {
    setScreen('auth-screen');
    showLogin();
}

function showMainApp() {
    setScreen('main-app');
    showFeed();
}

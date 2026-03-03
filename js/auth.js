// Authentication Logic

let currentUser = null;
let currentProfile = null;

// Initialize Auth
async function initAuth() {
    // Check for existing session
    const user = await auth.getUser();
    if (user) {
        await loadUserProfile(user.id);
        showMainApp();
    } else {
        showAuth();
    }

    // Listen for auth changes
    auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
            await loadUserProfile(session.user.id);
            showMainApp();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            currentProfile = null;
            showAuth();
        }
    });
}

async function loadUserProfile(userId) {
    try {
        currentProfile = await db.getProfile(userId);
        currentUser = { id: userId, ...currentProfile };
        updateUIForRole();
    } catch (error) {
        showToast('Error loading profile', 'error');
    }
}

function updateUIForRole() {
    if (!currentProfile) return;

    // Show admin link if applicable
    const adminLink = document.querySelector('.admin-link');
    if (currentProfile.role !== ROLES.USER) {
        adminLink.classList.remove('hidden');
    }

    // Show super admin only elements
    if (currentProfile.role === ROLES.SUPER_ADMIN) {
        document.querySelectorAll('.super-admin-only').forEach(el => {
            el.classList.remove('hidden');
        });
    }

    // Show create buttons based on role
    if (canManagePosts(currentProfile.role)) {
        document.getElementById('create-post-btn').classList.remove('hidden');
    }
    if (canManageEbooks(currentProfile.role)) {
        document.getElementById('create-ebook-btn').classList.remove('hidden');
    }
}

// Screen Navigation
function showSplash() {
    setScreen('splash-screen');
}

function showAuth() {
    setScreen('auth-screen');
    showLogin();
}

function showLogin() {
    document.getElementById('login-form').classList.add('active');
    document.getElementById('signup-form').classList.remove('active');
}

function showSignup() {
    document.getElementById('signup-form').classList.add('active');
    document.getElementById('login-form').classList.remove('active');
}

function showMainApp() {
    setScreen('main-app');
    showFeed();
}

// Event Handlers
document.getElementById('login-form-element').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    showLoading(btn);

    try {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        await auth.signIn(email, password);
        showToast('Welcome back!', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading(btn);
    }
});

document.getElementById('signup-form-element').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    showLoading(btn);

    try {
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const name = document.getElementById('signup-name').value;
        const age = parseInt(document.getElementById('signup-age').value);
        const country = document.getElementById('signup-country').value;
        const bio = document.getElementById('signup-bio').value;

        await auth.signUp(email, password, {
            name,
            age,
            country,
            bio: bio || null,
            role: ROLES.USER
        });

        showToast('Account created! Please check your email.', 'success');
        showLogin();
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading(btn);
    }
});

async function logout() {
    try {
        await auth.signOut();
        showToast('Logged out successfully', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

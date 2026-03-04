// Authentication Logic - NOW USES GLOBAL supabaseClient

const authAPI = {
    async signUp(email, password, userData) {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: userData
            }
        });
        if (error) throw error;
        return data;
    },

    async signIn(email, password) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    },

    async signOut() {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
    },

    async getUser() {
        const { data: { user } } = await supabaseClient.auth.getUser();
        return user;
    },

    onAuthStateChange(callback) {
        return supabaseClient.auth.onAuthStateChange(callback);
    }
};

// Auth state management functions
async function initAuth() {
    const user = await authAPI.getUser();
    if (user) {
        await loadUserProfile(user.id);
        showMainApp();
    } else {
        showAuth();
    }

    authAPI.onAuthStateChange(async (event, session) => {
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

    const adminLink = document.querySelector('.admin-link');
    if (currentProfile.role !== ROLES.USER) {
        adminLink.classList.remove('hidden');
    }

    if (currentProfile.role === ROLES.SUPER_ADMIN) {
        document.querySelectorAll('.super-admin-only').forEach(el => {
            el.classList.remove('hidden');
        });
    }

    if (canManagePosts(currentProfile.role)) {
        document.getElementById('create-post-btn').classList.remove('hidden');
    }
    if (canManageEbooks(currentProfile.role)) {
        document.getElementById('create-ebook-btn').classList.remove('hidden');
    }
}

// Screen navigation
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

async function logout() {
    try {
        await authAPI.signOut();
        showToast('Logged out successfully', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Login form
    const loginForm = document.getElementById('login-form-element');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            showLoading(btn);

            try {
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                
                await authAPI.signIn(email, password);
                showToast('Welcome back!', 'success');
            } catch (error) {
                showToast(error.message, 'error');
            } finally {
                hideLoading(btn);
            }
        });
    }

    // Signup form
    const signupForm = document.getElementById('signup-form-element');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
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

                await authAPI.signUp(email, password, {
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
    }
});

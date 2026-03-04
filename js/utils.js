// Utility Functions (same as before)

const utils = {
    timeAgo(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        if (years > 0) return `${years}y ago`;
        if (months > 0) return `${months}mo ago`;
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    },

    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    },

    generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    validatePassword(password) {
        return password.length >= 6;
    },

    formatPrice(price, currency) {
        return `${currency}${parseFloat(price).toFixed(0)}`;
    }
};

// UI Helpers
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showLoading(button) {
    const text = button.querySelector('.btn-text');
    const loader = button.querySelector('.btn-loader');
    if (text) text.classList.add('hidden');
    if (loader) loader.classList.remove('hidden');
    button.disabled = true;
}

function hideLoading(button) {
    const text = button.querySelector('.btn-text');
    const loader = button.querySelector('.btn-loader');
    if (text) text.classList.remove('hidden');
    if (loader) loader.classList.add('hidden');
    button.disabled = false;
}

function setScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function setContentScreen(screenId) {
    document.querySelectorAll('.content-screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    const navMap = {
        'feed-screen': 0,
        'ebooks-screen': 1,
        'profile-screen': 2,
        'admin-screen': 3
    };
    const navIndex = navMap[screenId];
    if (navIndex !== undefined) {
        document.querySelectorAll('.nav-link')[navIndex]?.classList.add('active');
    }
}

function openModal(modalId) {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById(modalId);
    
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
    
    setTimeout(() => {
        overlay.classList.add('active');
    }, 10);
}

function closeModal(event) {
    if (event && event.target !== event.currentTarget) return;
    
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('active');
    
    setTimeout(() => {
        overlay.classList.add('hidden');
        document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    }, 300);
}

function previewImage(event, previewId) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById(previewId);
        preview.src = e.target.result;
        preview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

// Role Helpers
function canManagePosts(role) {
    return role === ROLES.POST_ADMIN || role === ROLES.SUPER_ADMIN;
}

function canManageEbooks(role) {
    return role === ROLES.EBOOK_ADMIN || role === ROLES.SUPER_ADMIN;
}

function canManageUnlocks(role) {
    return role === ROLES.UNLOCK_ADMIN || role === ROLES.SUPER_ADMIN;
}

function canManageUsers(role) {
    return role === ROLES.SUPER_ADMIN;
}

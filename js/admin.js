// Admin Logic

let adminPosts = [];
let adminEbooks = [];
let pendingRequests = [];
let allUnlocks = [];
let allUsers = [];

function showAdmin() {
    setContentScreen('admin-screen');
    loadAdminData();
}

async function loadAdminData() {
    if (canManagePosts(currentProfile.role)) {
        await loadAdminPosts();
    }
    if (canManageEbooks(currentProfile.role)) {
        await loadAdminEbooks();
    }
    if (canManageUnlocks(currentProfile.role)) {
        await loadUnlockRequests();
    }
    if (canManageUsers(currentProfile.role)) {
        await loadAllUsers();
    }
}

function showAdminTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`admin-${tab}`).classList.add('active');
}

async function loadAdminPosts() {
    try {
        adminPosts = await db.getPosts();
        const container = document.getElementById('admin-posts-list');
        
        container.innerHTML = adminPosts.map(post => `
            <div class="admin-item">
                <div class="admin-item-info">
                    <div class="admin-item-title">${escapeHtml(post.title)}</div>
                    <div class="admin-item-subtitle">${utils.timeAgo(post.created_at)} • ${post.likes_count} likes</div>
                </div>
                <div class="admin-item-actions">
                    <button class="btn btn-icon" onclick="editPost('${post.id}')">✏️</button>
                    <button class="btn btn-icon" onclick="deleteAdminPost('${post.id}')" style="color: var(--error)">🗑️</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load admin posts', error);
    }
}

function editPost(postId) {
    const post = adminPosts.find(p => p.id === postId);
    if (post) {
        showCreatePost(post);
    }
}

async function deleteAdminPost(postId) {
    if (!confirm('Delete this post?')) return;
    
    try {
        await db.deletePost(postId);
        await loadAdminPosts();
        await loadPosts();
        showToast('Post deleted', 'success');
    } catch (error) {
        showToast('Failed to delete post', 'error');
    }
}

async function loadAdminEbooks() {
    try {
        adminEbooks = await db.getEbooks();
        const container = document.getElementById('admin-ebooks-list');
        
        container.innerHTML = adminEbooks.map(ebook => `
            <div class="admin-item">
                <img src="${ebook.cover_url}" alt="">
                <div class="admin-item-info">
                    <div class="admin-item-title">${escapeHtml(ebook.title)}</div>
                    <div class="admin-item-subtitle">${ebook.category} • ${utils.formatPrice(ebook.price, ebook.currency)}</div>
                </div>
                <div class="admin-item-actions">
                    <button class="btn btn-icon" onclick="deleteAdminEbook('${ebook.id}')" style="color: var(--error)">🗑️</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load admin ebooks', error);
    }
}

async function deleteAdminEbook(ebookId) {
    if (!confirm('Delete this eBook?')) return;
    
    try {
        await db.deleteEbook(ebookId);
        await loadAdminEbooks();
        await loadEbooks();
        showToast('eBook deleted', 'success');
    } catch (error) {
        showToast('Failed to delete eBook', 'error');
    }
}

function showUnlockTab(tab) {
    document.querySelectorAll('.unlock-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    document.querySelectorAll('.unlock-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`unlock-${tab}`).classList.add('active');
}

async function loadUnlockRequests() {
    try {
        pendingRequests = await db.getPendingRequests();
        renderPendingRequests();
        
        allUnlocks = await db.getAllUnlocks();
        renderAllUnlocks();
    } catch (error) {
        console.error('Failed to load unlocks', error);
    }
}

function renderPendingRequests() {
    const container = document.getElementById('unlock-pending');
    
    if (pendingRequests.length === 0) {
        container.innerHTML = '<p class="empty-state">No pending requests</p>';
        return;
    }

    container.innerHTML = pendingRequests.map(req => `
        <div class="unlock-request">
            <div class="unlock-request-header">
                <div class="unlock-request-info">
                    <h4>${escapeHtml(req.ebooks?.title || 'Unknown')}</h4>
                    <p>By: ${req.profiles?.name || 'Unknown'} (${req.profiles?.email})</p>
                </div>
                <span class="unlock-request-price">${utils.formatPrice(req.ebooks?.price || 0, '₦')}</span>
            </div>
            <div class="unlock-request-actions">
                <button class="btn btn-secondary" onclick="rejectUnlock('${req.user_id}', '${req.ebook_id}')">Reject</button>
                <button class="btn btn-primary" onclick="approveUnlock('${req.user_id}', '${req.ebook_id}')">Approve</button>
            </div>
        </div>
    `).join('');
}

function renderAllUnlocks() {
    const container = document.getElementById('unlock-all');
    
    container.innerHTML = allUnlocks.map(unlock => `
        <div class="admin-item">
            <div class="admin-item-info">
                <div class="admin-item-title">${escapeHtml(unlock.ebooks?.title || 'Unknown')}</div>
                <div class="admin-item-subtitle">User: ${unlock.profiles?.name || 'Unknown'}</div>
            </div>
            <button class="btn btn-icon" onclick="revokeUnlock('${unlock.user_id}', '${unlock.ebook_id}')" style="color: var(--error)">
                🚫
            </button>
        </div>
    `).join('');
}

async function approveUnlock(userId, ebookId) {
    try {
        await db.approveUnlock(userId, ebookId);
        await loadUnlockRequests();
        showToast('Unlock approved', 'success');
    } catch (error) {
        showToast('Failed to approve', 'error');
    }
}

async function rejectUnlock(userId, ebookId) {
    try {
        await db.rejectUnlock(userId, ebookId);
        await loadUnlockRequests();
        showToast('Request rejected', 'success');
    } catch (error) {
        showToast('Failed to reject', 'error');
    }
}

async function revokeUnlock(userId, ebookId) {
    if (!confirm('Revoke this access?')) return;
    
    try {
        await db.revokeUnlock(userId, ebookId);
        await loadUnlockRequests();
        showToast('Access revoked', 'success');
    } catch (error) {
        showToast('Failed to revoke', 'error');
    }
}

async function loadAllUsers() {
    try {
        allUsers = await db.getAllProfiles();
        const container = document.getElementById('admin-users-list');
        
        container.innerHTML = allUsers.map(user => `
            <div class="user-item">
                <div class="user-avatar">${user.name[0]}</div>
                <div class="user-info">
                    <div class="user-name">${escapeHtml(user.name)}</div>
                    <div class="user-email">${user.email}</div>
                </div>
                <span class="user-role ${user.role}">${user.role}</span>
                <select class="role-selector" onchange="changeUserRole('${user.id}', this.value)">
                    ${Object.values(ROLES).map(role => `
                        <option value="${role}" ${user.role === role ? 'selected' : ''}>
                            ${role}
                        </option>
                    `).join('')}
                </select>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load users', error);
    }
}

async function changeUserRole(userId, newRole) {
    try {
        await db.updateProfile(userId, { role: newRole });
        await loadAllUsers();
        showToast('Role updated', 'success');
    } catch (error) {
        showToast('Failed to update role', 'error');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

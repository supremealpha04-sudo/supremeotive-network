// Feed Logic - Uses global db, currentUser, currentProfile

let posts = [];
let currentPostId = null;

async function showFeed() {
    setContentScreen('feed-screen');
    await loadPosts();
}

async function loadPosts() {
    const container = document.getElementById('posts-container');
    container.innerHTML = `
        <div class="loading-shimmer">
            <div class="shimmer-card"></div>
            <div class="shimmer-card"></div>
            <div class="shimmer-card"></div>
        </div>
    `;

    try {
        posts = await db.getPosts();
        renderPosts();
    } catch (error) {
        showToast('Failed to load posts', 'error');
        container.innerHTML = '<p class="empty-state">Failed to load posts</p>';
    }
}

function renderPosts() {
    const container = document.getElementById('posts-container');
    
    if (posts.length === 0) {
        container.innerHTML = '<p class="empty-state">No posts yet</p>';
        return;
    }

    container.innerHTML = posts.map(post => `
        <article class="post-card" data-id="${post.id}">
            <div class="post-header">
                <div class="post-avatar">
                    ${post.profiles?.profile_image_url 
                        ? `<img src="${post.profiles.profile_image_url}" alt="">`
                        : post.profiles?.name?.[0]?.toUpperCase() || 'A'
                    }
                </div>
                <div class="post-meta">
                    <div class="post-author">${post.profiles?.name || 'Admin'}</div>
                    <div class="post-time">${utils.timeAgo(post.created_at)}</div>
                </div>
                ${canManagePosts(currentProfile?.role) ? `
                    <button class="post-menu" onclick="showPostMenu('${post.id}', event)">⋮</button>
                ` : ''}
            </div>
            <div class="post-content">
                <h3 class="post-title">${escapeHtml(post.title)}</h3>
                <p class="post-text">${escapeHtml(post.content)}</p>
            </div>
            ${post.image_url ? `
                <img src="${post.image_url}" alt="" class="post-image" loading="lazy">
            ` : ''}
            <div class="post-actions">
                <button class="post-action ${post.is_liked ? 'active' : ''}" onclick="toggleLike('${post.id}')">
                    <span>${post.is_liked ? '❤️' : '🤍'}</span>
                    <span>${post.likes_count}</span>
                </button>
                <button class="post-action" onclick="showComments('${post.id}')">
                    <span>💬</span>
                    <span>${post.comments_count}</span>
                </button>
                <button class="post-action" onclick="sharePost('${post.id}')">
                    <span>📤</span>
                    <span>Share</span>
                </button>
            </div>
        </article>
    `).join('');
}

async function toggleLike(postId) {
    try {
        const isLiked = await db.toggleLike(postId);
        const post = posts.find(p => p.id === postId);
        if (post) {
            post.is_liked = isLiked;
            post.likes_count += isLiked ? 1 : -1;
            renderPosts();
        }
    } catch (error) {
        showToast('Failed to update like', 'error');
    }
}

function showPostMenu(postId, event) {
    event.stopPropagation();
    if (confirm('Delete this post?')) {
        deletePost(postId);
    }
}

async function deletePost(postId) {
    try {
        await db.deletePost(postId);
        posts = posts.filter(p => p.id !== postId);
        renderPosts();
        showToast('Post deleted', 'success');
    } catch (error) {
        showToast('Failed to delete post', 'error');
    }
}

function showCreatePost(post = null) {
    document.getElementById('create-post-form').reset();
    document.getElementById('post-image-preview').classList.add('hidden');
    
    if (post) {
        document.querySelector('#create-post-modal h3').textContent = 'Edit Post';
        document.getElementById('post-title').value = post.title;
        document.getElementById('post-content').value = post.content;
        if (post.image_url) {
            document.getElementById('post-image-preview').src = post.image_url;
            document.getElementById('post-image-preview').classList.remove('hidden');
        }
        currentPostId = post.id;
    } else {
        document.querySelector('#create-post-modal h3').textContent = 'Create Post';
        currentPostId = null;
    }
    
    openModal('create-post-modal');
}

// Create post form handler
document.addEventListener('DOMContentLoaded', () => {
    const createPostForm = document.getElementById('create-post-form');
    if (createPostForm) {
        createPostForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            showLoading(btn);

            try {
                const title = document.getElementById('post-title').value;
                const content = document.getElementById('post-content').value;
                const imageFile = document.getElementById('post-image').files[0];
                
                let imageUrl = null;
                if (imageFile) {
                    const path = `posts/${utils.generateId()}.${imageFile.name.split('.').pop()}`;
                    await storage.uploadFile('images', path, imageFile);
                    imageUrl = await storage.getPublicUrl('images', path);
                }

                if (currentPostId) {
                    await db.updatePost(currentPostId, { title, content, image_url: imageUrl });
                    showToast('Post updated', 'success');
                } else {
                    await db.createPost({
                        title,
                        content,
                        image_url: imageUrl,
                        created_by: currentUser.id
                    });
                    showToast('Post created', 'success');
                }

                closeModal();
                await loadPosts();
            } catch (error) {
                showToast(error.message, 'error');
            } finally {
                hideLoading(btn);
            }
        });
    }
});

// Comments
async function showComments(postId) {
    currentPostId = postId;
    openModal('comments-modal');
    await loadComments(postId);
}

async function loadComments(postId) {
    const container = document.getElementById('comments-list');
    container.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const comments = await db.getComments(postId);
        renderComments(comments);
    } catch (error) {
        container.innerHTML = '<p>Failed to load comments</p>';
    }
}

function renderComments(comments, container = null, isReply = false) {
    if (!container) {
        container = document.getElementById('comments-list');
        container.innerHTML = '';
    }

    if (comments.length === 0 && !isReply) {
        container.innerHTML = '<p class="empty-state">No comments yet</p>';
        return;
    }

    comments.forEach(comment => {
        const commentEl = document.createElement('div');
        commentEl.className = isReply ? 'comment reply' : 'comment';
        commentEl.innerHTML = `
            <div class="comment-avatar">
                ${comment.profiles?.profile_image_url 
                    ? `<img src="${comment.profiles.profile_image_url}" alt="">`
                    : comment.profiles?.name?.[0]?.toUpperCase()
                }
            </div>
            <div class="comment-content">
                <div class="comment-author">${comment.profiles?.name || 'Unknown'}</div>
                <div class="comment-text">${escapeHtml(comment.content)}</div>
                <div class="comment-time">${utils.timeAgo(comment.created_at)}</div>
                ${!isReply ? `
                    <button class="btn btn-text" onclick="replyTo('${comment.id}')">Reply</button>
                ` : ''}
            </div>
        `;
        container.appendChild(commentEl);

        if (comment.replies && comment.replies.length > 0) {
            renderComments(comment.replies, container, true);
        }
    });
}

let replyingTo = null;

function replyTo(commentId) {
    replyingTo = commentId;
    const input = document.getElementById('comment-input');
    input.placeholder = 'Write a reply...';
    input.focus();
}

// Comment form handler
document.addEventListener('DOMContentLoaded', () => {
    const commentForm = document.getElementById('add-comment-form');
    if (commentForm) {
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = document.getElementById('comment-input');
            const content = input.value.trim();
            if (!content) return;

            try {
                await db.addComment({
                    post_id: currentPostId,
                    content,
                    parent_comment_id: replyingTo,
                    user_id: currentUser.id
                });

                input.value = '';
                replyingTo = null;
                input.placeholder = 'Write a comment...';
                await loadComments(currentPostId);
                await loadPosts();
            } catch (error) {
                showToast('Failed to add comment', 'error');
            }
        });
    }
});

function sharePost(postId) {
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(url);
    showToast('Link copied to clipboard', 'success');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===========================
// SUPREME MOTIVE NETWORK
// Main JavaScript
// ===========================

// Supabase Configuration
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
const ADMIN_EMAIL = 'admin@suprememotive.com'; // Change to your admin email

let supabase;

// Initialize Supabase
async function initializeSupabase() {
  const { createClient } = window.supabase;
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initializeSupabase();
  loadTheme();
  setupEventListeners();
  loadUserSession();
});

// ===========================
// THEME MANAGEMENT
// ===========================

function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeToggleIcon(newTheme);
}

function loadTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeToggleIcon(savedTheme);
}

function updateThemeToggleIcon(theme) {
  const themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.innerHTML =
      theme === 'dark' ? '☀️' : '🌙';
  }
}

// ===========================
// USER MANAGEMENT
// ===========================

let currentUser = null;

async function loadUserSession() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    currentUser = session?.user || null;
    updateUIForUser();
  } catch (error) {
    console.error('Error loading session:', error);
  }
}

function updateUIForUser() {
  const authButton = document.querySelector('.auth-button');
  const userMenu = document.querySelector('.user-menu');

  if (currentUser) {
    if (authButton) authButton.style.display = 'none';
    if (userMenu) {
      userMenu.style.display = 'flex';
      const userInitial = currentUser.email.charAt(0).toUpperCase();
      const userAvatar = userMenu.querySelector('.user-avatar');
      if (userAvatar) userAvatar.textContent = userInitial;
    }
  } else {
    if (authButton) authButton.style.display = 'block';
    if (userMenu) userMenu.style.display = 'none';
  }
}

async function checkAdminStatus() {
  if (!currentUser) return false;
  return currentUser.email === ADMIN_EMAIL;
}

// ===========================
// AUTHENTICATION
// ===========================

async function handleSignup(email, password, username) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
        },
      },
    });

    if (error) throw error;

    // Create user profile
    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        email: email,
        username: username,
        created_at: new Date(),
      });
    }

    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleLogin(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    currentUser = data.user;
    updateUIForUser();
    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleLogout() {
  try {
    await supabase.auth.signOut();
    currentUser = null;
    updateUIForUser();
    window.location.href = '/';
  } catch (error) {
    console.error('Error logging out:', error);
  }
}

// ===========================
// POSTS MANAGEMENT
// ===========================

async function fetchPosts(page = 1, pageSize = 10) {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data, count };
  } catch (error) {
    console.error('Error fetching posts:', error);
    return { data: [], count: 0 };
  }
}
async function fetchPostById(postId) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

async function createPost(title, content, mediaUrl) {
  try {
    if (!currentUser) {
      throw new Error('User must be logged in');
    }

    const isAdmin = await checkAdminStatus();
    if (!isAdmin) {
      throw new Error('Only admin can create posts');
    }

    const { data, error } = await supabase.from('posts').insert({
      title,
      content,
      media_url: mediaUrl,
      user_id: currentUser.id,
      created_at: new Date(),
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function updatePost(postId, title, content, mediaUrl) {
  try {
    const isAdmin = await checkAdminStatus();
    if (!isAdmin) {
      throw new Error('Only admin can edit posts');
    }

    const { data, error } = await supabase
      .from('posts')
      .update({
        title,
        content,
        media_url: mediaUrl,
      })
      .eq('id', postId);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function deletePost(postId) {
  try {
    const isAdmin = await checkAdminStatus();
    if (!isAdmin) {
      throw new Error('Only admin can delete posts');
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ===========================
// LIKES MANAGEMENT
// ===========================

async function toggleLike(postId) {
  try {
    if (!currentUser) {
      window.location.href = '/pages/login.html?redirect=' + window.location.pathname;
      return false;
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', currentUser.id)
      .single();

    if (existingLike) {
      // Unlike
      await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id);
      return false;
    } else {
      // Like
      await supabase.from('likes').insert({
        post_id: postId,
        user_id: currentUser.id,
        created_at: new Date(),
      });
      return true;
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return false;
  }
}

async function getLikeCount(postId) {
  try {
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    return count || 0;
  } catch (error) {
    console.error('Error fetching like count:', error);
    return 0;
  }
}

async function isPostLikedByUser(postId) {
  try {
    if (!currentUser) return false;

    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', currentUser.id)
      .single();

    return !!data;
  } catch (error) {
    return false;
  }
}

// ===========================
// COMMENTS MANAGEMENT
// ===========================

async function fetchComments(postId) {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .is('parent_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch replies for each comment
    for (let comment of data) {
      const { data: replies } = await supabase
        .from('comments')
        .select('*')
        .eq('parent_id', comment.id)
        .order('created_at', { ascending: true });

      comment.replies = replies || [];
    }

    return data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

async function addComment(postId, content, parentId = null) {
  try {
    if (!currentUser) {
      window.location.href = '/pages/login.html?redirect=' + window.location.pathname;
      return { success: false, error: 'Must be logged in' };
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: currentUser.id,
        content,
        parent_id: parentId,
        created_at: new Date(),
      });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function deleteComment(commentId) {
  try {
    const isAdmin = await checkAdminStatus();
    const { data: comment } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (!isAdmin && comment.user_id !== currentUser.id) {
      throw new Error('Not authorized to delete this comment');
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getCommentCount(postId) {
  try {
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    return count || 0;
  } catch (error) {
    console.error('Error fetching comment count:', error);
    return 0;
  }
}

// ===========================
// SHARE FUNCTIONALITY
// ===========================

async function sharePost(post) {
  const shareText = `Check out: "${post.title}" on SupremeMotive Network`;
  const shareUrl = window.location.origin + '/pages/post.html?id=' + post.id;

  if (navigator.share) {
    try {
      await navigator.share({
        title: post.title,
        text: shareText,
        url: shareUrl,
      });
    } catch (error) {
      console.log('Share cancelled');
    }
  } else {
    // Fallback: Copy to clipboard
    copyToClipboard(shareText + '\n' + shareUrl);
    showNotification('Link copied to clipboard!');
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch((err) => {
    console.error('Failed to copy:', err);
  });
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.className = `notification ${type}`;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ===========================
// SUPPORT TICKETS
// ===========================

async function submitSupportTicket(title, message) {
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: currentUser?.id || null,
        email: currentUser?.email || '',
        title,
        message,
        status: 'open',
        created_at: new Date(),
      });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ===========================
// PROFILE MANAGEMENT
// ===========================

async function fetchAdminProfile() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', ADMIN_EMAIL)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    return null;
  }
}

async function updateAdminProfile(name, bio, photo_url) {
  try {
    const isAdmin = await checkAdminStatus();
    if (!isAdmin) {
      throw new Error('Only admin can update profile');
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        name,
        bio,
        photo_url,
      })
      .eq('email', ADMIN_EMAIL);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ===========================
// FILE UPLOAD
// ===========================

async function uploadMedia(file, bucket = 'posts-media') {
  try {
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) throw error;

    const { data: publicUrl } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return { success: true, url: publicUrl.publicUrl };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ===========================
// EVENT LISTENERS SETUP
// ===========================

function setupEventListeners() {
  // Theme toggle
  document.querySelector('.theme-toggle')?.addEventListener('click', toggleTheme);

  // Mobile menu toggle
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const navMenu = document.querySelector('nav ul');
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
      navMenu?.classList.toggle('active');
    });
  }

  // User menu dropdown
  const userAvatar = document.querySelector('.user-avatar');
  const dropdownMenu = document.querySelector('.dropdown-menu');
  if (userAvatar) {
    userAvatar.addEventListener('click', () => {
      dropdownMenu?.classList.toggle('active');
    });
  }

  // Logout button
  document.querySelector('[data-action="logout"]')?.addEventListener('click', handleLogout);

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const isUserMenu = e.target.closest('.user-menu');
    if (!isUserMenu) {
      dropdownMenu?.classList.remove('active');
    }
  });
}

// ===========================
// UI RENDERING FUNCTIONS
// ===========================

function renderPostCard(post) {
  const card = document.createElement('div');
  card.className = 'post-card';
  card.innerHTML = `
    ${post.media_url ? `<img src="${post.media_url}" alt="${post.title}" class="post-media">` : ''}
    <div class="post-content">
      <h2 class="post-title">${post.title}</h2>
      <div class="post-meta">
        <span class="post-meta-item">📅 ${new Date(post.created_at).toLocaleDateString()}</span>
      </div>
      <p class="post-excerpt">${post.content.substring(0, 150)}...</p>
      <a href="/pages/post.html?id=${post.id}" class="read-more">Read More →</a>
      <div class="post-actions" data-post-id="${post.id}">
        <button class="post-action-btn like-btn" onclick="handleLikeClick(event, '${post.id}')">
          ❤️ <span class="like-count">0</span>
        </button>
        <button class="post-action-btn comment-btn" onclick="goToComments('${post.id}')">
          💬 <span class="comment-count">0</span>
        </button>
        <button class="post-action-btn share-btn" onclick="handleShareClick(event, this)">
          🔗 Share
        </button>
      </div>
    </div>
  `;

  return card;
}

function renderComment(comment) {
  const commentEl = document.createElement('div');
  commentEl.className = 'comment';
  commentEl.innerHTML = `
    <div class="comment-author">
      <div class="comment-avatar">${comment.username?.charAt(0).toUpperCase() || 'U'}</div>
      <div>
        <div class="comment-name">${comment.username || 'Anonymous'}</div>
        <div class="comment-time">${new Date(comment.created_at).toLocaleDateString()}</div>
      </div>
    </div>
    <div class="comment-text">${comment.content}</div>
    <div class="comment-actions">
      ${currentUser?.id === comment.user_id ? `
        <button class="comment-action-btn" onclick="deleteCommentHandler('${comment.id}')">Delete</button>
      ` : ''}
    </div>
    ${comment.replies && comment.replies.length > 0 ? `
      <div class="replies">
        ${comment.replies.map(reply => renderComment(reply).outerHTML).join('')}
      </div>
    ` : ''}
  `;

  return commentEl;
}

// ===========================
// EVENT HANDLERS
// ===========================

async function handleLikeClick(event, postId) {
  event.preventDefault();
  event.stopPropagation();

  if (!currentUser) {
    window.location.href = '/pages/login.html';
    return;
  }

  const btn = event.currentTarget;
  const isLiked = await toggleLike(postId);
  const likeCount = await getLikeCount(postId);

  btn.classList.toggle('active', isLiked);
  btn.querySelector('.like-count').textContent = likeCount;
}

async function goToComments(postId) {
  if (!currentUser) {
    window.location.href = '/pages/login.html';
    return;
  }
  window.location.href = `/pages/post.html?id=${postId}#comments`;
}

async function handleShareClick(event, btn) {
  event.preventDefault();
  event.stopPropagation();

  const postId = btn.closest('[data-post-id]').dataset.postId;
  const post = await fetchPostById(postId);

  if (post) {
    await sharePost(post);
  }
}

async function deleteCommentHandler(commentId) {
  if (confirm('Delete this comment?')) {
    const result = await deleteComment(commentId);
    if (result.success) {
      location.reload();
    } else {
      alert('Error: ' + result.error);
    }
  }
}

// Export functions for use in other files
window.SupremeMotive = {
  toggleTheme,
  handleSignup,
  handleLogin,
  handleLogout,
  fetchPosts,
  fetchPostById,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  getLikeCount,
  isPostLikedByUser,
  fetchComments,
  addComment,
  deleteComment,
  getCommentCount,
  sharePost,
  uploadMedia,
  submitSupportTicket,
  fetchAdminProfile,
  updateAdminProfile,
  checkAdminStatus,
  renderPostCard,
  renderComment,
  copyToClipboard,
  showNotification,
  currentUser,
};

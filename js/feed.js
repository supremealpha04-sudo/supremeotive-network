import { supabase } from '../config/supabase.js';
import { getCurrentUser } from './auth.js';

// Fetch all posts
export async function fetchPosts() {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:created_by (name, profile_image_url),
        post_likes (count),
        comments (count)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get like counts for each post
    const postsWithDetails = await Promise.all(data.map(async (post) => {
      const { count: likesCount } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      const { count: commentsCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      return {
        ...post,
        likes_count: likesCount,
        comments_count: commentsCount
      };
    }));

    return { success: true, posts: postsWithDetails };
  } catch (error) {
    console.error('Fetch posts error:', error);
    return { success: false, error: error.message };
  }
}

// Create new post (admin only)
export async function createPost(postData) {
  try {
    const { user } = await getCurrentUser();
    
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('posts')
      .insert([
        {
          title: postData.title,
          content: postData.content,
          image_url: postData.imageUrl || null,
          created_by: user.id
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return { success: true, post: data };
  } catch (error) {
    console.error('Create post error:', error);
    return { success: false, error: error.message };
  }
}

// Like/unlike post
export async function toggleLike(postId) {
  try {
    const { user } = await getCurrentUser();
    
    if (!user) throw new Error('Not authenticated');

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) throw error;
      return { success: true, action: 'unliked' };
    } else {
      // Like
      const { error } = await supabase
        .from('post_likes')
       .insert([
          {
            post_id: postId,
            user_id: user.id
          }
        ]);

      if (error) throw error;
      return { success: true, action: 'liked' };
    }
  } catch (error) {
    console.error('Toggle like error:', error);
    return { success: false, error: error.message };
  }
}

// Upload post image
export async function uploadPostImage(file) {
  try {
    const { user } = await getCurrentUser();
    
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('post-images')
      .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Upload post image error:', error);
    return { success: false, error: error.message };
  }
}

// Render feed
export function renderFeed(posts, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = posts.map(post => `
    <div class="post-card" data-post-id="${post.id}">
      <div class="post-header">
        <img src="${post.profiles?.profile_image_url || 'assets/images/default-avatar.png'}" 
             alt="${post.profiles?.name}" 
             class="post-author-avatar">
        <div class="post-author-info">
          <h3>${post.profiles?.name || 'Unknown User'}</h3>
          <span class="post-date">${new Date(post.created_at).toLocaleDateString()}</span>
        </div>
      </div>
      
      <h2 class="post-title">${post.title}</h2>
      <div class="post-content">${post.content}</div>
      
      ${post.image_url ? `
        <img src="${post.image_url}" alt="Post image" class="post-image">
      ` : ''}
      
      <div class="post-actions">
        <button class="action-btn like-btn ${post.user_liked ? 'liked' : ''}" 
                onclick="handleLike('${post.id}')">
          <span>❤️</span>
          <span class="like-count">${post.likes_count || 0}</span>
        </button>
        
        <button class="action-btn comment-btn" 
                onclick="toggleComments('${post.id}')">
          <span>💬</span>
          <span>${post.comments_count || 0}</span>
        </button>
        
        <button class="action-btn share-btn" 
                onclick="sharePost('${post.id}')">
          <span>📤</span>
          <span>Share</span>
        </button>
      </div>
      
      <div id="comments-${post.id}" class="comments-section hidden"></div>
    </div>
  `).join('');
}
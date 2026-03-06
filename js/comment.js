import { supabase } from '../config/supabase.js';
import { getCurrentUser } from './auth.js';

// Fetch comments for a post
export async function fetchComments(postId) {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (name, profile_image_url),
        replies:comments!parent_comment_id (
          *,
          profiles:user_id (name, profile_image_url)
        )
      `)
      .eq('post_id', postId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return { success: true, comments: data };
  } catch (error) {
    console.error('Fetch comments error:', error);
    return { success: false, error: error.message };
  }
}

// Add comment
export async function addComment(postId, content, parentCommentId = null) {
  try {
    const { user } = await getCurrentUser();
    
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          post_id: postId,
          user_id: user.id,
          content,
          parent_comment_id: parentCommentId
        }
      ])
      .select(`
        *,
        profiles:user_id (name, profile_image_url)
      `)
      .single();

    if (error) throw error;

    return { success: true, comment: data };
  } catch (error) {
    console.error('Add comment error:', error);
    return { success: false, error: error.message };
  }
}

// Update comment
export async function updateComment(commentId, content) {
  try {
    const { user } = await getCurrentUser();
    
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('comments')
      .update({ content, updated_at: new Date() })
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Update comment error:', error);
    return { success: false, error: error.message };
  }
}

// Delete comment
export async function deleteComment(commentId) {
  try {
    const { user } = await getCurrentUser();
    
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Delete comment error:', error);
    return { success: false, error: error.message };
  }
}

// Render comments
export function renderComments(comments, containerId, postId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="add-comment">
      <input type="text" id="comment-input-${postId}" 
             placeholder="Add a comment..." 
             class="comment-input">
      <button class="btn btn-primary" 
              onclick="handleAddComment('${postId}')">
        Post
      </button>
    </div>
    
    <div class="comments-list">
      ${comments.map(comment => `
        <div class="comment" data-comment-id="${comment.id}">
          <div class="comment-header">
            <img src="${comment.profiles?.profile_image_url || 'assets/images/default-avatar.png'}" 
                 alt="${comment.profiles?.name}" 
                 class="comment-avatar">
            <span class="comment-author">${comment.profiles?.name}</span>
            <span class="comment-date">
              ${new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
          
          <div class="comment-content">${comment.content}</div>
          
          <button class="btn btn-secondary btn-small" 
                  onclick="showReplyForm('${comment.id}')">
            Reply
          </button>
          
          ${comment.replies?.map(reply => `
            <div class="comment-reply">
              <div class="comment-header">
                <img src="${reply.profiles?.profile_image_url || 'assets/images/default-avatar.png'}" 
                     alt="${reply.profiles?.name}" 
                     class="comment-avatar">
                <span class="comment-author">${reply.profiles?.name}</span>
                <span class="comment-date">
                  ${new Date(reply.created_at).toLocaleDateString()}
                </span>
              </div>
              <div class="comment-content">${reply.content}</div>
            </div>
          `).join('')}
          
          <div id="reply-form-${comment.id}" class="reply-form hidden">
            <input type="text" id="reply-input-${comment.id}" 
                   placeholder="Write a reply...">
            <button class="btn btn-primary btn-small" 
                    onclick="handleAddReply('${comment.id}', '${postId}')">
              Reply
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  container.classList.remove('hidden');
}
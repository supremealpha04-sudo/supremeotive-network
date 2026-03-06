import { supabase } from '../config/supabase.js';
import { getCurrentUser, updateProfile, uploadProfileImage } from './auth.js';

// Get user profile
export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    // Get user stats
    const { count: postsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', userId);

    const { count: commentsCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: unlocksCount } = await supabase
      .from('unlocks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'approved');

    return {
      success: true,
      profile: {
        ...data,
        stats: {
          posts: postsCount || 0,
          comments: commentsCount || 0,
          unlocks: unlocksCount || 0
        }
      }
    };
  } catch (error) {
    console.error('Get profile error:', error);
    return { success: false, error: error.message };
  }
}

// Edit profile
export async function editProfile(updates, imageFile = null) {
  try {
    const { user } = await getCurrentUser();
    
    if (!user) throw new Error('Not authenticated');

    let profileImageUrl = updates.profile_image_url;

    if (imageFile) {
      const uploadResult = await uploadProfileImage(imageFile, user.id);
      if (uploadResult.success) {
        profileImageUrl = uploadResult.url;
      }
    }

    const updateResult = await updateProfile(user.id, {
      ...updates,
      profile_image_url: profileImageUrl
    });

    if (!updateResult.success) throw new Error(updateResult.error);

    return { success: true };
  } catch (error) {
    console.error('Edit profile error:', error);
    return { success: false, error: error.message };
  }
}

// Get users by country (for admin)
export async function getUsersByCountry() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('country, count')
      .group('country');

    if (error) throw error;

    return { success: true, countries: data };
  } catch (error) {
    console.error('Get users by country error:', error);
    return { success: false, error: error.message };
  }
}

// Render profile
export function renderProfile(profile, containerId, isOwnProfile = false) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="profile-card">
      <div class="profile-header">
        <img src="${profile.profile_image_url || 'assets/images/default-avatar.png'}" 
             alt="${profile.name}" 
             class="profile-avatar">
        
        <div class="profile-info">
          <h1 class="profile-name">${profile.name}</h1>
          <p class="profile-meta">
            <span>📍 ${profile.country}</span>
            <span>🎂 ${profile.age} years</span>
          </p>
          <p class="profile-bio">${profile.bio || 'No bio yet.'}</p>
          <p class="profile-joined">
            Joined ${new Date(profile.created_at).toLocaleDateString()}
          </p>
        </div>
        
        ${isOwnProfile ? `
          <button class="btn btn-primary" onclick="showEditProfile()">
            Edit Profile
          </button>
        ` : ''}
      </div>
      
      <div class="profile-stats">
        <div class="stat-item">
          <span class="stat-value">${profile.stats.posts}</span>
          <span class="stat-label">Posts</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${profile.stats.comments}</span>
          <span class="stat-label">Comments</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${profile.stats.unlocks}</span>
          <span class="stat-label">Ebooks</span>
        </div>
      </div>
    </div>
  `;
}

// Render edit profile form
export function renderEditProfile(profile, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="edit-profile-form">
      <h2>Edit Profile</h2>
      
      <form onsubmit="handleProfileUpdate(event)">
        <div class="form-group">
          <label for="name">Name</label>
          <input type="text" id="name" name="name" 
                 value="${profile.name}" required>
        </div>
        
        <div class="form-group">
          <label for="bio">Bio</label>
          <textarea id="bio" name="bio" rows="4">${profile.bio || ''}</textarea>
        </div>
        
        <div class="form-group">
          <label for="country">Country</label>
          <select id="country" name="country" required>
            ${generateCountryOptions(profile.country)}
          </select>
        </div>
        
        <div class="form-group">
          <label for="age">Age</label>
          <input type="number" id="age" name="age" 
                 value="${profile.age}" min="13" max="120" required>
        </div>
        
        <div class="form-group">
          <label for="profile-image">Profile Image</label>
          <input type="file" id="profile-image" name="profile-image" 
                 accept="image/*">
          <small>Leave empty to keep current image</small>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Save Changes</button>
          <button type="button" class="btn btn-secondary" 
                  onclick="cancelEdit()">Cancel</button>
        </div>
      </form>
    </div>
  `;
}

// Generate country options
function generateCountryOptions(selectedCountry) {
  const countries = [
    'United States', 'United Kingdom', 'Canada', 'Australia',
    'Germany', 'France', 'Spain', 'Italy', 'Japan', 'China',
    'India', 'Brazil', 'Mexico', 'South Africa', 'Nigeria',
    'Egypt', 'Saudi Arabia', 'UAE', 'Singapore', 'Malaysia'
  ];
  
  return countries.map(country => `
    <option value="${country}" ${country === selectedCountry ? 'selected' : ''}>
      ${country}
    </option>
  `).join('');
}
// js/auth.js
import { supabase } from '../config/supabase.js';

// User registration
export async function registerUser(userData) {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    });

    if (authError) throw authError;

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          name: userData.name,
          email: userData.email,
          country: userData.country,
          age: userData.age,
          bio: userData.bio || '',
          profile_image_url: userData.profileImageUrl || null,
          role: 'user'
        }
      ]);

    if (profileError) throw profileError;

    return { success: true, user: authData.user };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: error.message };
  }
}

// User login
export async function loginUser(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileError);
    }

    return { success: true, user: data.user, profile };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
}

// User logout
export async function logoutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear session storage
    sessionStorage.removeItem('user');
    
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
}

// Get current user
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile fetch error:', profileError);
      }
      
      return { user, profile: profile || null };
    }
    
    return { user: null, profile: null };
  } catch (error) {
    console.error('Get current user error:', error);
    return { user: null, profile: null };
  }
}

// Check if user is admin
export async function isAdmin(requiredRole = null) {
  try {
    const { user, profile } = await getCurrentUser();
    
    if (!user || !profile) return false;
    
    if (profile.role === 'super_admin') return true;
    
    if (requiredRole && profile.role === requiredRole) return true;
    
    if (!requiredRole && profile.role !== 'user') return true;
    
    return false;
  } catch (error) {
    console.error('Check admin error:', error);
    return false;
  }
}

// Update user profile
export async function updateProfile(userId, updates) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, error: error.message };
  }
}

// Upload profile image
export async function uploadProfileImage(file, userId) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Compress image before upload
    const compressedFile = await compressImage(file);

    const { error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(filePath, compressedFile);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('profile-images')
      .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Upload image error:', error);
    return { success: false, error: error.message };
  }
}

// Compress image helper
async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.8);
      };
    };
    reader.onerror = reject;
  });
}
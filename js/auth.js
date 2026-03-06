// js/auth.js
import {uploadProfileImage } from './upload.js';
import { supabase, isAdminEmail } from '../config/supabase.js';

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

    // Determine role based on email
    const role = isAdminEmail(userData.email) ? 'super_admin' : 'user';

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
          role: role
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

    // Get or create user profile
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    // If profile doesn't exist, create one
    if (profileError && profileError.code === 'PGRST116') {
      const role = isAdminEmail(email) ? 'super_admin' : 'user';
      
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            name: data.user.email.split('@')[0],
            email: data.user.email,
            country: 'Not specified',
            age: 18,
            bio: '',
            role: role
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;
      profile = newProfile;
    } else if (profileError) {
      throw profileError;
    }

    // Store user data in session
    const userData = {
      id: data.user.id,
      email: data.user.email,
      role: profile.role,
      name: profile.name,
      profile_image: profile.profile_image_url
    };
    
    sessionStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('user', JSON.stringify(userData));

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
    
    // Clear all storage
    sessionStorage.removeItem('user');
    localStorage.removeItem('user');
    sessionStorage.clear();
    localStorage.clear();
    
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
}

// Get current user with profile
export async function getCurrentUser() {
  try {
    // First check session storage
    const cachedUser = sessionStorage.getItem('user');
    if (cachedUser) {
      return { 
        user: JSON.parse(cachedUser), 
        profile: JSON.parse(cachedUser) 
      };
    }

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

      const userData = {
        id: user.id,
        email: user.email,
        role: profile?.role || (isAdminEmail(user.email) ? 'super_admin' : 'user'),
        name: profile?.name || user.email.split('@')[0],
        profile_image: profile?.profile_image_url,
        country: profile?.country,
        age: profile?.age,
        bio: profile?.bio,
        created_at: profile?.created_at
      };

      // Cache in session
      sessionStorage.setItem('user', JSON.stringify(userData));
      
      return { user: userData, profile: userData };
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
    const { user } = await getCurrentUser();
    
    if (!user) return false;
    
    if (user.role === 'super_admin') return true;
    
    if (requiredRole && user.role === requiredRole) return true;
    
    if (!requiredRole && user.role !== 'user') return true;
    
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
      .update({
        ...updates,
        updated_at: new Date()
      })
      .eq('id', userId);

    if (error) throw error;
    
    // Update cached user
    const { user } = await getCurrentUser();
    if (user) {
      const updatedUser = { ...user, ...updates };
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    
    return { success: true };
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, error: error.message };
  }
}

// Upload profile image
export async function uploadProfileImage(file, userId) {
  return uuploadfile(file,STORAGE_PATHS.PROFILE_IMAGES, userId, true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Compress image
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

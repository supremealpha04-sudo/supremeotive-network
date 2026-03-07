// js/auth.js
import { supabase, isAdminEmail, getAdminRole, STORAGE_PATHS, ADMINS } from '../config/supabase.js';
import { uploadFile } from './upload.js';

// User registration
export async function registerUser(userData) {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          country: userData.country,
          age: userData.age,
          bio: userData.bio || ''
        }
      }
    });

    if (authError) throw authError;

    if (!authData.user) {
      throw new Error('User creation failed');
    }

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

    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }

    // Get role from database or determine from email
    const role = profile?.role || getAdminRole(email) || 'user';

    // Create user data object
    const userData = {
      id: data.user.id,
      email: data.user.email,
      role: role,
      name: profile?.name || data.user.email.split('@')[0],
      profile_image: profile?.profile_image_url,
      country: profile?.country,
      age: profile?.age,
      bio: profile?.bio,
      created_at: profile?.created_at,
      permissions: getPermissionsForRole(role)
    };

    // Store in both localStorage and sessionStorage for persistence
    localStorage.setItem('suprememotive_user', JSON.stringify(userData));
    sessionStorage.setItem('suprememotive_user', JSON.stringify(userData));

    return { success: true, user: data.user, profile: userData };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
}

// Get permissions for a role
function getPermissionsForRole(role) {
  switch(role) {
    case 'super_admin':
      return [
        'manage_all',
        'manage_posts',
        'manage_ebooks',
        'manage_unlocks',
        'manage_admins',
        'view_analytics'
      ];
    case 'post_admin':
      return [
        'manage_posts',
        'view_analytics'
      ];
    case 'ebook_admin':
      return [
        'manage_ebooks',
        'view_analytics'
      ];
    case 'unlock_admin':
      return [
        'manage_unlocks',
        'view_analytics'
      ];
    default:
      return [];
  }
}

// User logout
export async function logoutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear all storage
    localStorage.removeItem('suprememotive_user');
    sessionStorage.removeItem('suprememotive_user');
    localStorage.removeItem('supabase.auth.token');
    
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
}

// Get current user with profile
export async function getCurrentUser() {
  try {
    // First check localStorage for cached user
    const cachedUser = localStorage.getItem('suprememotive_user');
    if (cachedUser) {
      return { user: JSON.parse(cachedUser), profile: JSON.parse(cachedUser) };
    }

    // Get session from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) throw sessionError;
    
    if (!session) {
      return { user: null, profile: null };
    }

    // Get user from Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) throw userError;
    
    if (!user) {
      return { user: null, profile: null };
    }

    // Get profile from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileError);
    }

    // Get role from profile or determine from email
    const role = profile?.role || getAdminRole(user.email) || 'user';

    // Create user data object
    const userData = {
      id: user.id,
      email: user.email,
      role: role,
      name: profile?.name || user.email.split('@')[0],
      profile_image: profile?.profile_image_url,
      country: profile?.country,
      age: profile?.age,
      bio: profile?.bio,
      created_at: profile?.created_at,
      permissions: getPermissionsForRole(role)
    };

    // Cache in localStorage
    localStorage.setItem('suprememotive_user', JSON.stringify(userData));
    
    return { user: userData, profile: userData };
  } catch (error) {
    console.error('Get current user error:', error);
    return { user: null, profile: null };
  }
}

// Check if user has specific permission
export async function hasPermission(permission) {
  try {
    const { user } = await getCurrentUser();
    
    if (!user) return false;
    
    // Super admin has all permissions
    if (user.role === 'super_admin') return true;
    
    // Check if user has the specific permission
    return user.permissions?.includes(permission) || false;
  } catch (error) {
    console.error('Check permission error:', error);
    return false;
  }
}

// Check if user is admin with specific role
export async function isAdmin(requiredRole = null) {
  try {
    const { user } = await getCurrentUser();
    
    if (!user) return false;
    
    // Super admin has all access
    if (user.role === 'super_admin') return true;
    
    // Check specific role if required
    if (requiredRole && user.role === requiredRole) return true;
    
    // If no specific role required, check if user has any admin role
    if (!requiredRole && user.role !== 'user') return true;
    
    return false;
  } catch (error) {
    console.error('Check admin error:', error);
    return false;
  }
}

// Get admin dashboard based on role
export function getAdminDashboardForRole(role) {
  switch(role) {
    case 'super_admin':
      return {
        home: 'admin/admin-dashboard.html',
        posts: 'admin/post-admin.html',
        ebooks: 'admin/ebook-admin.html',
        unlocks: 'admin/unlock-admin.html',
        users: 'admin/users-admin.html',
        settings: 'admin/settings.html'
      };
    case 'post_admin':
      return {
        home: 'admin/admin-dashboard.html',
        posts: 'admin/post-admin.html'
      };
    case 'ebook_admin':
      return {
        home: 'admin/admin-dashboard.html',
        ebooks: 'admin/ebook-admin.html'
      };
    case 'unlock_admin':
      return {
        home: 'admin/admin-dashboard.html',
        unlocks: 'admin/unlock-admin.html'
      };
    default:
      return null;
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
      localStorage.setItem('suprememotive_user', JSON.stringify(updatedUser));
      sessionStorage.setItem('suprememotive_user', JSON.stringify(updatedUser));
    }
    
    return { success: true };
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, error: error.message };
  }
}

// Upload profile image
export async function uploadProfileImage(file, userId) {
  return uploadFile(file, STORAGE_PATHS.PROFILE_IMAGES, userId, true);
}
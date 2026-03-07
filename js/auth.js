// js/auth.js
import { supabase, isAdminEmail, getAdminRole, STORAGE_PATHS } from '../config/supabase.js';
import { uploadFile } from './upload.js';

// User registration
export async function registerUser(userData) {
  try {
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
    if (!authData.user) throw new Error('User creation failed');

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

    // Get or create profile
    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (!profile) {
      const role = getAdminRole(email);
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert([{
          id: data.user.id,
          name: data.user.email.split('@')[0],
          email: data.user.email,
          role: role
        }])
        .select()
        .single();
      profile = newProfile;
    }

    const userData = {
      id: data.user.id,
      email: data.user.email,
      role: profile.role,
      name: profile.name,
      profile_image: profile.profile_image_url,
      country: profile.country,
      age: profile.age,
      bio: profile.bio,
      created_at: profile.created_at
    };

    localStorage.setItem('suprememotive_user', JSON.stringify(userData));
    sessionStorage.setItem('suprememotive_user', JSON.stringify(userData));

    return { success: true, user: data.user, profile: userData };
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
    
    localStorage.removeItem('suprememotive_user');
    sessionStorage.removeItem('suprememotive_user');
    localStorage.removeItem('supabase.auth.token');
    
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
}

// Get current user
export async function getCurrentUser() {
  try {
    const cachedUser = localStorage.getItem('suprememotive_user');
    if (cachedUser) {
      return { user: JSON.parse(cachedUser), profile: JSON.parse(cachedUser) };
    }

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    
    if (!user) return { user: null, profile: null };

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const userData = {
      id: user.id,
      email: user.email,
      role: profile?.role || getAdminRole(user.email),
      name: profile?.name || user.email.split('@')[0],
      profile_image: profile?.profile_image_url,
      country: profile?.country,
      age: profile?.age,
      bio: profile?.bio,
      created_at: profile?.created_at
    };

    localStorage.setItem('suprememotive_user', JSON.stringify(userData));
    
    return { user: userData, profile: userData };
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
    if (requiredRole) return user.role === requiredRole;
    return user.role !== 'user';
  } catch (error) {
    console.error('Check admin error:', error);
    return false;
  }
}

// Update profile
export async function updateProfile(userId, updates) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date() })
      .eq('id', userId);

    if (error) throw error;
    
    const { user } = await getCurrentUser();
    if (user) {
      const updatedUser = { ...user, ...updates };
      localStorage.setItem('suprememotive_user', JSON.stringify(updatedUser));
    }
    
    return { success: true };
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, error: error.message };
  }
}

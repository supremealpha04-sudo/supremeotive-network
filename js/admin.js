import { supabase } from '../config/supabase.js';
import { getCurrentUser } from './auth.js';

// Get dashboard stats
export async function getDashboardStats() {
  try {
    // Total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Total posts
    const { count: totalPosts } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    // Total ebooks
    const { count: totalEbooks } = await supabase
      .from('ebooks')
      .select('*', { count: 'exact', head: true });

    // Pending unlocks
    const { count: pendingUnlocks } = await supabase
      .from('unlocks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Users by country
    const { data: usersByCountry } = await supabase
      .from('profiles')
      .select('country')
      .then(result => {
        const counts = {};
        result.data?.forEach(profile => {
          counts[profile.country] = (counts[profile.country] || 0) + 1;
        });
        return { data: counts };
      });

    return {
      success: true,
      stats: {
        totalUsers: totalUsers || 0,
        totalPosts: totalPosts || 0,
        totalEbooks: totalEbooks || 0,
        pendingUnlocks: pendingUnlocks || 0,
        usersByCountry: usersByCountry || {}
      }
    };
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return { success: false, error: error.message };
  }
}

// Get pending unlock requests
export async function getPendingUnlocks() {
  try {
    const { data, error } = await supabase
      .from('unlocks')
      .select(`
        *,
        profiles:user_id (name, email),
        ebooks:ebook_id (title)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, unlocks: data };
  } catch (error) {
    console.error('Get pending unlocks error:', error);
    return { success: false, error: error.message };
  }
}

// Approve unlock request
export async function approveUnlock(unlockId, adminNotes = '') {
  try {
    const { user } = await getCurrentUser();
    
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('unlocks')
      .update({
        status: 'approved',
        admin_notes: adminNotes,
        updated_at: new Date()
      })
      .eq('id', unlockId);

    if (error) throw error;

    // Log admin action
    await supabase
      .from('admin_audit_log')
      .insert([
        {
          admin_id: user.id,
          action: 'APPROVE_UNLOCK',
          details: { unlock_id: unlockId }
        }
      ]);

    return { success: true };
  } catch (error) {
    console.error('Approve unlock error:', error);
    return { success: false, error: error.message };
  }
}

// Reject unlock request
export async function rejectUnlock(unlockId, reason = '') {
  try {
    const { user } = await getCurrentUser();
    
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('unlocks')
      .update({
        status: 'rejected',
        admin_notes: reason,
        updated_at: new Date()
      })
      .eq('id', unlockId);

    if (error) throw error;

    // Log admin action
    await supabase
      .from('admin_audit_log')
      .insert([
        {
          admin_id: user.id,
          action: 'REJECT_UNLOCK',
          details: { unlock_id: unlockId, reason }
        }
      ]);

    return { success: true };
  } catch (error) {
    console.error('Reject unlock error:', error);
    return { success: false, error: error.message };
  }
}

// Get all users (for super admin)
export async function getAllUsers() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, users: data };
  } catch (error) {
    console.error('Get all users error:', error);
    return { success: false, error: error.message };
  }
}

// Update user role (super admin only)
export async function updateUserRole(userId, newRole) {
  try {
    const { user } = await getCurrentUser();
    
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) throw error;

    // Log admin action
    await supabase
      .from('admin_audit_log')
      .insert([
        {
          admin_id: user.id,
          action: 'UPDATE_USER_ROLE',
          details: { user_id: userId, new_role: newRole }
        }
      ]);

    return { success: true };
  } catch (error) {
    console.error('Update user role error:', error);
    return { success: false, error: error.message };
  }
}

// Render admin dashboard
export function renderAdminDashboard(stats, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="admin-stats">
      <div class="stat-card">
        <div class="stat-value">${stats.totalUsers}</div>
        <div class="stat-label">Total Users</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">${stats.totalPosts}</div>
        <div class="stat-label">Total Posts</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">${stats.totalEbooks}</div>
        <div class="stat-label">Total Ebooks</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">${stats.pendingUnlocks}</div>
        <div class="stat-label">Pending Unlocks</div>
      </div>
    </div>
    
    <div class="admin-section">
      <h2>Users by Country</h2>
      <div class="country-stats">
        ${Object.entries(stats.usersByCountry).map(([country, count]) => `
          <div class="country-item">
            <span class="country-name">${country}</span>
            <span class="country-count">${count}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Render unlock requests
export function renderUnlockRequests(unlocks, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>User</th>
          <th>Ebook</th>
          <th>Request Date</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${unlocks.map(unlock => `
          <tr>
            <td>${unlock.profiles?.name}<br>
                <small>${unlock.profiles?.email}</small></td>
            <td>${unlock.ebooks?.title}</td>
            <td>${new Date(unlock.created_at).toLocaleDateString()}</td>
            <td>
              <span class="status-badge status-${unlock.status}">
                ${unlock.status}
              </span>
            </td>
            <td>
              <div class="admin-actions">
                <button class="admin-btn admin-btn-approve" 
                        onclick="handleApproveUnlock('${unlock.id}')">
                  Approve
                </button>
                <button class="admin-btn admin-btn-reject" 
                        onclick="handleRejectUnlock('${unlock.id}')">
                  Reject
                </button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}